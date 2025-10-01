"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResultsPublicationStatus = exports.publishClassroomResults = exports.getRecentActivity = exports.reassignTeacher = exports.getAttendanceComparison = exports.getSchoolDays = exports.getClassrooms = exports.getClassroomStudents = exports.removeStudentFromClassroom = exports.removeStudentsFromClassroom = exports.addStudentsToClassroom = exports.assignStudents = exports.createClassroom = void 0;
const Classroom_1 = require("../../models/Classroom");
const User_1 = require("../../models/User");
const Student_1 = require("../../models/Student");
const AuditLog_1 = require("../../models/AuditLog");
const Term_1 = require("../../models/Term");
const Attendance_1 = require("../../models/Attendance");
// @desc    Create a new classroom
// @route   POST /api/admin/classrooms
// @access  Private/Admin
const createClassroom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, teacherId, timetable } = req.body;
        //  Step 1: Validate classroom name
        if (!Classroom_1.ALLOWED_CLASSROOMS.includes(name)) {
            return res.status(400).json({
                message: `Invalid class name. Allowed: ${Classroom_1.ALLOWED_CLASSROOMS.join(", ")}`,
            });
        }
        //  Check if classroom name already exists
        const existingClassroom = yield Classroom_1.Classroom.findOne({ name });
        if (existingClassroom) {
            return res
                .status(400)
                .json({ message: `Classroom "${name}" already exists` });
        }
        // Check if teacher exists and is actually a teacher
        const teacher = yield User_1.User.findOne({ _id: teacherId, role: "teacher" });
        if (!teacher) {
            return res
                .status(404)
                .json({ message: "Teacher not found or invalid role" });
        }
        const classroom = yield Classroom_1.Classroom.create({
            name,
            teacherId,
            timetable: timetable || [],
            students: [],
        });
        // Update teacher's assigned class
        yield User_1.User.findByIdAndUpdate(teacherId, { assignedClassId: classroom._id });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "CLASSROOM_CREATE",
            description: `Created new classroom ${name} with teacher ${teacher.name}`,
            targetId: classroom._id,
        });
        res.status(201).json(classroom);
    }
    catch (error) {
        if (error.code === 11000) {
            return res
                .status(400)
                .json({ message: "Classroom name already exists (duplicate)" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
        console.log(error.message);
    }
});
exports.createClassroom = createClassroom;
// @desc    Assign students to classroom (complete replacement)
// @route   POST /api/admin/classrooms/:id/students
// @access  Private/Admin
const assignStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentIds } = req.body;
        const classroomId = req.params.id;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Verify all students exist
        const students = yield Student_1.Student.find({ _id: { $in: studentIds } });
        if (students.length !== studentIds.length) {
            return res
                .status(400)
                .json({ message: "One or more students not found" });
        }
        // Check if any students are already assigned to other classrooms
        const studentsWithOtherAssignments = yield Student_1.Student.find({
            _id: { $in: studentIds },
            $and: [
                { classroomId: { $exists: true } },
                { classroomId: { $ne: null } },
                { classroomId: { $ne: classroomId } },
            ],
        });
        if (studentsWithOtherAssignments.length > 0) {
            const studentNames = studentsWithOtherAssignments
                .map((s) => s.fullName)
                .join(", ");
            return res.status(400).json({
                message: `Students already assigned to other classrooms: ${studentNames}. Please remove them from their current classrooms first.`,
            });
        }
        // Get previously assigned students for audit log
        const previousStudentIds = classroom.students.map((id) => id.toString());
        // Update classroom students
        classroom.students = studentIds;
        yield classroom.save();
        // Update each student's current class and classroomId
        yield Student_1.Student.updateMany({ _id: { $in: studentIds } }, {
            currentClass: classroom.name,
            classroomId: classroomId,
        });
        // Clear currentClass and classroomId for students no longer in this classroom
        const removedStudentIds = previousStudentIds.filter((id) => !studentIds.includes(id));
        if (removedStudentIds.length > 0) {
            yield Student_1.Student.updateMany({ _id: { $in: removedStudentIds } }, {
                currentClass: "",
                classroomId: null,
            });
        }
        // Create audit log
        const addedCount = studentIds.filter((id) => !previousStudentIds.includes(id)).length;
        const removedCount = removedStudentIds.length;
        let description = `Updated classroom ${classroom.name} student assignments`;
        if (addedCount > 0)
            description += ` - Added ${addedCount} students`;
        if (removedCount > 0)
            description += ` - Removed ${removedCount} students`;
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "STUDENTS_ASSIGN",
            description,
            targetId: classroom._id,
        });
        res.json(classroom);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.assignStudents = assignStudents;
