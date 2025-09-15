import { Request, Response } from "express";
import mongoose from "mongoose";
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
    const {
      classroomId,
      date,
      records,
    }: { classroomId: string; date: string; records: AttendanceRecord[] } =
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
      !["admin", "superadmin"].includes(req.user.role) &&
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
      actionType: "ATTENDANCE_MARKED",
      description: `Marked attendance for classroom on ${date}`,
      targetId: attendance._id,
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

// Get attendance for a specific class and date
export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classroomId, date } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Parse date in local timezone (consistent with how dates are stored)
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      !["admin", "superadmin"].includes(req.user.role) &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view attendance for this classroom",
      });
    }

    const attendance = await Attendance.findOne({
      classroomId,
      date: parsedDate,
    }).populate("records.studentId", "fullName studentId");

    if (!attendance) {
      return res
        .status(200)
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

// Get attendance history for a specific student
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Build query
    const query: any = {
      "records.studentId": studentId,
    };

    // Add date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Check permissions - students and parents can only view their own attendance
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        message: "Students can only view their own attendance",
      });
    }

    // For parents, check if the student is their child
    if (req.user.role === "parent") {
      // TODO: Implement parent-student relationship check
      // Assuming a ParentStudent model exists
      // const isAssociated = await ParentStudent.findOne({ parentId: req.user._id, studentId });
      // if (!isAssociated) {
      //   return res.status(403).json({ message: "Not authorized to view this student's attendance" });
      // }
      // For now, deny access
      return res.status(403).json({
        message: "Parent access to student attendance is not implemented yet",
      });
    }

    // For teachers and admins, check classroom access
    if (!["admin", "superadmin"].includes(req.user.role)) {
      const userClassrooms = await Classroom.find({ teacherId: req.user._id });
      query.classroomId = { $in: userClassrooms.map((c) => c._id) };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const attendance = await Attendance.find(query)
      .populate("classroomId", "name")
      .populate("records.studentId", "fullName studentId")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Attendance.countDocuments(query);

    // Extract student's records from attendance
    const studentRecords = attendance
      .map((att) => {
        const studentRecord = att.records.find(
          (record) => record.studentId.toString() === studentId
        );
        if (!studentRecord) return null;
        return {
          _id: att._id,
          classroomId: att.classroomId,
          classroomName: (att.classroomId as any).name,
          date: att.date,
          status: studentRecord.status,
          markedBy: att.markedBy,
          createdAt: (att as any).createdAt,
          updatedAt: (att as any).updatedAt,
        };
      })
      .filter((record) => record !== null);

    res.json({
      attendance: studentRecords,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({
      message: "Failed to fetch student attendance",
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
        !["admin", "superadmin"].includes(req.user.role) &&
        classroom.teacherId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Not authorized to view attendance for this classroom",
        });
      }

      query.classroomId = classroomId;
    } else if (!["admin", "superadmin"].includes(req.user.role)) {
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
    const { attendanceId } = req.params;
    const { records }: { records: AttendanceRecord[] } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find the attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(attendance.classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      !["admin", "superadmin"].includes(req.user.role) &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to update attendance for this classroom",
      });
    }

    // Update the attendance record
    attendance.records = records.map((record) => ({
      studentId: record.studentId as any,
      status: record.status,
    }));
    attendance.markedBy = req.user._id as any;
    (attendance as any).updatedAt = new Date();
    await attendance.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      actionType: "ATTENDANCE_UPDATED",
      description: `Updated attendance for classroom on ${attendance.date.toDateString()}`,
      targetId: attendanceId,
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

// Get calendar attendance data for a classroom
export const getCalendarAttendance = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { month, year } = req.query;

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
      !["admin", "superadmin"].includes(req.user.role) &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view attendance for this classroom",
      });
    }

    // Calculate date range for the month
    const startDate = new Date(
      parseInt(year as string),
      parseInt(month as string) - 1,
      1
    );
    const endDate = new Date(
      parseInt(year as string),
      parseInt(month as string),
      0,
      23,
      59,
      59
    );

    // Get all attendance records for this classroom in the specified month
    const attendanceRecords = await Attendance.find({
      classroomId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Format data for calendar display
    const calendarData: {
      [date: string]: {
        present: number;
        absent: number;
        late: number;
        total: number;
      };
    } = {};

    attendanceRecords.forEach((record) => {
      // Use local date to avoid UTC timezone shifts
      const dateKey = `${record.date.getFullYear()}-${String(
        record.date.getMonth() + 1
      ).padStart(2, "0")}-${String(record.date.getDate()).padStart(2, "0")}`;
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        total: record.records.length,
      };

      record.records.forEach((studentRecord: any) => {
        if (studentRecord.status === "present") stats.present++;
        else if (studentRecord.status === "absent") stats.absent++;
        else if (studentRecord.status === "late") stats.late++;
      });

      calendarData[dateKey] = stats;
    });

    res.json(calendarData);
  } catch (error: any) {
    console.error("Error fetching calendar attendance:", error);
    res.status(500).json({
      message: "Failed to fetch calendar attendance",
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
    if (!["admin", "superadmin"].includes(req.user.role)) {
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
      actionType: "ATTENDANCE_DELETED",
      description: `Deleted attendance record for classroom on ${date}`,
      targetId: attendance._id,
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
