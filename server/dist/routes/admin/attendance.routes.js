"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const attendanceController_1 = require("../../controllers/admin/attendanceController");
const router = (0, express_1.Router)();
// All attendance routes require authentication
router.use(auth_1.protect);
// Mark attendance for a classroom
router.post("/mark", (0, auth_1.authorize)("admin", "superadmin", "teacher"), attendanceController_1.markAttendance);
// Get attendance for a specific class and date
router.get("/class/:classroomId/:date", (0, auth_1.authorize)("admin", "superadmin", "teacher"), attendanceController_1.getClassAttendance);
// Get attendance history for a student
router.get("/student/:studentId", (0, auth_1.authorize)("admin", "superadmin", "teacher", "student", "parent"), attendanceController_1.getStudentAttendance);
// Update attendance record
router.put("/update/:attendanceId", (0, auth_1.authorize)("admin", "superadmin", "teacher"), attendanceController_1.updateAttendance);
// Delete attendance record
router.delete("/:classroomId/:date", (0, auth_1.authorize)("admin", "superadmin"), attendanceController_1.deleteAttendance);
// Calendar attendance endpoint
router.get("/calendar/:classroomId", (0, auth_1.authorize)("admin", "superadmin", "teacher"), attendanceController_1.getCalendarAttendance);
// General attendance history endpoint (for backward compatibility and statistics)
router.get("/", (0, auth_1.authorize)("admin", "superadmin", "teacher"), attendanceController_1.getAttendanceHistory);
exports.default = router;
