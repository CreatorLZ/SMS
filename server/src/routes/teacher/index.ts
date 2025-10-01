import express from "express";
import { protect, authorize } from "../../middleware/auth";
import {
  markAttendance,
  getAttendanceHistory,
} from "../../controllers/teacher/attendanceController";
import {
  submitResults,
  getStudentResults,
  getClassroomDetails,
  getTeacherClassrooms,
  getClassroomStudents,
} from "../../controllers/teacher/resultController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect, authorize("teacher"));

// Attendance routes
router.post("/attendance", markAttendance);
router.get("/attendance", getAttendanceHistory);

// Results routes
router.post("/results", submitResults);
router.get("/results/:studentId", getStudentResults);
router.get("/results/students", getClassroomStudents);

// Classroom routes
router.get("/classroom", getClassroomDetails);
router.get("/classrooms", getTeacherClassrooms);

export default router;
