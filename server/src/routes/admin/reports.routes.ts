import { Router } from "express";
import { protect as authenticate, authorize } from "../../middleware/auth";
import {
  getAttendanceReport,
  getStudentReport,
  getTeacherReport,
  getClassroomReport,
  getOverallReport,
} from "../../controllers/admin/reportsController";

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Get attendance reports
router.get("/attendance", authorize("admin", "teacher"), getAttendanceReport);

// Get student reports
router.get("/students", authorize("admin", "teacher"), getStudentReport);

// Get teacher reports
router.get("/teachers", authorize("admin"), getTeacherReport);

// Get classroom reports
router.get("/classrooms", authorize("admin", "teacher"), getClassroomReport);

// Get overall school report
router.get("/overall", authorize("admin"), getOverallReport);

export default router;
