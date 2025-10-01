"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const reportsController_1 = require("../../controllers/admin/reportsController");
const router = (0, express_1.Router)();
// All report routes require authentication
router.use(auth_1.protect);
// Get attendance reports
router.get("/attendance", (0, auth_1.authorize)("admin", "teacher"), reportsController_1.getAttendanceReport);
// Get student reports
router.get("/students", (0, auth_1.authorize)("admin", "teacher"), reportsController_1.getStudentReport);
// Get teacher reports
router.get("/teachers", (0, auth_1.authorize)("admin"), reportsController_1.getTeacherReport);
// Get classroom reports
router.get("/classrooms", (0, auth_1.authorize)("admin", "teacher"), reportsController_1.getClassroomReport);
// Get overall school report
router.get("/overall", (0, auth_1.authorize)("admin"), reportsController_1.getOverallReport);
exports.default = router;
