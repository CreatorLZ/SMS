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
exports.getAttendanceHistory = exports.verifyAndGetResults = void 0;
const Student_1 = require("../../models/Student");
const User_1 = require("../../models/User");
const Attendance_1 = require("../../models/Attendance");
const AuditLog_1 = require("../../models/AuditLog");
// @desc    Get student's results with PIN
// @route   POST /api/student/results/verify
// @access  Public
const verifyAndGetResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId, pinCode, term, year } = req.body;
        const student = yield Student_1.Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Find the term fee record
        const termFee = student.termFees.find((fee) => fee.term === term && fee.year === year);
        if (!termFee) {
            return res.status(404).json({ message: "Term record not found" });
        }
        // Verify PIN and fee payment
        if (termFee.pinCode !== pinCode) {
            return res.status(403).json({ message: "Invalid PIN" });
        }
        if (!termFee.paid) {
            return res.status(403).json({ message: "Term fees not paid" });
        }
        if (!termFee.viewable) {
            return res
                .status(403)
                .json({ message: "Results not yet available for viewing" });
        }
        // Get results for the specified term
        const results = student.results.find((result) => result.term === term && result.year === year);
        if (!results) {
            return res
                .status(404)
                .json({ message: "No results found for this term" });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || null,
            actionType: "RESULT_VIEW",
            description: `Results viewed for student ${student.fullName} (${term} ${year})`,
            targetId: student._id,
        });
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.verifyAndGetResults = verifyAndGetResults;
// @desc    Get student's attendance history
// @route   GET /api/student/attendance
// @access  Private/Student/Parent
const getAttendanceHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { startDate, endDate } = req.query;
        let student;
        // Check if user is a student
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "student") {
            student = yield Student_1.Student.findOne({ userId }).select("fullName studentId classroomId");
        }
        // If parent, get attendance for the specified child
        else if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === "parent") {
            const parent = yield User_1.User.findById(userId);
            if (!((_d = parent === null || parent === void 0 ? void 0 : parent.linkedStudentIds) === null || _d === void 0 ? void 0 : _d.length)) {
                return res.status(404).json({ message: "No linked students found" });
            }
            const { studentId } = req.query;
            if (!studentId ||
                !parent.linkedStudentIds.includes(studentId)) {
                return res
                    .status(403)
                    .json({ message: "Access denied to this student's records" });
            }
            student = yield Student_1.Student.findById(studentId).select("fullName studentId classroomId");
        }
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Build query for attendance records
        let attendanceQuery = {
            classroomId: student.classroomId,
            "records.studentId": student._id,
        };
        // Filter by date range if provided
        if (startDate || endDate) {
            attendanceQuery.date = {};
            if (startDate) {
                attendanceQuery.date.$gte = new Date(startDate);
            }
            if (endDate) {
                attendanceQuery.date.$lte = new Date(endDate);
            }
        }
        // Get attendance records
        const attendanceRecords = yield Attendance_1.Attendance.find(attendanceQuery)
            .populate("markedBy", "name")
            .sort({ date: -1 });
        // Format the attendance data
        const formattedAttendance = attendanceRecords.map((record) => {
            var _a;
            const studentRecord = record.records.find((r) => r.studentId.toString() === student._id.toString());
            return {
                date: record.date,
                status: (studentRecord === null || studentRecord === void 0 ? void 0 : studentRecord.status) || "absent",
                markedBy: ((_a = record.markedBy) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
            };
        });
        res.json({
            studentInfo: {
                fullName: student.fullName,
                studentId: student.studentId,
            },
            attendance: formattedAttendance,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getAttendanceHistory = getAttendanceHistory;
