import { Request, Response } from "express";
import { Classroom } from "../../models/Classroom";
import { AuditLog } from "../../models/AuditLog";
import { Timetable } from "../../models/Timetable";

interface TimetableEntry {
  _id?: string;
  dayOfWeek: number;
  period: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  classroom: string;
}

// Save/update timetable for a classroom
export const saveTimetable = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { timetable }: { timetable: TimetableEntry[] } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
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
      const conflicts = timetable.filter(
        (other) =>
          other.dayOfWeek === entry.dayOfWeek &&
          other.period === entry.period &&
          other._id !== entry._id
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          message: `Schedule conflict: Multiple classes scheduled for Day ${entry.dayOfWeek}, Period ${entry.period}`,
        });
      }
    }

    // Remove existing timetable entries for this classroom
    await Timetable.deleteMany({ classroomId });

    // Save new timetable entries
    const savedEntries = [];
    for (const entry of timetable) {
      // Destructure to exclude _id for new entries (MongoDB generates ObjectIds automatically)
      const { _id, ...entryData } = entry;
      const timetableEntry = new Timetable({
        ...entryData,
        classroomId,
        createdBy: req.user._id,
      });
      const saved = await timetableEntry.save();
      savedEntries.push(saved);
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      actionType: "TIMETABLE_SAVED",
      description: `Saved timetable for classroom ${classroom.name} with ${savedEntries.length} entries`,
      targetId: classroomId,
    });

    res.status(201).json({
      message: "Timetable saved successfully",
      timetable: savedEntries,
    });
  } catch (error: any) {
    console.error("Error saving timetable:", error);
    res.status(500).json({
      message: "Failed to save timetable",
      error: error.message,
    });
  }
};

// Get timetable for a specific classroom
export const getTimetable = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
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

    const timetable = await Timetable.find({ classroomId })
      .populate("teacherId", "name email")
      .sort({ dayOfWeek: 1, period: 1 });

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
      },
      timetable,
    });
  } catch (error: any) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({
      message: "Failed to fetch timetable",
      error: error.message,
    });
  }
};

// Get all timetables (admin only)
export const getAllTimetables = async (req: Request, res: Response) => {
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

    const timetables = await Timetable.find({})
      .populate("classroomId", "name")
      .populate("teacherId", "name email")
      .sort({ classroomId: 1, dayOfWeek: 1, period: 1 });

    // Group by classroom
    const groupedTimetables: { [key: string]: any } = {};
    timetables.forEach((entry: any) => {
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
  } catch (error: any) {
    console.error("Error fetching all timetables:", error);
    res.status(500).json({
      message: "Failed to fetch timetables",
      error: error.message,
    });
  }
};

// Update specific timetable entry
export const updateTimetable = async (req: Request, res: Response) => {
  try {
    const { classroomId, entryId } = req.params;
    const updateData: Partial<TimetableEntry> = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
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
      const existingEntry = await Timetable.findById(entryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Timetable entry not found" });
      }

      const dayOfWeek = updateData.dayOfWeek ?? existingEntry.dayOfWeek;
      const period = updateData.period ?? existingEntry.period;

      const conflict = await Timetable.findOne({
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

    const updatedEntry = await Timetable.findByIdAndUpdate(
      entryId,
      {
        ...updateData,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("teacherId", "name email");

    if (!updatedEntry) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      actionType: "TIMETABLE_UPDATED",
      description: `Updated timetable entry for classroom ${classroom.name}`,
      targetId: entryId,
    });

    res.json({
      message: "Timetable entry updated successfully",
      entry: updatedEntry,
    });
  } catch (error: any) {
    console.error("Error updating timetable:", error);
    res.status(500).json({
      message: "Failed to update timetable",
      error: error.message,
    });
  }
};

// Delete timetable entry
export const deleteTimetable = async (req: Request, res: Response) => {
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

    const deletedEntry = await Timetable.findByIdAndDelete(entryId);

    if (!deletedEntry) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      actionType: "TIMETABLE_DELETED",
      description: `Deleted timetable entry for subject ${deletedEntry.subject}`,
      targetId: entryId,
    });

    res.json({
      message: "Timetable entry deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting timetable entry:", error);
    res.status(500).json({
      message: "Failed to delete timetable entry",
      error: error.message,
    });
  }
};
