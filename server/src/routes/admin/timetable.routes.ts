import { Router } from "express";
import { protect as authenticate, authorize } from "../../middleware/auth";
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
router.post("/:classroomId", authorize("admin", "teacher"), saveTimetable);

// Get timetable for a specific classroom
router.get("/:classroomId", authorize("admin", "teacher"), getTimetable);

// Get all timetables (admin only)
router.get("/", authorize("admin"), getAllTimetables);

// Update specific timetable entry
router.put(
  "/:classroomId/:entryId",
  authorize("admin", "teacher"),
  updateTimetable
);

// Delete timetable entry
router.delete("/:classroomId/:entryId", authorize("admin"), deleteTimetable);

export default router;
