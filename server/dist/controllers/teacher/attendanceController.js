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
exports.getAttendanceHistory = exports.markAttendance = void 0;
const Classroom_1 = require("../../models/Classroom");
const Attendance_1 = require("../../models/Attendance");
const AuditLog_1 = require("../../models/AuditLog");
// @desc    Mark attendance for students in a class
// @route   POST /api/teacher/attendance
// @access  Private/Teacher
const markAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { date, attendanceData } = req.body;
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Verify teacher has an assigned classroom
        const classroom = yield Classroom_1.Classroom.findOne({ teacherId })
            .populate("students")
            .exec();
        if (!classroom) {
            return res.status(404).json({ message: "No classroom assigned" });
        }
        // Validate attendance data
        for (const record of attendanceData) {
            const studentExists = classroom.students.some((student) => student._id.toString() === record.studentId);
            if (!studentExists) {
                return res.status(400).json({
                    message: `Student ${record.studentId} is not in your class`,
                });
            }
        }
        // Check if attendance already exists for this date and classroom
        const existingAttendance = yield Attendance_1.Attendance.findOne({
            classroomId: classroom._id,
            date: new Date(date),
        });
        let attendance;
        if (existingAttendance) {
            // Update existing attendance
            existingAttendance.records = attendanceData.map((record) => ({
                studentId: record.studentId,
                status: record.status,
            }));
            existingAttendance.markedBy = teacherId;
            attendance = yield existingAttendance.save();
        }
        else {
            // Create new attendance record
            attendance = yield Attendance_1.Attendance.create({
                classroomId: classroom._id,
                date: new Date(date),
                records: attendanceData.map((record) => ({
                    studentId: record.studentId,
                    status: record.status,
                })),
                markedBy: teacherId,
            });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: teacherId,
            actionType: "ATTENDANCE_MARKED",
            description: `Marked attendance for ${attendanceData.length} students in ${classroom.name}`,
            targetId: attendance._id,
        });
        res.json({
            success: true,
            message: existingAttendance
                ? "Attendance updated successfully"
                : "Attendance marked successfully",
            data: attendance,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});
exports.markAttendance = markAttendance;
// @desc    Get attendance history for a class
// @route   GET /api/teacher/attendance
// @access  Private/Teacher
const getAttendanceHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { classroomId, limit = 50, page = 1 } = req.query;
        // If classroomId is provided, verify teacher has access to it
        if (classroomId) {
            const classroom = yield Classroom_1.Classroom.findOne({
                _id: classroomId,
                teacherId,
            });
            if (!classroom) {
                return res.status(403).json({
                    message: "You don't have access to this classroom",
                });
            }
            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const totalCount = yield Attendance_1.Attendance.countDocuments({
                classroomId: classroom._id,
            });
            // Get attendance records for this specific classroom with pagination
            const attendance = yield Attendance_1.Attendance.find({
                classroomId: classroom._id,
            })
                .populate({
                path: "records.studentId",
                select: "fullName studentId",
            })
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            const totalPages = Math.ceil(totalCount / parseInt(limit));
            const hasNextPage = parseInt(page) < totalPages;
            const hasPrevPage = parseInt(page) > 1;
            res.json({
                attendance,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRecords: totalCount,
                    limit: parseInt(limit),
                    hasNextPage,
                    hasPrevPage,
                    nextPage: hasNextPage ? parseInt(page) + 1 : null,
                    prevPage: hasPrevPage ? parseInt(page) - 1 : null,
                },
            });
        }
        else {
            // Get all classrooms for the teacher and their attendance
            const classrooms = yield Classroom_1.Classroom.find({ teacherId });
            if (classrooms.length === 0) {
                return res.status(404).json({ message: "No classrooms assigned" });
            }
            // Calculate pagination for each classroom
            const skip = (parseInt(page) - 1) * parseInt(limit);
            // Get attendance for all teacher's classrooms with pagination
            const attendancePromises = classrooms.map((classroom) => __awaiter(void 0, void 0, void 0, function* () {
                const attendance = yield Attendance_1.Attendance.find({
                    classroomId: classroom._id,
                })
                    .populate({
                    path: "records.studentId",
                    select: "fullName studentId",
                })
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(parseInt(limit));
                return {
                    classroomId: classroom._id,
                    classroomName: classroom.name,
                    attendance,
                };
            }));
            // Get total counts for pagination metadata
            const totalCountsPromises = classrooms.map((classroom) => __awaiter(void 0, void 0, void 0, function* () { return Attendance_1.Attendance.countDocuments({ classroomId: classroom._id }); }));
            const totalCounts = yield Promise.all(totalCountsPromises);
            const maxTotalCount = Math.max(...totalCounts);
            const totalPages = Math.ceil(maxTotalCount / parseInt(limit));
            const attendanceData = yield Promise.all(attendancePromises);
            const hasNextPage = parseInt(page) < totalPages;
            const hasPrevPage = parseInt(page) > 1;
            res.json({
                classrooms: attendanceData,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    limit: parseInt(limit),
                    hasNextPage,
                    hasPrevPage,
                    nextPage: hasNextPage ? parseInt(page) + 1 : null,
                    prevPage: hasPrevPage ? parseInt(page) - 1 : null,
                },
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getAttendanceHistory = getAttendanceHistory;
