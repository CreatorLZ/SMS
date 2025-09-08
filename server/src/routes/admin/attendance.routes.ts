import { Router } from "express";
import { protect as authenticate, authorize } from "../../middleware/auth";
import {
  markAttendance,
  getAttendance,
  getAttendanceHistory,
  updateAttendance,
  deleteAttendance,
} from "../../controllers/admin/attendanceController";

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Mark attendance for a classroom
router.post(
  "/:classroomId",
  authorize("admin", "superadmin", "teacher"),
  markAttendance
);

// Get attendance for a specific date
router.get(
  "/:classroomId",
  authorize("admin", "superadmin", "teacher"),
  getAttendance
);

// Get attendance history with filters
router.get(
  "/",
  authorize("admin", "superadmin", "teacher"),
  getAttendanceHistory
);

// Update attendance record
router.put(
  "/:classroomId/:date",
  authorize("admin", "superadmin", "teacher"),
  updateAttendance
);

// Delete attendance record
router.delete(
  "/:classroomId/:date",
  authorize("admin", "superadmin"),
  deleteAttendance
);

export default router;
