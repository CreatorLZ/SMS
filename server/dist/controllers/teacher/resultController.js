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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassroomSubjects = exports.getClassroomStudents = exports.getTeacherClassrooms = exports.getClassroomDetails = exports.getStudentResults = exports.submitResults = void 0;
const Student_1 = require("../../models/Student");
const Classroom_1 = require("../../models/Classroom");
const AuditLog_1 = require("../../models/AuditLog");
const Term_1 = require("../../models/Term");
const Session_1 = __importDefault(require("../../models/Session"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Submit or update student results
// @route   POST /api/teacher/results
// @access  Private/Teacher
const submitResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId, term, year, scores, comment } = req.body;
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Debug logging
        console.log("submitResults called with:", {
            studentId,
            studentIdType: typeof studentId,
            teacherId,
            term,
            year,
        });
        if (!teacherId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: teacher ID missing" });
        }
        if (!studentId) {
            return res.status(400).json({ message: "studentId is required" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            console.error(`ERROR: Invalid studentId format: ${studentId}`);
            return res.status(400).json({ message: "Invalid studentId format" });
        }
        // Verify teacher has access to this student
        const classroom = yield Classroom_1.Classroom.findOne({
            teacherId,
            students: studentId,
        });
        if (!classroom) {
            return res.status(403).json({
                message: "You don't have permission to submit results for this student",
            });
        }
        // Find the session by startYear
        const session = yield Session_1.default.findOne({ startYear: year });
        if (!session) {
            return res.status(400).json({
                message: "Invalid session year",
            });
        }
        // Verify term exists and is active
        const termExists = yield Term_1.Term.findOne({
            name: term,
            sessionId: session._id,
            isActive: true,
        });
        if (!termExists) {
            return res.status(400).json({
                message: "Invalid or inactive term",
            });
        }
        // Validate scores - new assessment structure
        for (const score of scores) {
            const { assessments, totalScore } = score;
            const calculatedTotal = (assessments.ca1 || 0) +
                (assessments.ca2 || 0) +
                (assessments.exam || 0);
            // Validate individual assessment components
            if (assessments.ca1 < 0 || assessments.ca1 > 20) {
                return res.status(400).json({
                    message: "CA1 scores must be between 0 and 20",
                });
            }
            if (assessments.ca2 < 0 || assessments.ca2 > 20) {
                return res.status(400).json({
                    message: "CA2 scores must be between 0 and 20",
                });
            }
            if (assessments.exam < 0 || assessments.exam > 60) {
                return res.status(400).json({
                    message: "Exam scores must be between 0 and 60",
                });
            }
            // Validate total score matches calculation
            if (totalScore !== calculatedTotal) {
                return res.status(400).json({
                    message: "Total score must equal CA1 + CA2 + Exam",
                });
            }
            // Ensure total is within valid range
            if (totalScore < 0 || totalScore > 100) {
                return res.status(400).json({
                    message: "Total scores must be between 0 and 100",
                });
            }
        }
        // Update or create result
        const student = yield Student_1.Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const resultIndex = student.results.findIndex((r) => r.term === term && r.year === year);
        if (resultIndex > -1) {
            // Update existing result
            student.results[resultIndex] = {
                term,
                year,
                scores,
                comment,
                updatedBy: teacherId,
                updatedAt: new Date(),
            };
        }
        else {
            // Add new result
            student.results.push({
                term,
                year,
                scores,
                comment,
                updatedBy: teacherId,
                updatedAt: new Date(),
            });
        }
        yield student.save();
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: teacherId,
            actionType: "RESULT_SUBMIT",
            description: `${resultIndex > -1 ? "Updated" : "Submitted"} results for student ${student.fullName} (${term} ${year})`,
            targetId: student._id,
        });
        res.json({ message: "Results saved successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.submitResults = submitResults;
// @desc    Get student results
// @route   GET /api/teacher/results/:studentId
// @access  Private/Teacher
const getStudentResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId } = req.params;
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Debug logging
        console.log("getStudentResults called with:", {
            studentId,
            studentIdType: typeof studentId,
            teacherId,
        });
        if (!studentId) {
            return res.status(400).json({ message: "studentId is required" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            console.error(`ERROR: Invalid studentId format: ${studentId}`);
            return res.status(400).json({ message: "Invalid studentId format" });
        }
        // Verify teacher has access to this student
        const classroom = yield Classroom_1.Classroom.findOne({
            teacherId,
            students: studentId,
        });
        if (!classroom) {
            return res.status(403).json({
                message: "You don't have permission to view results for this student",
            });
        }
        const student = yield Student_1.Student.findById(studentId)
            .select("fullName studentId results")
            .populate("results.updatedBy", "name");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.json(student);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getStudentResults = getStudentResults;
// @desc    Get teacher's classroom details with students
// @route   GET /api/teacher/classroom
// @access  Private/Teacher
const getClassroomDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const classroom = yield Classroom_1.Classroom.findOne({ teacherId }).populate({
            path: "students",
            select: "fullName studentId currentClass",
        });
        if (!classroom) {
            return res.status(404).json({ message: "No classroom assigned" });
        }
        res.json(classroom);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getClassroomDetails = getClassroomDetails;
// @desc    Get all classrooms assigned to teacher
// @route   GET /api/teacher/classrooms
// @access  Private/Teacher
const getTeacherClassrooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const classrooms = yield Classroom_1.Classroom.find({ teacherId })
            .populate("teacherId", "name email")
            .populate("students", "fullName studentId");
        res.json(classrooms);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getTeacherClassrooms = getTeacherClassrooms;
// @desc    Get students for a specific classroom (teacher access)
// @route   GET /api/teacher/results/students
// @access  Private/Teacher
const getClassroomStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { classId, search, page = 1, limit = 10, hasResults, term, year, } = req.query;
        // Debug logging to identify where the issue is coming from
        console.log("DEBUG: getClassroomStudents called with:", {
            classId,
            classIdType: typeof classId,
            classIdLength: classId === null || classId === void 0 ? void 0 : classId.length,
            teacherId,
            search,
            page,
            limit,
            fullUrl: req.originalUrl,
            method: req.method,
        });
        if (!classId) {
            return res.status(400).json({ message: "classId is required" });
        }
        // Check if classId is the problematic "students" string
        if (classId === "students") {
            console.error("ERROR: classId is 'students' string instead of ObjectId");
            return res.status(400).json({
                message: "Invalid classId: received 'students' string instead of classroom ID",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(classId)) {
            console.error(`ERROR: Invalid classId format: ${classId}`);
            return res.status(400).json({ message: "Invalid classId format" });
        }
        if (!teacherId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: teacher ID missing" });
        }
        // Verify teacher has access to this classroom
        const classroom = yield Classroom_1.Classroom.findOne({
            _id: classId,
            teacherId,
        });
        if (!classroom) {
            return res.status(403).json({
                message: "You don't have permission to view students in this classroom",
            });
        }
        // Build query for students using classroomId (direct ObjectId relationship)
        const query = { classroomId: classId };
        // Add filter for students who have results if requested
        if (hasResults === "true" && term && year) {
            query.results = {
                $elemMatch: {
                    term: term,
                    year: parseInt(year),
                },
            };
        }
        else if (hasResults === "false" && term && year) {
            // Filter students who do NOT have results for the specified term and year
            query.$nor = [
                {
                    results: {
                        $elemMatch: {
                            term: term,
                            year: parseInt(year),
                        },
                    },
                },
            ];
        }
        // Add search filter if provided
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { studentId: { $regex: search, $options: "i" } },
            ];
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Fetch students with pagination
        const [students, total] = yield Promise.all([
            Student_1.Student.find(query)
                .select("fullName studentId firstName lastName gender currentClass _id")
                .sort({ fullName: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Student_1.Student.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            students,
            total,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: totalPages,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getClassroomStudents = getClassroomStudents;
// @desc    Get subjects for a specific classroom (teacher access)
// @route   GET /api/teacher/classrooms/:classroomId/subjects
// @access  Private/Teacher
const getClassroomSubjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { classroomId } = req.params;
        if (!classroomId) {
            return res.status(400).json({ message: "classroomId is required" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(classroomId)) {
            return res.status(400).json({ message: "Invalid classroomId format" });
        }
        if (!teacherId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: teacher ID missing" });
        }
        // Verify teacher has access to this classroom
        const classroom = yield Classroom_1.Classroom.findOne({
            _id: classroomId,
            teacherId,
        }).populate("subjects", "name category level isActive");
        if (!classroom) {
            return res.status(403).json({
                message: "You don't have permission to view subjects for this classroom",
            });
        }
        res.json({
            classroom: {
                _id: classroom._id,
                name: classroom.name,
            },
            subjects: classroom.subjects,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getClassroomSubjects = getClassroomSubjects;
