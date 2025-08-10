import { Request, Response } from "express";
import { Student } from "../../models/Student";
import { User } from "../../models/User";
import { AuditLog } from "../../models/AuditLog";

// @desc    Get student's results with PIN
// @route   POST /api/student/results/verify
// @access  Public
export const verifyAndGetResults = async (req: Request, res: Response) => {
  try {
    const { studentId, pinCode, term, year } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the term fee record
    const termFee = student.termFees.find(
      (fee) => fee.term === term && fee.year === year
    );

    if (!termFee) {
      return res.status(404).json({ message: "Term record not found" });
    }

    // Verify PIN and fee payment
    if (termFee.pinCode !== pinCode) {
      return res.status(403).json({ message: "Invalid PIN" });
    }

    if (!termFee.paid) {
      return res.status(403).json({ message: "Term fees not paid" });
    }

    if (!termFee.viewable) {
      return res
        .status(403)
        .json({ message: "Results not yet available for viewing" });
    }

    // Get results for the specified term
    const results = student.results.find(
      (result) => result.term === term && result.year === year
    );

    if (!results) {
      return res
        .status(404)
        .json({ message: "No results found for this term" });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id || null,
      actionType: "RESULT_VIEW",
      description: `Results viewed for student ${student.fullName} (${term} ${year})`,
      targetId: student._id,
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get student's attendance history
// @route   GET /api/student/attendance
// @access  Private/Student/Parent
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { startDate, endDate } = req.query;

    let student;

    // Check if user is a student
    if (req.user?.role === "student") {
      student = await Student.findOne({ userId }).select(
        "fullName studentId attendance"
      );
    }
    // If parent, get attendance for the specified child
    else if (req.user?.role === "parent") {
      const parent = await User.findById(userId);
      if (!parent?.linkedStudentIds?.length) {
        return res.status(404).json({ message: "No linked students found" });
      }

      const { studentId } = req.query;
      if (
        !studentId ||
        !parent.linkedStudentIds.includes(studentId as string)
      ) {
        return res
          .status(403)
          .json({ message: "Access denied to this student's records" });
      }

      student = await Student.findById(studentId).select(
        "fullName studentId attendance"
      );
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Filter attendance by date range if provided
    let filteredAttendance = student.attendance;
    if (startDate || endDate) {
      filteredAttendance = student.attendance.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          (!startDate || recordDate >= new Date(startDate as string)) &&
          (!endDate || recordDate <= new Date(endDate as string))
        );
      });
    }

    res.json({
      studentInfo: {
        fullName: student.fullName,
        studentId: student.studentId,
      },
      attendance: filteredAttendance,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
