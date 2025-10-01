"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimetable = exports.updateTimetable = exports.getAllTimetables = exports.getTimetable = exports.saveTimetable = void 0;
const Classroom_1 = require("../../models/Classroom");
const AuditLog_1 = require("../../models/AuditLog");
const Timetable_1 = require("../../models/Timetable");
// Save/update timetable for a classroom
const saveTimetable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId } = req.params;
        const { timetable } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Verify classroom exists and user has access
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions - admins and superadmins can access all classrooms
        // Teachers can only access classrooms they are assigned to
        if (req.user.role === "teacher") {
            if (classroom.teacherId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "Not authorized to manage timetable for this classroom",
                });
            }
        }
        // Superadmin and admin have full access - no additional checks needed
        // Validate timetable entries
        for (const entry of timetable) {
            if (!entry.subject || !entry.teacherId) {
                return res.status(400).json({
                    message: "All timetable entries must have subject and teacher",
                });
            }
            // Check for conflicts within the same timetable
            const conflicts = timetable.filter((other) => other.dayOfWeek === entry.dayOfWeek &&
                other.period === entry.period &&
                other._id !== entry._id);
            if (conflicts.length > 0) {
                return res.status(400).json({
                    message: `Schedule conflict: Multiple classes scheduled for Day ${entry.dayOfWeek}, Period ${entry.period}`,
                });
            }
        }
        // Remove existing timetable entries for this classroom
        yield Timetable_1.Timetable.deleteMany({ classroomId });
        // Save new timetable entries
        const savedEntries = [];
        for (const entry of timetable) {
            // Destructure to exclude _id for new entries (MongoDB generates ObjectIds automatically)
            const { _id } = entry, entryData = __rest(entry, ["_id"]);
            const timetableEntry = new Timetable_1.Timetable(Object.assign(Object.assign({}, entryData), { classroomId, createdBy: req.user._id }));
            const saved = yield timetableEntry.save();
            savedEntries.push(saved);
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "TIMETABLE_SAVED",
            description: `Saved timetable for classroom ${classroom.name} with ${savedEntries.length} entries`,
            targetId: classroomId,
        });
        res.status(201).json({
            message: "Timetable saved successfully",
            timetable: savedEntries,
        });
    }
    catch (error) {
        console.error("Error saving timetable:", error);
        res.status(500).json({
            message: "Failed to save timetable",
            error: error.message,
        });
    }
});
exports.saveTimetable = saveTimetable;
// Get timetable for a specific classroom
const getTimetable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Verify classroom exists and user has access
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions - admins and superadmins can access all classrooms
        // Teachers can only access classrooms they are assigned to
        if (req.user.role === "teacher") {
            if (classroom.teacherId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "Not authorized to view timetable for this classroom",
                });
            }
        }
        // Superadmin and admin have full access - no additional checks needed
        const timetable = yield Timetable_1.Timetable.find({ classroomId })
            .populate("teacherId", "name email")
            .sort({ dayOfWeek: 1, period: 1 });
        res.json({
            classroom: {
                _id: classroom._id,
                name: classroom.name,
            },
            timetable,
        });
    }
    catch (error) {
        console.error("Error fetching timetable:", error);
        res.status(500).json({
            message: "Failed to fetch timetable",
            error: error.message,
        });
    }
});
exports.getTimetable = getTimetable;
// Get all timetables (admin only)
const getAllTimetables = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Only admins and superadmins can view all timetables
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            return res
                .status(403)
                .json({ message: "Only administrators can view all timetables" });
        }
        const timetables = yield Timetable_1.Timetable.find({})
            .populate("classroomId", "name")
            .populate("teacherId", "name email")
            .sort({ classroomId: 1, dayOfWeek: 1, period: 1 });
        // Group by classroom
        const groupedTimetables = {};
        timetables.forEach((entry) => {
            const classroomId = entry.classroomId._id.toString();
            if (!groupedTimetables[classroomId]) {
                groupedTimetables[classroomId] = {
                    classroom: entry.classroomId,
                    timetable: [],
                };
            }
            groupedTimetables[classroomId].timetable.push(entry);
        });
        res.json({
            timetables: Object.values(groupedTimetables),
        });
    }
    catch (error) {
        console.error("Error fetching all timetables:", error);
        res.status(500).json({
            message: "Failed to fetch timetables",
            error: error.message,
        });
    }
});
exports.getAllTimetables = getAllTimetables;
// Update specific timetable entry
const updateTimetable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { classroomId, entryId } = req.params;
        const updateData = req.body;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Verify classroom exists and user has access
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions - admins and superadmins can access all classrooms
        // Teachers can only access classrooms they are assigned to
        if (req.user.role === "teacher") {
            if (classroom.teacherId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "Not authorized to update timetable for this classroom",
                });
            }
        }
        // Superadmin and admin have full access - no additional checks needed
        // Check for conflicts if dayOfWeek or period is being updated
        if (updateData.dayOfWeek !== undefined || updateData.period !== undefined) {
            const existingEntry = yield Timetable_1.Timetable.findById(entryId);
            if (!existingEntry) {
                return res.status(404).json({ message: "Timetable entry not found" });
            }
            const dayOfWeek = (_a = updateData.dayOfWeek) !== null && _a !== void 0 ? _a : existingEntry.dayOfWeek;
            const period = (_b = updateData.period) !== null && _b !== void 0 ? _b : existingEntry.period;
            const conflict = yield Timetable_1.Timetable.findOne({
                classroomId,
                dayOfWeek,
                period,
                _id: { $ne: entryId },
            });
            if (conflict) {
                return res.status(400).json({
                    message: `Schedule conflict: Another class is already scheduled for Day ${dayOfWeek}, Period ${period}`,
                });
            }
        }
        const updatedEntry = yield Timetable_1.Timetable.findByIdAndUpdate(entryId, Object.assign(Object.assign({}, updateData), { updatedBy: req.user._id, updatedAt: new Date() }), { new: true }).populate("teacherId", "name email");
        if (!updatedEntry) {
            return res.status(404).json({ message: "Timetable entry not found" });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "TIMETABLE_UPDATED",
            description: `Updated timetable entry for classroom ${classroom.name}`,
            targetId: entryId,
        });
        res.json({
            message: "Timetable entry updated successfully",
            entry: updatedEntry,
        });
    }
    catch (error) {
        console.error("Error updating timetable:", error);
        res.status(500).json({
            message: "Failed to update timetable",
            error: error.message,
        });
    }
});
exports.updateTimetable = updateTimetable;
// Delete timetable entry
const deleteTimetable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId, entryId } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Only admins can delete timetable entries
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only administrators can delete timetable entries" });
        }
        const deletedEntry = yield Timetable_1.Timetable.findByIdAndDelete(entryId);
        if (!deletedEntry) {
            return res.status(404).json({ message: "Timetable entry not found" });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "TIMETABLE_DELETED",
            description: `Deleted timetable entry for subject ${deletedEntry.subject}`,
            targetId: entryId,
        });
        res.json({
            message: "Timetable entry deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting timetable entry:", error);
        res.status(500).json({
            message: "Failed to delete timetable entry",
            error: error.message,
        });
    }
});
exports.deleteTimetable = deleteTimetable;
