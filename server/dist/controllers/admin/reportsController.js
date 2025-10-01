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
exports.getOverallReport = exports.getClassroomReport = exports.getTeacherReport = exports.getStudentReport = exports.getAttendanceReport = void 0;
const Attendance_1 = require("../../models/Attendance");
const Classroom_1 = require("../../models/Classroom");
const Student_1 = require("../../models/Student");
const User_1 = require("../../models/User");
const Timetable_1 = require("../../models/Timetable");
// Get attendance reports
const getAttendanceReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId, startDate, endDate, period = "month" } = req.query;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Build date range based on period
        const now = new Date();
        let start;
        let end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        }
        else {
            switch (period) {
                case "week":
                    start = new Date(now.setDate(now.getDate() - 7));
                    end = new Date();
                    break;
                case "quarter":
                    start = new Date(now.setMonth(now.getMonth() - 3));
                    end = new Date();
                    break;
                case "year":
                    start = new Date(now.setFullYear(now.getFullYear() - 1));
                    end = new Date();
                    break;
                default: // month
                    start = new Date(now.setMonth(now.getMonth() - 1));
                    end = new Date();
            }
        }
        // Build query
        const query = {
            date: { $gte: start, $lte: end },
        };
        if (classroomId) {
            // Verify user has access to this classroom
            const classroom = yield Classroom_1.Classroom.findById(classroomId);
            if (!classroom) {
                return res.status(404).json({ message: "Classroom not found" });
            }
            if (req.user.role !== "admin" &&
                classroom.teacherId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "Not authorized to view attendance for this classroom",
                });
            }
            query.classroomId = classroomId;
        }
        else if (req.user.role !== "admin") {
            // Non-admin users can only see attendance for their classrooms
            const userClassrooms = yield Classroom_1.Classroom.find({ teacherId: req.user._id });
            query.classroomId = { $in: userClassrooms.map((c) => c._id) };
        }
        const attendanceRecords = yield Attendance_1.Attendance.find(query)
            .populate("classroomId", "name")
            .populate("records.studentId", "fullName studentId")
            .sort({ date: -1 });
        // Calculate statistics
        const totalDays = attendanceRecords.length;
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalStudents = 0;
        const studentStats = {};
        attendanceRecords.forEach((record) => {
            record.records.forEach((rec) => {
                var _a, _b, _c;
                const studentId = ((_b = (_a = rec.studentId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = rec.studentId) === null || _c === void 0 ? void 0 : _c.toString());
                if (!studentId)
                    return; // Skip if studentId is not available
                if (!studentStats[studentId]) {
                    studentStats[studentId] = {
                        present: 0,
                        absent: 0,
                        late: 0,
                        total: 0,
                    };
                }
                studentStats[studentId].total++;
                if (rec.status === "present")
                    studentStats[studentId].present++;
                else if (rec.status === "absent")
                    studentStats[studentId].absent++;
                else if (rec.status === "late")
                    studentStats[studentId].late++;
            });
            totalPresent += record.records.filter((r) => r.status === "present").length;
            totalAbsent += record.records.filter((r) => r.status === "absent").length;
            totalLate += record.records.filter((r) => r.status === "late").length;
            totalStudents = Math.max(totalStudents, record.records.length);
        });
        const averageAttendance = totalStudents > 0
            ? ((totalPresent + totalLate) / (totalStudents * totalDays)) * 100
            : 0;
        // Get top and low performers
        const studentList = Object.entries(studentStats).map(([studentId, stats]) => (Object.assign(Object.assign({ studentId }, stats), { attendanceRate: stats.total > 0
                ? ((stats.present + stats.late) / stats.total) * 100
                : 0 })));
        const topPerformersRaw = studentList
            .sort((a, b) => b.attendanceRate - a.attendanceRate)
            .slice(0, 5);
        const lowPerformersRaw = studentList
            .filter((s) => s.attendanceRate < 80)
            .sort((a, b) => a.attendanceRate - b.attendanceRate)
            .slice(0, 5);
        // Get student names
        const studentIds = [
            ...new Set([
                ...topPerformersRaw.map((p) => p.studentId),
                ...lowPerformersRaw.map((p) => p.studentId),
            ]),
        ];
        const students = yield Student_1.Student.find({ _id: { $in: studentIds } }).select("fullName");
        const studentMap = students.reduce((map, s) => {
            map[String(s._id)] = s.fullName;
            return map;
        }, {});
        const topPerformers = topPerformersRaw.map((p) => ({
            name: studentMap[p.studentId] || "Unknown",
            rate: Math.round(p.attendanceRate * 100) / 100,
        }));
        const lowPerformers = lowPerformersRaw.map((p) => ({
            name: studentMap[p.studentId] || "Unknown",
            rate: Math.round(p.attendanceRate * 100) / 100,
        }));
        res.json({
            totalDays,
            averageAttendance: Math.round(averageAttendance * 100) / 100,
            attendanceTrend: 0, // TODO: calculate trend
            topPerformers,
            lowPerformers,
        });
    }
    catch (error) {
        console.error("Error generating attendance report:", error);
        res.status(500).json({
            message: "Failed to generate attendance report",
            error: error.message,
        });
    }
});
exports.getAttendanceReport = getAttendanceReport;
// Get student reports
const getStudentReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId } = req.query;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Build query
        const query = {};
        if (classroomId) {
            query.classroomId = classroomId;
        }
        else if (req.user.role !== "admin") {
            // Non-admin users can only see students from their classrooms
            const userClassrooms = yield Classroom_1.Classroom.find({ teacherId: req.user._id });
            query.classroomId = { $in: userClassrooms.map((c) => c._id) };
        }
        const students = yield Student_1.Student.find(query)
            .populate("classroomId", "name")
            .sort({ fullName: 1 });
        // Get attendance stats for each student
        const studentReports = yield Promise.all(students.map((student) => __awaiter(void 0, void 0, void 0, function* () {
            const attendanceRecords = yield Attendance_1.Attendance.find({
                "records.studentId": student._id,
            });
            let present = 0;
            let absent = 0;
            let late = 0;
            const totalDays = attendanceRecords.length;
            attendanceRecords.forEach((record) => {
                const studentRecord = record.records.find((r) => r.studentId.toString() === student._id.toString());
                if (studentRecord) {
                    if (studentRecord.status === "present")
                        present++;
                    else if (studentRecord.status === "absent")
                        absent++;
                    else if (studentRecord.status === "late")
                        late++;
                }
            });
            const attendanceRate = totalDays > 0 ? ((present + late) / totalDays) * 100 : 0;
            return {
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    studentId: student.studentId,
                    classroom: student.classroomId,
                },
                attendance: {
                    totalDays,
                    present,
                    absent,
                    late,
                    attendanceRate: Math.round(attendanceRate * 100) / 100,
                },
            };
        })));
        // Calculate active students (those with attendance records)
        const activeStudents = studentReports.filter((report) => report.attendance.totalDays > 0).length;
        res.json({
            totalStudents: students.length,
            activeStudents,
            newEnrollments: 0, // TODO: calculate based on creation date
            studentGrowth: 0, // TODO: calculate growth rate
        });
    }
    catch (error) {
        console.error("Error generating student report:", error);
        res.status(500).json({
            message: "Failed to generate student report",
            error: error.message,
        });
    }
});
exports.getStudentReport = getStudentReport;
// Get teacher reports
const getTeacherReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Only admins can view teacher reports
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only administrators can view teacher reports" });
        }
        const teachers = yield User_1.User.find({ role: "teacher" })
            .select("name email")
            .sort({ name: 1 });
        const teacherReports = yield Promise.all(teachers.map((teacher) => __awaiter(void 0, void 0, void 0, function* () {
            // Get teacher's classrooms
            const classrooms = yield Classroom_1.Classroom.find({ teacherId: teacher._id });
            // Get timetable entries for this teacher
            const timetableEntries = yield Timetable_1.Timetable.find({
                teacherId: teacher._id,
            });
            // Calculate workload
            const totalPeriods = timetableEntries.length;
            const averageWorkload = totalPeriods / 5; // Assuming 5 working days
            // Get attendance records for teacher's classrooms
            const attendanceRecords = yield Attendance_1.Attendance.find({
                classroomId: { $in: classrooms.map((c) => c._id) },
            });
            return {
                teacher: {
                    _id: teacher._id,
                    name: teacher.name,
                    email: teacher.email,
                },
                classrooms: classrooms.length,
                totalPeriods,
                averageWorkload: Math.round(averageWorkload * 100) / 100,
                timetableEntries: timetableEntries.length,
            };
        })));
        const activeTeachers = teacherReports.filter((report) => report.classrooms > 0).length;
        const averageWorkload = teacherReports.length > 0
            ? teacherReports.reduce((sum, r) => sum + r.averageWorkload, 0) /
                teacherReports.length
            : 0;
        res.json({
            totalTeachers: teachers.length,
            activeTeachers,
            averageWorkload: Math.round(averageWorkload * 100) / 100,
            teacherUtilization: 0, // TODO: calculate utilization
        });
    }
    catch (error) {
        console.error("Error generating teacher report:", error);
        res.status(500).json({
            message: "Failed to generate teacher report",
            error: error.message,
        });
    }
});
exports.getTeacherReport = getTeacherReport;
// Get classroom reports
const getClassroomReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId } = req.query;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Build query
        const query = {};
        if (classroomId) {
            query._id = classroomId;
        }
        else if (req.user.role !== "admin") {
            // Non-admin users can only see their own classrooms
            query.teacherId = req.user._id;
        }
        const classrooms = yield Classroom_1.Classroom.find(query)
            .populate("teacherId", "name email")
            .sort({ name: 1 });
        const classroomReports = yield Promise.all(classrooms.map((classroom) => __awaiter(void 0, void 0, void 0, function* () {
            // Get students in this classroom
            const students = yield Student_1.Student.find({ classroomId: classroom._id });
            // Get attendance records
            const attendanceRecords = yield Attendance_1.Attendance.find({
                classroomId: classroom._id,
            });
            // Get timetable entries
            const timetableEntries = yield Timetable_1.Timetable.find({
                classroomId: classroom._id,
            });
            // Calculate attendance stats
            let totalPresent = 0;
            let totalAbsent = 0;
            let totalLate = 0;
            attendanceRecords.forEach((record) => {
                totalPresent += record.records.filter((r) => r.status === "present").length;
                totalAbsent += record.records.filter((r) => r.status === "absent").length;
                totalLate += record.records.filter((r) => r.status === "late").length;
            });
            const totalAttendanceRecords = attendanceRecords.length * students.length;
            const averageAttendance = totalAttendanceRecords > 0
                ? ((totalPresent + totalLate) / totalAttendanceRecords) * 100
                : 0;
            return {
                classroom: {
                    _id: classroom._id,
                    name: classroom.name,
                    teacher: classroom.teacherId,
                },
                students: students.length,
                attendance: {
                    totalDays: attendanceRecords.length,
                    averageAttendance: Math.round(averageAttendance * 100) / 100,
                    totalPresent,
                    totalAbsent,
                    totalLate,
                },
                timetable: {
                    totalPeriods: timetableEntries.length,
                    subjects: [...new Set(timetableEntries.map((t) => t.subject))],
                },
            };
        })));
        const totalClasses = classrooms.length;
        const averageClassSize = classroomReports.length > 0
            ? classroomReports.reduce((sum, r) => sum + r.students, 0) /
                classroomReports.length
            : 0;
        const utilizationRate = classroomReports.length > 0
            ? classroomReports.reduce((sum, r) => sum + r.attendance.averageAttendance, 0) / classroomReports.length
            : 0;
        res.json({
            totalClasses,
            averageClassSize: Math.round(averageClassSize * 100) / 100,
            utilizationRate: Math.round(utilizationRate * 100) / 100,
            scheduleEfficiency: 0, // TODO: calculate schedule efficiency
        });
    }
    catch (error) {
        console.error("Error generating classroom report:", error);
        res.status(500).json({
            message: "Failed to generate classroom report",
            error: error.message,
        });
    }
});
exports.getClassroomReport = getClassroomReport;
// Get overall school report
const getOverallReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Only admins can view overall reports
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only administrators can view overall school reports",
            });
        }
        // Get all data
        const [totalStudents, totalTeachers, totalClassrooms, totalAttendanceRecords, totalTimetableEntries,] = yield Promise.all([
            Student_1.Student.countDocuments(),
            User_1.User.countDocuments({ role: "teacher" }),
            Classroom_1.Classroom.countDocuments(),
            Attendance_1.Attendance.countDocuments(),
            Timetable_1.Timetable.countDocuments(),
        ]);
        // Calculate attendance statistics
        const attendanceRecords = yield Attendance_1.Attendance.find({});
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        attendanceRecords.forEach((record) => {
            totalPresent += record.records.filter((r) => r.status === "present").length;
            totalAbsent += record.records.filter((r) => r.status === "absent").length;
            totalLate += record.records.filter((r) => r.status === "late").length;
        });
        const totalAttendanceEntries = attendanceRecords.reduce((sum, record) => sum + record.records.length, 0);
        const averageAttendance = totalAttendanceEntries > 0
            ? ((totalPresent + totalLate) / totalAttendanceEntries) * 100
            : 0;
        // Calculate utilization rates
        const teacherUtilization = totalTeachers > 0
            ? (totalTimetableEntries / (totalTeachers * 40)) * 100
            : 0; // Assuming 40 periods per teacher per week
        const classroomUtilization = totalClassrooms > 0
            ? (totalTimetableEntries / (totalClassrooms * 40)) * 100
            : 0; // Assuming 40 periods per classroom per week
        res.json({
            overview: {
                totalStudents,
                totalTeachers,
                totalClassrooms,
                totalAttendanceRecords,
                totalTimetableEntries,
            },
            attendance: {
                averageAttendance: Math.round(averageAttendance * 100) / 100,
                totalPresent,
                totalAbsent,
                totalLate,
                totalDays: attendanceRecords.length,
            },
            utilization: {
                teacherUtilization: Math.round(teacherUtilization * 100) / 100,
                classroomUtilization: Math.round(classroomUtilization * 100) / 100,
            },
            generatedAt: new Date(),
        });
    }
    catch (error) {
        console.error("Error generating overall report:", error);
        res.status(500).json({
            message: "Failed to generate overall report",
            error: error.message,
        });
    }
});
exports.getOverallReport = getOverallReport;
