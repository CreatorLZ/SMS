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
router.use(auth_1.protect, (0, auth_1.authorize)("teacher"));
// Attendance routes
router.post("/attendance", attendanceController_1.markAttendance);
router.get("/attendance", attendanceController_1.getAttendanceHistory);
// Results routes
router.post("/results", resultController_1.submitResults);
router.get("/results/:studentId", resultController_1.getStudentResults);
router.get("/results/students", resultController_1.getClassroomStudents);
// Classroom routes
router.get("/classroom", resultController_1.getClassroomDetails);
router.get("/classrooms", resultController_1.getTeacherClassrooms);
exports.default = router;
