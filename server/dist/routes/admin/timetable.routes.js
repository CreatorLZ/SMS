"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const auth_2 = require("../../middleware/auth");
const timetableController_1 = require("../../controllers/admin/timetableController");
const router = (0, express_1.Router)();
// All timetable routes require authentication
router.use(auth_1.protect);
// Save/update timetable for a classroom
router.post("/:classroomId", (0, auth_2.requireAnyPermission)("timetables.create", "timetables.update"), timetableController_1.saveTimetable);
// Get timetable for a specific classroom
router.get("/:classroomId", (0, auth_2.requirePermission)("timetables.read"), timetableController_1.getTimetable);
// Get all timetables (admin/superadmin only)
router.get("/", (0, auth_2.requirePermission)("timetables.read"), timetableController_1.getAllTimetables);
// Update specific timetable entry
router.put("/:classroomId/:entryId", (0, auth_2.requireAnyPermission)("timetables.update", "timetables.create"), timetableController_1.updateTimetable);
// Delete timetable entry
router.delete("/:classroomId/:entryId", (0, auth_2.requirePermission)("timetables.delete"), timetableController_1.deleteTimetable);
exports.default = router;
