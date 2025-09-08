import { Request, Response } from "express";
import mongoose from "mongoose";
import { Student, IStudent } from "../../models/Student";
import { Classroom, IClassroom } from "../../models/Classroom";
import { Attendance } from "../../models/Attendance";
import { AuditLog } from "../../models/AuditLog";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
}

// @desc    Mark attendance for students in a class
// @route   POST /api/teacher/attendance
// @access  Private/Teacher
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { date, attendanceData } = req.body as {
      date: string;
      attendanceData: AttendanceRecord[];
    };
    const teacherId = req.user?._id;

    // Verify teacher has an assigned classroom
    const classroom = await Classroom.findOne({ teacherId })
      .populate("students")
      .exec();

    if (!classroom) {
      return res.status(404).json({ message: "No classroom assigned" });
    }

    // Validate attendance data
    for (const record of attendanceData) {
      const studentExists = classroom.students.some(
        (student: any) => student._id.toString() === record.studentId
      );

      if (!studentExists) {
        return res.status(400).json({
          message: `Student ${record.studentId} is not in your class`,
        });
      }
    }

    // Check if attendance already exists for this date and classroom
    const existingAttendance = await Attendance.findOne({
      classroomId: classroom._id,
      date: new Date(date),
    });

    let attendance;
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.records = attendanceData.map((record) => ({
        studentId: record.studentId as any,
        status: record.status,
      }));
      existingAttendance.markedBy = teacherId as any;
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        classroomId: classroom._id,
        date: new Date(date),
        records: attendanceData.map((record) => ({
          studentId: record.studentId as any,
          status: record.status,
        })),
        markedBy: teacherId as any,
      });
    }

    // Create audit log
    await AuditLog.create({
      userId: teacherId,
      actionType: "ATTENDANCE_MARKED",
      description: `Marked attendance for ${attendanceData.length} students in ${classroom.name}`,
      targetId: attendance._id,
    });

    res.json({
      success: true,
      message: existingAttendance
        ? "Attendance updated successfully"
        : "Attendance marked successfully",
      data: attendance,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get attendance history for a class
// @route   GET /api/teacher/attendance
// @access  Private/Teacher
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?._id;
    const { startDate, endDate } = req.query;

    // Get teacher's classroom
    const classroom = await Classroom.findOne({ teacherId }).populate({
      path: "students",
      select: "fullName studentId attendance",
      match: {
        "attendance.date": {
          $gte: startDate,
          $lte: endDate || new Date(),
        },
      },
    });

    if (!classroom) {
      return res.status(404).json({ message: "No classroom assigned" });
    }

    res.json(classroom.students);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
