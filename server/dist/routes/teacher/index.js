"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const attendanceController_1 = require("../../controllers/teacher/attendanceController");
const resultController_1 = require("../../controllers/teacher/resultController");
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_1.protect);
// Attendance routes
router.post("/attendance", attendanceController_1.markAttendance);
router.get("/attendance", attendanceController_1.getAttendanceHistory);
// Results routes
router.post("/results", (0, auth_1.authorize)("teacher"), resultController_1.submitResults);
router.get("/results/students", (0, auth_1.authorize)("teacher"), resultController_1.getClassroomStudents);
router.get("/results/:studentId", resultController_1.getStudentResults); // Allow admins and teachers
// Classroom routes
router.get("/classroom", (0, auth_1.authorize)("teacher"), resultController_1.getClassroomDetails);
router.get("/classrooms", (0, auth_1.authorize)("teacher"), resultController_1.getTeacherClassrooms);
router.get("/classrooms/:classroomId/subjects", (0, auth_1.authorize)("teacher"), resultController_1.getClassroomSubjects);
exports.default = router;
