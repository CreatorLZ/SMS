import { Request, Response } from "express";
import { Classroom, ALLOWED_CLASSROOMS } from "../../models/Classroom";
import { User } from "../../models/User";
import { Student } from "../../models/Student";
import { AuditLog } from "../../models/AuditLog";

// @desc    Create a new classroom
// @route   POST /api/admin/classrooms
// @access  Private/Admin
export const createClassroom = async (req: Request, res: Response) => {
  try {
    const { name, teacherId, timetable } = req.body;

    //  Step 1: Validate classroom name
    if (!ALLOWED_CLASSROOMS.includes(name)) {
      return res.status(400).json({
        message: `Invalid class name. Allowed: ${ALLOWED_CLASSROOMS.join(
          ", "
        )}`,
      });
    }

    //  Check if classroom name already exists
    const existingClassroom = await Classroom.findOne({ name });
    if (existingClassroom) {
      return res
        .status(400)
        .json({ message: `Classroom "${name}" already exists` });
    }

    // Check if teacher exists and is actually a teacher
    const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "Teacher not found or invalid role" });
    }

    const classroom = await Classroom.create({
      name,
      teacherId,
      timetable: timetable || [],
      students: [],
    });

    // Update teacher's assigned class
    await User.findByIdAndUpdate(teacherId, { assignedClassId: classroom._id });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "CLASSROOM_CREATE",
      description: `Created new classroom ${name} with teacher ${teacher.name}`,
      targetId: classroom._id,
    });

    res.status(201).json(classroom);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Classroom name already exists (duplicate)" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
    console.log(error.message);
  }
};

// @desc    Assign students to classroom
// @route   POST /api/admin/classrooms/:id/students
// @access  Private/Admin
export const assignStudents = async (req: Request, res: Response) => {
  try {
    const { studentIds } = req.body;
    const classroomId = req.params.id;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Verify all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more students not found" });
    }

    // Update classroom students
    classroom.students = studentIds;
    await classroom.save();

    // Update each student's current class
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { currentClass: classroom.name }
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "STUDENTS_ASSIGN",
      description: `Assigned ${students.length} students to classroom ${classroom.name}`,
      targetId: classroom._id,
    });

    res.json(classroom);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all classrooms with teacher and student details
// @route   GET /api/admin/classrooms
// @access  Private/Admin
export const getClassrooms = async (req: Request, res: Response) => {
  try {
    const classrooms = await Classroom.find()
      .populate("teacherId", "name email")
      .populate("students", "fullName studentId");
    res.json(classrooms);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
