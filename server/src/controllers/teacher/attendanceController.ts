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
    const { classroomId, limit = 50, page = 1 } = req.query;

    // If classroomId is provided, verify teacher has access to it
    if (classroomId) {
      const classroom = await Classroom.findOne({
        _id: classroomId,
        teacherId,
      });

      if (!classroom) {
        return res.status(403).json({
          message: "You don't have access to this classroom",
        });
      }

      // Calculate pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const totalCount = await Attendance.countDocuments({
        classroomId: classroom._id,
      });

      // Get attendance records for this specific classroom with pagination
      const attendance = await Attendance.find({
        classroomId: classroom._id,
      })
        .populate({
          path: "records.studentId",
          select: "fullName studentId",
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const totalPages = Math.ceil(totalCount / parseInt(limit as string));
      const hasNextPage = parseInt(page as string) < totalPages;
      const hasPrevPage = parseInt(page as string) > 1;

      res.json({
        attendance,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          totalRecords: totalCount,
          limit: parseInt(limit as string),
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page as string) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page as string) - 1 : null,
        },
      });
    } else {
      // Get all classrooms for the teacher and their attendance
      const classrooms = await Classroom.find({ teacherId });

      if (classrooms.length === 0) {
        return res.status(404).json({ message: "No classrooms assigned" });
      }

      // Calculate pagination for each classroom
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get attendance for all teacher's classrooms with pagination
      const attendancePromises = classrooms.map(async (classroom) => {
        const attendance = await Attendance.find({
          classroomId: classroom._id,
        })
          .populate({
            path: "records.studentId",
            select: "fullName studentId",
          })
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit as string));

        return {
          classroomId: classroom._id,
          classroomName: classroom.name,
          attendance,
        };
      });

      // Get total counts for pagination metadata
      const totalCountsPromises = classrooms.map(async (classroom) =>
        Attendance.countDocuments({ classroomId: classroom._id })
      );
      const totalCounts = await Promise.all(totalCountsPromises);
      const maxTotalCount = Math.max(...totalCounts);
      const totalPages = Math.ceil(maxTotalCount / parseInt(limit as string));

      const attendanceData = await Promise.all(attendancePromises);
      const hasNextPage = parseInt(page as string) < totalPages;
      const hasPrevPage = parseInt(page as string) > 1;

      res.json({
        classrooms: attendanceData,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          limit: parseInt(limit as string),
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page as string) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page as string) - 1 : null,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
