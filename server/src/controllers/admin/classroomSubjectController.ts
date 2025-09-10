import { Request, Response } from "express";
import { Classroom } from "../../models/Classroom";
import { Subject } from "../../models/Subject";
import { AuditLog } from "../../models/AuditLog";

// @desc    Assign subjects to classroom
// @route   POST /api/classrooms/:id/subjects
// @access  Private/Admin
export const assignSubjects = async (req: Request, res: Response) => {
  try {
    const { subjectIds } = req.body;
    const classroomId: string = req.params.id;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Verify all subjects exist and are active
    const subjects = await Subject.find({
      _id: { $in: subjectIds },
      isActive: true,
    });
    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        message: "One or more subjects not found or inactive",
      });
    }

    // Get current subject IDs
    const currentSubjectIds = classroom.subjects.map((id) => id.toString());

    // Filter out subjects that are already assigned
    const newSubjectIds = subjectIds.filter(
      (id: string) => !currentSubjectIds.includes(id)
    );

    if (newSubjectIds.length === 0) {
      return res.status(400).json({
        message: "All selected subjects are already assigned to this classroom",
      });
    }

    // Add new subjects to classroom
    classroom.subjects = [...classroom.subjects, ...newSubjectIds];
    await classroom.save();

    // Get subject names for audit log
    const newSubjects = await Subject.find({ _id: { $in: newSubjectIds } });
    const subjectNames = newSubjects.map((s) => s.name).join(", ");

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "CLASSROOM_SUBJECTS_ASSIGN",
      description: `Assigned ${newSubjectIds.length} subjects to classroom ${classroom.name}: ${subjectNames}`,
      targetId: classroom._id,
    });

    // Return updated classroom with populated subjects
    const updatedClassroom = await Classroom.findById(classroomId).populate(
      "subjects",
      "name category level"
    );

    res.json({
      message: `${newSubjectIds.length} subjects assigned successfully`,
      classroom: updatedClassroom,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove subject from classroom
// @route   DELETE /api/classrooms/:id/subjects/:subjectId
// @access  Private/Admin
export const removeSubject = async (req: Request, res: Response) => {
  try {
    const classroomId: string = req.params.id;
    const subjectId: string = req.params.subjectId;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if subject is assigned to this classroom
    if (!classroom.subjects.includes(subjectId as any)) {
      return res.status(400).json({
        message: "Subject is not assigned to this classroom",
      });
    }

    // Remove subject from classroom
    classroom.subjects = classroom.subjects.filter(
      (id) => id.toString() !== subjectId
    );
    await classroom.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "CLASSROOM_SUBJECT_REMOVE",
      description: `Removed subject ${subject.name} from classroom ${classroom.name}`,
      targetId: classroom._id,
    });

    res.json({
      message: "Subject removed from classroom successfully",
      classroom,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get subjects for a specific classroom
// @route   GET /api/classrooms/:id/subjects
// @access  Private/Admin/Teacher
export const getClassroomSubjects = async (req: Request, res: Response) => {
  try {
    const classroomId: string = req.params.id;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions: admin/superadmin can access any classroom, teachers only their own
    if (
      userRole === "teacher" &&
      classroom.teacherId.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        message: "You don't have permission to access this classroom",
      });
    }

    // Get subjects for this classroom
    const subjects = await Subject.find({
      _id: { $in: classroom.subjects },
      isActive: true,
    })
      .select("name category level isActive createdAt updatedAt")
      .sort({ name: 1 });

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
      },
      subjects,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get available subjects for classroom assignment
// @route   GET /api/classrooms/:id/available-subjects
// @access  Private/Admin
export const getAvailableSubjects = async (req: Request, res: Response) => {
  try {
    const classroomId: string = req.params.id;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Get all subjects (both active and inactive)
    const allSubjects = await Subject.find({}).sort({
      name: 1,
    });

    // Get already assigned subject IDs
    const assignedSubjectIds = classroom.subjects.map((id) => id.toString());

    // Filter out already assigned subjects
    const availableSubjects = allSubjects.filter(
      (subject: any) => !assignedSubjectIds.includes(subject._id.toString())
    );

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
      },
      availableSubjects,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