// @desc    Add students to classroom (individual add operation)
// @route   POST /api/admin/classrooms/:id/students/add
// @access  Private/Admin
const addStudentsToClassroom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentIds } = req.body;
        const classroomId = req.params.id;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Verify all students exist
        const students = yield Student_1.Student.find({ _id: { $in: studentIds } });
        if (students.length !== studentIds.length) {
            return res
                .status(400)
                .json({ message: "One or more students not found" });
        }
        // Check if any students are already assigned to other classrooms
        const studentsWithOtherAssignments = yield Student_1.Student.find({
            _id: { $in: studentIds },
            $and: [
                { classroomId: { $exists: true } },
                { classroomId: { $ne: null } },
                { classroomId: { $ne: classroomId } },
            ],
        });
        if (studentsWithOtherAssignments.length > 0) {
            const studentNames = studentsWithOtherAssignments
                .map((s) => s.fullName)
                .join(", ");
            return res.status(400).json({
                message: `Students already assigned to other classrooms: ${studentNames}. Please remove them from their current classrooms first.`,
            });
        }
        // Filter out students who are already in this classroom
        const currentStudentIds = classroom.students.map((id) => id.toString());
        const newStudentIds = studentIds.filter((id) => !currentStudentIds.includes(id));
        if (newStudentIds.length === 0) {
            return res.status(400).json({
                message: "All selected students are already in this classroom",
            });
        }
        // Add new students to classroom
        classroom.students = [...classroom.students, ...newStudentIds];
        yield classroom.save();
        // Update each new student's current class and classroomId
        yield Student_1.Student.updateMany({ _id: { $in: newStudentIds } }, {
            currentClass: classroom.name,
            classroomId: classroomId,
        });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "STUDENTS_ADDED_TO_CLASSROOM",
            description: `Added ${newStudentIds.length} students to classroom ${classroom.name}`,
            targetId: classroom._id,
        });
        res.json({
            message: `${newStudentIds.length} students added to classroom successfully`,
            classroom,
            addedStudents: newStudentIds.length,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.addStudentsToClassroom = addStudentsToClassroom;
// @desc    Remove students from classroom (bulk remove operation)
// @route   POST /api/admin/classrooms/:id/students/remove
// @access  Private/Admin
const removeStudentsFromClassroom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentIds } = req.body;
        const classroomId = req.params.id;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check if students exist and are in this classroom
        const currentStudentIds = classroom.students.map((id) => id.toString());
        const validStudentIds = studentIds.filter((id) => currentStudentIds.includes(id));
        if (validStudentIds.length === 0) {
            return res.status(400).json({
                message: "None of the selected students are in this classroom",
            });
        }
        // Remove students from classroom
        classroom.students = classroom.students.filter((id) => !validStudentIds.includes(id.toString()));
        yield classroom.save();
        // Update students' current class and classroomId to empty
        yield Student_1.Student.updateMany({ _id: { $in: validStudentIds } }, {
            currentClass: "",
            classroomId: null,
        });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "STUDENTS_REMOVED_FROM_CLASSROOM",
            description: `Removed ${validStudentIds.length} students from classroom ${classroom.name}`,
            targetId: classroom._id,
        });
        res.json({
            message: `${validStudentIds.length} students removed from classroom successfully`,
            classroom,
            removedStudents: validStudentIds.length,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.removeStudentsFromClassroom = removeStudentsFromClassroom;
// @desc    Remove student from classroom
// @route   DELETE /api/admin/classrooms/:classroomId/students/:studentId
// @access  Private/Admin
const removeStudentFromClassroom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const classroomId = req.params.classroomId;
        const studentId = req.params.studentId;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check if student exists
        const student = yield Student_1.Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Check if student is actually in this classroom
        if (!classroom.students.includes(studentId)) {
            return res
                .status(400)
                .json({ message: "Student is not in this classroom" });
        }
        // Remove student from classroom
        classroom.students = classroom.students.filter((id) => id.toString() !== studentId);
        yield classroom.save();
        // Update student's current class and classroomId to empty
        yield Student_1.Student.findByIdAndUpdate(studentId, {
            currentClass: "",
            classroomId: null,
        });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "STUDENT_REMOVED_FROM_CLASSROOM",
            description: `Removed student ${student.fullName} from classroom ${classroom.name}`,
            targetId: classroom._id,
        });
        res.json({
            message: "Student removed from classroom successfully",
            classroom,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.removeStudentFromClassroom = removeStudentFromClassroom;
// @desc    Get students for a specific classroom
// @route   GET /api/admin/classrooms/:id/students
// @access  Private/Admin/Teacher
const getClassroomStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions: admin/superadmin can access any classroom, teachers only their own
        if (userRole === "teacher" &&
            classroom.teacherId.toString() !== (userId === null || userId === void 0 ? void 0 : userId.toString())) {
            return res.status(403).json({
                message: "You don't have permission to access this classroom",
            });
        }
        // Get students for this classroom
        const students = yield Student_1.Student.find({ _id: { $in: classroom.students } })
            .select("fullName studentId currentClass status createdAt")
            .sort({ fullName: 1 });
        res.json({
            classroom: {
                _id: classroom._id,
                name: classroom.name,
            },
            students,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getClassroomStudents = getClassroomStudents;
// @desc    Get all classrooms with teacher and student details
// @route   GET /api/admin/classrooms
// @access  Private/Admin
const getClassrooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classrooms = yield Classroom_1.Classroom.find()
            .populate("teacherId", "name email")
            .populate("students", "fullName studentId");
        res.json(classrooms);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getClassrooms = getClassrooms;
// @desc    Get school days count for a classroom
// @route   GET /api/admin/classrooms/:id/school-days
// @access  Private/Admin/Teacher
const getSchoolDays = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions
        if (!["admin", "superadmin"].includes(req.user.role) &&
            classroom.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to view classroom data",
            });
        }
        // Get current active term
        const currentTerm = yield Term_1.Term.findOne({ isActive: true });
        if (!currentTerm) {
            return res.status(404).json({ message: "No active term found" });
        }
        // Calculate working days (Monday to Friday)
        const startDate = new Date(currentTerm.startDate);
        const endDate = new Date(currentTerm.endDate);
        let schoolDays = 0;
        // Count weekdays excluding holidays
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            // Count weekdays (Monday = 1, Friday = 5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Check if this date falls within any holiday
                const isHoliday = currentTerm.holidays.some((holiday) => {
                    const holidayStart = new Date(holiday.startDate);
                    const holidayEnd = new Date(holiday.endDate);
                    return date >= holidayStart && date <= holidayEnd;
                });
                if (!isHoliday) {
                    schoolDays++;
                }
            }
        }
        res.json({
            classroomId: id,
            term: {
                name: currentTerm.name,
                year: currentTerm.year,
                startDate: currentTerm.startDate,
                endDate: currentTerm.endDate,
            },
            schoolDays,
            totalTermDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        });
    }
    catch (error) {
        console.error("Error calculating school days:", error);
        res.status(500).json({
            message: "Failed to calculate school days",
            error: error.message,
        });
    }
});
exports.getSchoolDays = getSchoolDays;
// @desc    Get attendance comparison for a classroom
// @route   GET /api/admin/classrooms/:id/attendance-comparison
// @access  Private/Admin/Teacher
const getAttendanceComparison = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions
        if (!["admin", "superadmin"].includes(req.user.role) &&
            classroom.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to view classroom data",
            });
        }
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        // Calculate current month date range
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        // Calculate previous month date range
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthStart = new Date(prevYear, prevMonth, 1);
        const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59);
        // Get attendance records for both months
        const [currentMonthAttendance, prevMonthAttendance] = yield Promise.all([
            Attendance_1.Attendance.find({
                classroomId: id,
                date: { $gte: currentMonthStart, $lte: currentMonthEnd },
            }),
            Attendance_1.Attendance.find({
                classroomId: id,
                date: { $gte: prevMonthStart, $lte: prevMonthEnd },
            }),
        ]);
        // Calculate attendance rates
        const calculateAttendanceRate = (records) => {
            if (records.length === 0)
                return 0;
            let totalPresent = 0;
            let totalStudents = 0;
            records.forEach((record) => {
                totalStudents += record.records.length;
                totalPresent += record.records.filter((r) => r.status === "present" || r.status === "late").length;
            });
            return totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
        };
        const currentRate = calculateAttendanceRate(currentMonthAttendance);
        const previousRate = calculateAttendanceRate(prevMonthAttendance);
        const change = currentRate - previousRate;
        res.json({
            classroomId: id,
            currentMonth: {
                month: currentMonth + 1,
                year: currentYear,
                attendanceRate: Math.round(currentRate * 100) / 100,
                totalDays: currentMonthAttendance.length,
            },
            previousMonth: {
                month: prevMonth + 1,
                year: prevYear,
                attendanceRate: Math.round(previousRate * 100) / 100,
                totalDays: prevMonthAttendance.length,
            },
            comparison: {
                change: Math.round(change * 100) / 100,
                changePercent: previousRate > 0
                    ? Math.round((change / previousRate) * 100 * 100) / 100
                    : 0,
                trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
            },
        });
    }
    catch (error) {
        console.error("Error calculating attendance comparison:", error);
        res.status(500).json({
            message: "Failed to calculate attendance comparison",
            error: error.message,
        });
    }
});
exports.getAttendanceComparison = getAttendanceComparison;
// @desc    Reassign teacher to classroom
// @route   PUT /api/admin/classrooms/:id/reassign-teacher
// @access  Private/Admin
const reassignTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { teacherId } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // If teacherId is provided, validate the teacher exists and is a teacher
        if (teacherId) {
            const teacher = yield User_1.User.findOne({ _id: teacherId, role: "teacher" });
            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found" });
            }
        }
        const oldTeacherId = (_a = classroom.teacherId) === null || _a === void 0 ? void 0 : _a.toString();
        // Update classroom with new teacher assignment
        classroom.teacherId = teacherId || null;
        yield classroom.save();
        // Update teacher's assigned classes
        if (teacherId) {
            // Add classroom to new teacher's assignedClasses
            yield User_1.User.findByIdAndUpdate(teacherId, {
                $addToSet: { assignedClasses: id },
            });
        }
        // Remove classroom from old teacher's assignedClasses if it exists
        if (oldTeacherId && oldTeacherId !== teacherId) {
            yield User_1.User.findByIdAndUpdate(oldTeacherId, {
                $pull: { assignedClasses: id },
            });
        }
        // Get teacher name for audit log
        let teacherName = "None";
        if (teacherId) {
            const teacher = yield User_1.User.findById(teacherId);
            teacherName = (teacher === null || teacher === void 0 ? void 0 : teacher.name) || "Unknown";
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "CLASSROOM_TEACHER_REASSIGN",
            description: `Reassigned teacher to classroom ${classroom.name}: ${teacherName}`,
            targetId: classroom._id,
        });
        res.json({
            message: `Teacher reassigned successfully to ${classroom.name}`,
            classroom,
        });
    }
    catch (error) {
        console.error("Error reassigning teacher:", error);
        res.status(500).json({
            message: "Failed to reassign teacher",
            error: error.message,
        });
    }
});
exports.reassignTeacher = reassignTeacher;
// @desc    Get recent activity for a classroom
// @route   GET /api/admin/classrooms/:id/recent-activity
// @access  Private/Admin/Teacher
const getRecentActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { limit = 10 } = req.query;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions
        if (!["admin", "superadmin"].includes(req.user.role) &&
            classroom.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to view classroom data",
            });
        }
        // Get recent audit logs for this classroom
        const recentActivity = yield AuditLog_1.AuditLog.find({
            targetId: id,
        })
            .populate("userId", "name email")
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .select("actionType description timestamp userId");
        // Transform the data for frontend consumption
        const activities = recentActivity.map((log) => ({
            id: log._id,
            type: log.actionType,
            description: log.description,
            timestamp: log.timestamp,
            user: log.userId
                ? {
                    name: log.userId.name,
                    email: log.userId.email,
                }
                : null,
        }));
        res.json({
            classroomId: id,
            activities,
            total: activities.length,
        });
    }
    catch (error) {
        console.error("Error fetching recent activity:", error);
        res.status(500).json({
            message: "Failed to fetch recent activity",
            error: error.message,
        });
    }
});
exports.getRecentActivity = getRecentActivity;
// @desc    Publish/unpublish classroom results
// @route   PATCH /api/admin/classrooms/:id/results/publish
// @access  Private/Admin
const publishClassroomResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { term, year, published } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // For now, we'll return a success response
        // Real implementation would toggle the 'viewable' field on termFees for this classroom/term/year
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: published ? "RESULTS_PUBLISHED" : "RESULTS_UNPUBLISHED",
            description: `${published ? "Published" : "Unpublished"} results for ${classroom.name} - ${term} ${year}`,
            targetId: classroom._id,
        });
        res.json({
            message: `Results ${published ? "published" : "unpublished"} successfully`,
            classroomId: id,
            term,
            year,
            published,
        });
    }
    catch (error) {
        console.error("Error publishing results:", error);
        res.status(500).json({
            message: "Failed to publish results",
            error: error.message,
        });
    }
});
exports.publishClassroomResults = publishClassroomResults;
// @desc    Get publication status for classroom results
// @route   GET /api/admin/classrooms/:id/results/publication-status
// @access  Private/Admin
const getResultsPublicationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { term, year } = req.query;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // For now, return mock data - real implementation would check if results are published
        // This would check the 'viewable' field on termFees records for this classroom/term/year
        const isPublished = Math.random() > 0.5; // Mock for now
        res.json({
            classroomId: id,
            term,
            year,
            published: isPublished,
        });
    }
    catch (error) {
        console.error("Error fetching publication status:", error);
        res.status(500).json({
            message: "Failed to fetch publication status",
            error: error.message,
        });
    }
});
exports.getResultsPublicationStatus = getResultsPublicationStatus;
