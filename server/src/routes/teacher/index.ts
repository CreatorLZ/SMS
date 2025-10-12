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
  getClassroomSubjects,
} from "../../controllers/teacher/resultController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Attendance routes
router.post("/attendance", markAttendance);
router.get("/attendance", getAttendanceHistory);

// Results routes
router.post("/results", authorize("teacher"), submitResults);
router.get("/results/students", authorize("teacher"), getClassroomStudents);
router.get("/results/:studentId", getStudentResults); // Allow admins and teachers

// Classroom routes
router.get("/classroom", authorize("teacher"), getClassroomDetails);
router.get("/classrooms", authorize("teacher"), getTeacherClassrooms);
router.get(
  "/classrooms/:classroomId/subjects",
  authorize("teacher"),
  getClassroomSubjects
);

export default router;
