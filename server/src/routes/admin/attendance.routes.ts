import { Router } from "express";
import { protect as authenticate, authorize } from "../../middleware/auth";
import {
  markAttendance,
  getClassAttendance,
  getStudentAttendance,
  getAttendanceHistory,
  getCalendarAttendance,
  updateAttendance,
  deleteAttendance,
} from "../../controllers/admin/attendanceController";

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Mark attendance for a classroom
router.post(
  "/mark",
  authorize("admin", "superadmin", "teacher"),
  markAttendance
);

// Get attendance for a specific class and date
router.get(
  "/class/:classroomId/:date",
  authorize("admin", "superadmin", "teacher"),
  getClassAttendance
);

// Get attendance history for a student
router.get(
  "/student/:studentId",
  authorize("admin", "superadmin", "teacher", "student", "parent"),
  getStudentAttendance
);

// Update attendance record
router.put(
  "/update/:attendanceId",
  authorize("admin", "superadmin", "teacher"),
  updateAttendance
);

// Delete attendance record
router.delete(
  "/:classroomId/:date",
  authorize("admin", "superadmin"),
  deleteAttendance
);

// Calendar attendance endpoint
router.get(
  "/calendar/:classroomId",
  authorize("admin", "superadmin", "teacher"),
  getCalendarAttendance
);

// General attendance history endpoint (for backward compatibility and statistics)
router.get(
  "/",
  authorize("admin", "superadmin", "teacher"),
  getAttendanceHistory
);

export default router;
