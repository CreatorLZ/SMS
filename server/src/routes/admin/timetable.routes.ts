import { Router } from "express";
import { protect as authenticate } from "../../middleware/auth";
import { requirePermission, requireAnyPermission } from "../../middleware/auth";
import {
  saveTimetable,
  getTimetable,
  getAllTimetables,
  updateTimetable,
  deleteTimetable,
} from "../../controllers/admin/timetableController";

const router = Router();

// All timetable routes require authentication
router.use(authenticate);

// Save/update timetable for a classroom
router.post(
  "/:classroomId",
  requireAnyPermission("timetables.create", "timetables.update"),
  saveTimetable
);

// Get timetable for a specific classroom
router.get("/:classroomId", requirePermission("timetables.read"), getTimetable);

// Get all timetables (admin/superadmin only)
router.get("/", requirePermission("timetables.read"), getAllTimetables);

// Update specific timetable entry
router.put(
  "/:classroomId/:entryId",
  requireAnyPermission("timetables.update", "timetables.create"),
  updateTimetable
);

// Delete timetable entry
router.delete(
  "/:classroomId/:entryId",
  requirePermission("timetables.delete"),
  deleteTimetable
);

export default router;
