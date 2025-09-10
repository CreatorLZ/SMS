import { Request, Response } from "express";
import { Student } from "../../models/Student";
import { Classroom } from "../../models/Classroom";
import { AuditLog } from "../../models/AuditLog";
import { Term } from "../../models/Term";

// @desc    Submit or update student results
// @route   POST /api/teacher/results
// @access  Private/Teacher
export const submitResults = async (req: Request, res: Response) => {
  try {
    const { studentId, term, year, scores, comment } = req.body;
    const teacherId = req.user?._id;
    if (!teacherId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: teacher ID missing" });
    }

    // Verify teacher has access to this student
    const classroom = await Classroom.findOne({
      teacherId,
      students: studentId,
    });

    if (!classroom) {
      return res.status(403).json({
        message: "You don't have permission to submit results for this student",
      });
    }

    // Verify term exists and is active
    const termExists = await Term.findOne({
      name: term,
      year,
      isActive: true,
    });

    if (!termExists) {
      return res.status(400).json({
        message: "Invalid or inactive term",
      });
    }

    // Validate scores
    for (const score of scores) {
      if (score.score < 0 || score.score > 100) {
        return res.status(400).json({
          message: "Scores must be between 0 and 100",
        });
      }
    }

    // Update or create result
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const resultIndex = student.results.findIndex(
      (r) => r.term === term && r.year === year
    );

    if (resultIndex > -1) {
      // Update existing result
      student.results[resultIndex] = {
        term,
        year,
        scores,
        comment,
        updatedBy: teacherId as any,
        updatedAt: new Date(),
      };
    } else {
      // Add new result
      student.results.push({
        term,
        year,
        scores,
        comment,
        updatedBy: teacherId as any,
        updatedAt: new Date(),
      });
    }

    await student.save();

    // Create audit log
    await AuditLog.create({
      userId: teacherId,
      actionType: "RESULT_SUBMIT",
      description: `${
        resultIndex > -1 ? "Updated" : "Submitted"
      } results for student ${student.fullName} (${term} ${year})`,
      targetId: student._id,
    });

    res.json({ message: "Results saved successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get student results
// @route   GET /api/teacher/results/:studentId
// @access  Private/Teacher
export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user?._id;

    // Verify teacher has access to this student
    const classroom = await Classroom.findOne({
      teacherId,
      students: studentId,
    });

    if (!classroom) {
      return res.status(403).json({
        message: "You don't have permission to view results for this student",
      });
    }

    const student = await Student.findById(studentId)
      .select("fullName studentId results")
      .populate("results.updatedBy", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get teacher's classroom details with students
// @route   GET /api/teacher/classroom
// @access  Private/Teacher
export const getClassroomDetails = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?._id;

    const classroom = await Classroom.findOne({ teacherId }).populate({
      path: "students",
      select: "fullName studentId currentClass",
    });

    if (!classroom) {
      return res.status(404).json({ message: "No classroom assigned" });
    }

    res.json(classroom);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all classrooms assigned to teacher
// @route   GET /api/teacher/classrooms
// @access  Private/Teacher
export const getTeacherClassrooms = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?._id;

    const classrooms = await Classroom.find({ teacherId })
      .populate("teacherId", "name email")
      .populate("students", "fullName studentId");

    res.json(classrooms);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
