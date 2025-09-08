import { Request, Response } from "express";
import { Attendance } from "../../models/Attendance";
import { Classroom } from "../../models/Classroom";
import { AuditLog } from "../../models/AuditLog";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
}

// Mark attendance for a classroom
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { date, records }: { date: string; records: AttendanceRecord[] } =
      req.body;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if user is the assigned teacher or an admin
    if (
      req.user.role !== "admin" &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to mark attendance for this classroom",
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      classroomId,
      date: new Date(date),
    });

    if (existingAttendance) {
      return res.status(400).json({
        message:
          "Attendance already exists for this date. Use update endpoint instead.",
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      classroomId,
      date: new Date(date),
      records,
      markedBy: req.user._id,
    });

    await attendance.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: "ATTENDANCE_MARKED",
      details: {
        classroomId,
        date,
        recordCount: records.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error: any) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

// Get attendance for a specific date
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view attendance for this classroom",
      });
    }

    const attendance = await Attendance.findOne({
      classroomId,
      date: date ? new Date(date as string) : new Date(),
    }).populate("records.studentId", "fullName studentId");

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "Attendance not found for this date" });
    }

    res.json(attendance);
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

// Get attendance history with filters
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const {
      classroomId,
      studentId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      period,
    } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Build query
    const query: any = {};

    if (classroomId) {
      // Verify user has access to this classroom
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      if (
        req.user.role !== "admin" &&
        classroom.teacherId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Not authorized to view attendance for this classroom",
        });
      }

      query.classroomId = classroomId;
    } else if (req.user.role !== "admin") {
      // Non-admin users can only see attendance for their classrooms
      const userClassrooms = await Classroom.find({ teacherId: req.user._id });
      query.classroomId = { $in: userClassrooms.map((c) => c._id) };
    }

    if (studentId) {
      query["records.studentId"] = studentId;
    }

    // Handle period-based date filtering
    if (period) {
      const now = new Date();
      const periodStr = period as string;

      if (periodStr === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        query.date = { $gte: weekAgo, $lte: now };
      } else if (periodStr === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        query.date = { $gte: monthAgo, $lte: now };
      } else if (periodStr === "quarter") {
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);
        query.date = { $gte: quarterAgo, $lte: now };
      } else if (periodStr === "year") {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        query.date = { $gte: yearAgo, $lte: now };
      }
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const attendance = await Attendance.find(query)
      .populate("classroomId", "name")
      .populate("records.studentId", "fullName studentId")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({
      message: "Failed to fetch attendance history",
      error: error.message,
    });
  }
};

// Update attendance record
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { classroomId, date } = req.params;
    const { records }: { records: AttendanceRecord[] } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to update attendance for this classroom",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        classroomId,
        date: new Date(date),
      },
      {
        records,
        markedBy: req.user._id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: "ATTENDANCE_UPDATED",
      details: {
        classroomId,
        date,
        recordCount: records.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error: any) {
    console.error("Error updating attendance:", error);
    res.status(500).json({
      message: "Failed to update attendance",
      error: error.message,
    });
  }
};

// Delete attendance record
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { classroomId, date } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Only admins can delete attendance records
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only administrators can delete attendance records" });
    }

    const attendance = await Attendance.findOneAndDelete({
      classroomId,
      date: new Date(date),
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: "ATTENDANCE_DELETED",
      details: {
        classroomId,
        date,
        recordCount: attendance.records.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: "Attendance record deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({
      message: "Failed to delete attendance",
      error: error.message,
    });
  }
};
