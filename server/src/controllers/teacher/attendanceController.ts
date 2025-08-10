import { Request, Response } from "express";
import { Student, IStudent } from "../../models/Student";
import { Classroom, IClassroom } from "../../models/Classroom";
import { AuditLog } from "../../models/AuditLog";
import { Types } from "mongoose";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent";
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
      .populate<{ students: IStudent[] }>("students")
      .exec();

    if (!classroom) {
      return res.status(404).json({ message: "No classroom assigned" });
    }

    // Validate attendance data
    for (const record of attendanceData) {
      const studentExists = classroom.students.some(
        (student) => student.studentId === record.studentId
      );

      if (!studentExists) {
        return res.status(400).json({
          message: `Student ${record.studentId} is not in your class`,
        });
      }
    }

    // Update attendance records for each student
    const updatePromises = attendanceData.map((record: AttendanceRecord) =>
      Student.findByIdAndUpdate(
        record.studentId,
        {
          $push: {
            attendance: {
              date: new Date(date),
              status: record.status,
            },
          },
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Create audit log
    await AuditLog.create({
      userId: teacherId,
      actionType: "ATTENDANCE_MARK",
      description: `Marked attendance for ${attendanceData.length} students in ${classroom.name}`,
      targetId: classroom._id,
    });

    res.json({ message: "Attendance marked successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
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
