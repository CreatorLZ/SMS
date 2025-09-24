import { Request, Response } from "express";
import { User } from "../../models/User";
import { Student } from "../../models/Student";
import { Classroom } from "../../models/Classroom";
import { AuditLog } from "../../models/AuditLog";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  generateStudentId,
  isStudentIdAvailable,
} from "../../utils/studentIdGenerator";

// @desc    Register a new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      studentId,
      currentClass,
      linkedStudentIds,
      subjectSpecialization,
      assignedClassId,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // For students, check if studentId is provided and available
    if (role === "student") {
      if (!studentId || !currentClass) {
        return res.status(400).json({
          message: "Student ID and current class are required for students",
        });
      }

      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: "Student ID already exists" });
      }
    }

    // Create user - handle optional ObjectId fields properly
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || undefined,
      linkedStudentIds: role === "parent" ? linkedStudentIds : undefined,
      subjectSpecialization:
        role === "teacher" ? subjectSpecialization : undefined,
      assignedClassId:
        role === "teacher" && assignedClassId && assignedClassId.trim() !== ""
          ? assignedClassId
          : undefined,
    });

    // Create Student record if role is student
    let studentRecord = null;
    if (role === "student") {
      studentRecord = await Student.create({
        fullName: name,
        studentId,
        currentClass,
        userId: user._id,
        termFees: [],
        results: [],
      });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "USER_CREATE",
      description: `Created new ${role} account for ${name}`,
      targetId: user._id,
    });

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        ...(studentRecord && { studentId: studentRecord.studentId }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    let query: any = {};

    // Exclude teachers by default since they are managed separately in teacher management
    query.role = { $ne: "teacher" };

    // Add role filter (overrides default exclusion if specific role is requested)
    if (role && role !== "all") {
      query.role = role;
    }

    // Add status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate page and limit
    if (isNaN(pageNum) || pageNum < 1 || !isFinite(pageNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid page parameter. Must be a positive integer.",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || !isFinite(limitNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit parameter. Must be a positive integer.",
      });
    }

    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select("-password -refreshTokens")
      .populate("linkedStudentIds", "fullName studentId")
      .populate("assignedClassId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get all students with filtering and pagination
// @route   GET /api/admin/students
// @access  Private/Admin
export const getStudents = async (req: Request, res: Response) => {
  try {
    const { search, classId, page = 1, limit = 10 } = req.query;

    let query: any = {};

    // Add search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    // Add class filter
    if (classId) {
      query.currentClass = classId;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const students = await Student.find(query)
      .select("fullName studentId currentClass status createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get student by ID
// @route   GET /api/admin/students/:id
// @access  Private/Admin
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findById(id)
      .populate("classroomId", "name")
      .populate("parentId", "name email");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if user has access to this student
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      // For teachers, check if they teach this student's class
      if (req.user.role === "teacher") {
        const classroom = await Classroom.findOne({
          _id: student.classroomId,
          teacherId: req.user._id,
        });
        if (!classroom) {
          return res.status(403).json({
            message: "Not authorized to view this student",
          });
        }
      } else if (req.user.role === "parent") {
        // Parents can only view their own children
        if (student.parentId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            message: "Not authorized to view this student",
          });
        }
      } else {
        return res.status(403).json({
          message: "Not authorized to view students",
        });
      }
    }

    // Format student data to match frontend expectations
    const formattedStudent = {
      ...student.toObject(),
      // Map database fields to frontend expectations
      email: student.email, // Now using student email field
      enrollmentDate: student.admissionDate,
      // Handle populated relationships
      classroom: student.classroomId,
      parent: student.parentId,
    };

    res.json(formattedStudent);
  } catch (error: any) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      message: "Failed to fetch student",
      error: error.message,
    });
  }
};

// @desc    Create a new student
// @route   POST /api/admin/students
// @access  Private/Admin
export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      studentId: providedStudentId,
      currentClass,
      classroomId,
      parentId,
      gender,
      dateOfBirth,
      address,
      location,
      email,
      parentName,
      parentPhone,
      relationshipToStudent,
      admissionDate,
      emergencyContact,
    } = req.body;

    // Validation
    if (!gender || !["Male", "Female", "Other"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender must be Male, Female, or Other" });
    }

    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      return res
        .status(400)
        .json({ message: "Date of birth cannot be in the future" });
    }

    if (admissionDate && new Date(admissionDate) > new Date()) {
      return res
        .status(400)
        .json({ message: "Admission date cannot be in the future" });
    }

    if (parentPhone && !/^\d+$/.test(parentPhone)) {
      return res
        .status(400)
        .json({ message: "Parent phone must contain only digits" });
    }

    // Validate emergency contact if provided
    if (emergencyContact && typeof emergencyContact === "object") {
      if (
        emergencyContact.phoneNumber &&
        !/^\d+$/.test(emergencyContact.phoneNumber)
      ) {
        return res.status(400).json({
          message: "Emergency contact phone must contain only digits",
        });
      }
    }

    let studentId = providedStudentId;

    // Auto-generate student ID if not provided or empty
    if (!studentId || studentId.trim() === "") {
      studentId = await generateStudentId(currentClass);
    } else {
      // Validate provided student ID
      const isAvailable = await isStudentIdAvailable(studentId);
      if (!isAvailable) {
        return res.status(400).json({ message: "Student ID already exists" });
      }
    }

    // Create student - only include classroomId if it's a valid ObjectId
    const studentData: any = {
      firstName,
      lastName,
      studentId,
      currentClass,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      location,
      email: email || undefined, // Optional student email
      parentName,
      parentPhone,
      relationshipToStudent,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      emergencyContact: emergencyContact || {
        name: "",
        relationship: "",
        phoneNumber: "",
      },
      termFees: [],
      results: [],
    };

    // Only include classroomId if it's provided and not empty
    if (classroomId && classroomId.trim() !== "") {
      studentData.classroomId = classroomId;
    }

    const student = await Student.create(studentData);

    // If parent is provided, update parent's linked students
    if (parentId) {
      await User.findByIdAndUpdate(parentId, {
        $addToSet: { linkedStudentIds: student._id },
      });
    }

    // Create audit log (don't fail the operation if audit logging fails)
    try {
      await AuditLog.create({
        userId: req.user?._id,
        actionType: "STUDENT_CREATE",
        description: `Created new student ${firstName} ${lastName} (${studentId})`,
        targetId: student._id,
      });
    } catch (auditError) {
      console.error("Audit log creation failed:", auditError);
      // Don't return error - audit logging failure shouldn't affect the main operation
    }

    res.status(201).json({
      ...student.toObject(),
      wasAutoGenerated: !providedStudentId || providedStudentId.trim() === "",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      studentId,
      currentClass,
      parentId,
      gender,
      dateOfBirth,
      address,
      location,
      email,
      parentName,
      parentPhone,
      relationshipToStudent,
      admissionDate,
      emergencyContact,
    } = req.body;

    // Check if student exists
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validation
    if (gender && !["Male", "Female", "Other"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender must be Male, Female, or Other" });
    }

    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      return res
        .status(400)
        .json({ message: "Date of birth cannot be in the future" });
    }

    if (admissionDate && new Date(admissionDate) > new Date()) {
      return res
        .status(400)
        .json({ message: "Admission date cannot be in the future" });
    }

    if (parentPhone && !/^\d+$/.test(parentPhone)) {
      return res
        .status(400)
        .json({ message: "Parent phone must contain only digits" });
    }

    // Validate emergency contact if provided
    if (emergencyContact && typeof emergencyContact === "object") {
      if (
        emergencyContact.phoneNumber &&
        !/^\d+$/.test(emergencyContact.phoneNumber)
      ) {
        return res.status(400).json({
          message: "Emergency contact phone must contain only digits",
        });
      }
    }

    // Check if new student ID conflicts (if changed)
    if (studentId !== student.studentId) {
      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: "Student ID already exists" });
      }
    }

    // Update student - handle field mappings from frontend to database
    const updateData: any = {
      firstName,
      lastName,
      studentId,
      currentClass,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      location,
      email: email !== undefined ? email : undefined, // Optional student email
      admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      emergencyContact: emergencyContact || undefined, // Emergency contact object
    };

    // Handle parent information (map from frontend fields to database fields)
    if (parentName !== undefined) updateData.parentName = parentName;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone;
    if (relationshipToStudent !== undefined)
      updateData.relationshipToStudent = relationshipToStudent;

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Handle parent relationship
    if (parentId) {
      // Remove from old parent's linked students
      await User.updateMany(
        { linkedStudentIds: id },
        { $pull: { linkedStudentIds: id } }
      );

      // Add to new parent's linked students
      await User.findByIdAndUpdate(parentId, {
        $addToSet: { linkedStudentIds: id },
      });
    }

    // Create audit log (don't fail the operation if audit logging fails)
    try {
      await AuditLog.create({
        userId: req.user?._id,
        actionType: "STUDENT_UPDATE",
        description: `Updated student ${firstName} ${lastName} (${studentId})`,
        targetId: id,
      });
    } catch (auditError) {
      console.error("Audit log creation failed:", auditError);
      // Don't return error - audit logging failure shouldn't affect the main operation
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Toggle student status (activate/deactivate)
// @route   PATCH /api/admin/students/:id/status
// @access  Private/Admin
export const toggleStudentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Check if student exists
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // For soft delete, we can add an isActive field to the Student model
    // For now, we'll use a simple approach with a status field
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { status: isActive ? "active" : "inactive" },
      { new: true }
    );

    // Create audit log (don't fail the operation if audit logging fails)
    try {
      await AuditLog.create({
        userId: req.user?._id,
        actionType: isActive ? "STUDENT_ACTIVATE" : "STUDENT_DEACTIVATE",
        description: `${isActive ? "Activated" : "Deactivated"} student ${
          student.fullName
        }`,
        targetId: id,
      });
    } catch (auditError) {
      console.error("Audit log creation failed:", auditError);
      // Don't return error - audit logging failure shouldn't affect the main operation
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Create a new teacher
// @route   POST /api/admin/teachers
// @access  Private/Admin
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      subjectSpecializations,
      subjectSpecialization,
      assignedClassId,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // If assignedClassId is provided, check if classroom exists and is not already assigned
    if (assignedClassId) {
      const classroom = await Classroom.findById(assignedClassId);
      if (!classroom) {
        return res.status(400).json({ message: "Classroom not found" });
      }
      if (classroom.teacherId) {
        return res
          .status(400)
          .json({ message: "Classroom already has a teacher assigned" });
      }
    }

    // Prepare teacher data - handle subject specializations
    const teacherData: any = {
      name,
      email,
      password,
      role: "teacher",
      assignedClassId,
    };

    // Handle subject specializations - prefer array format but support both
    if (subjectSpecializations && Array.isArray(subjectSpecializations)) {
      // New array format
      teacherData.subjectSpecializations = subjectSpecializations;
    } else if (subjectSpecialization) {
      // Fallback to old string format
      teacherData.subjectSpecialization = subjectSpecialization;
    }

    // Create teacher
    const teacher = await User.create(teacherData);

    // Update classroom's teacherId if assigned
    if (assignedClassId) {
      await Classroom.findByIdAndUpdate(assignedClassId, {
        teacherId: teacher._id,
      });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TEACHER_CREATE",
      description: `Created new teacher ${name} (${email})`,
      targetId: teacher._id,
    });

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      subjectSpecialization: teacher.subjectSpecialization,
      assignedClassId: teacher.assignedClassId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private/Admin
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("-password -refreshTokens")
      .populate("assignedClassId", "name");

    res.json(teachers);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/admin/teachers/:id
// @access  Private/Admin
export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOne({ _id: id, role: "teacher" })
      .select("-password -refreshTokens")
      .populate("assignedClassId", "name");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Update teacher details
// @route   PUT /api/admin/teachers/:id
// @access  Private/Admin
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      subjectSpecializations,
      subjectSpecialization,
      assignedClassId,
      status,
      phone,
    } = req.body;

    // Check if teacher exists
    const teacher = await User.findOne({ _id: id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email !== teacher.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Handle classroom reassignment
    if (assignedClassId !== teacher.assignedClassId?.toString()) {
      // Remove teacher from old classroom
      if (teacher.assignedClassId) {
        await Classroom.findByIdAndUpdate(teacher.assignedClassId, {
          teacherId: null,
        });
      }

      // Check if new classroom exists and is not already assigned
      if (assignedClassId) {
        const classroom = await Classroom.findById(assignedClassId);
        if (!classroom) {
          return res.status(400).json({ message: "Classroom not found" });
        }
        if (classroom.teacherId && classroom.teacherId.toString() !== id) {
          return res
            .status(400)
            .json({ message: "Classroom already has a teacher assigned" });
        }
      }
    }

    // Prepare update data - handle subject specializations
    const updateData: any = {
      name,
      email,
      assignedClassId,
      status,
      phone,
    };

    // Handle subject specializations - prefer array format but support both
    if (subjectSpecializations && Array.isArray(subjectSpecializations)) {
      // New array format
      updateData.subjectSpecializations = subjectSpecializations;
      // Clear old format for consistency
      updateData.subjectSpecialization = undefined;
    } else if (subjectSpecialization) {
      // Fallback to old string format
      updateData.subjectSpecialization = subjectSpecialization;
      // Clear array format
      updateData.subjectSpecializations = undefined;
    }

    // Update teacher
    const updatedTeacher = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password -refreshTokens");

    // Update classroom's teacherId if assigned
    if (assignedClassId) {
      await Classroom.findByIdAndUpdate(assignedClassId, { teacherId: id });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TEACHER_UPDATE",
      description: `Updated teacher ${name} (${email})`,
      targetId: id,
    });

    res.json(updatedTeacher);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Delete/deactivate teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Private/Admin
export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if teacher exists
    const teacher = await User.findOne({ _id: id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Remove teacher from assigned classroom
    if (teacher.assignedClassId) {
      await Classroom.findByIdAndUpdate(teacher.assignedClassId, {
        teacherId: null,
      });
    }

    // Delete teacher
    await User.findByIdAndDelete(id);

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TEACHER_DELETE",
      description: `Deleted teacher ${teacher.name} (${teacher.email})`,
      targetId: id,
    });

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password -refreshTokens")
      .populate("linkedStudentIds", "fullName studentId")
      .populate("assignedClassId", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Update user details
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, phone, passportPhoto } = req.body;

    let { linkedStudentIds, subjectSpecialization, assignedClassId } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Detect role changes and handle cleanup/promotion
    const roleChanged = user.role !== role;

    // Handle teacher demotion - clear teacher-specific fields and classroom assignment
    if (roleChanged && user.role === "teacher" && role !== "teacher") {
      // Clear teacher-only fields
      subjectSpecialization = undefined;
      assignedClassId = undefined;

      // Remove teacher from assigned classroom
      if (user.assignedClassId) {
        await Classroom.findByIdAndUpdate(user.assignedClassId, {
          teacherId: null,
        });
      }
    }

    // Handle parent demotion - clear linked students
    if (roleChanged && user.role === "parent" && role !== "parent") {
      linkedStudentIds = undefined;
    }

    // Handle classroom reassignment for teachers
    if (role === "teacher") {
      if (assignedClassId !== user.assignedClassId?.toString()) {
        // Remove teacher from old classroom
        if (user.assignedClassId) {
          await Classroom.findByIdAndUpdate(user.assignedClassId, {
            teacherId: null,
          });
        }

        // Check if new classroom exists and is not already assigned
        if (assignedClassId) {
          const classroom = await Classroom.findById(assignedClassId);
          if (!classroom) {
            return res.status(400).json({
              success: false,
              message: "Classroom not found",
            });
          }
          if (classroom.teacherId && classroom.teacherId.toString() !== id) {
            return res.status(400).json({
              success: false,
              message: "Classroom already has a teacher assigned",
            });
          }
        }
      }
    }

    // Update user with validation enabled
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        role,
        status,
        phone: phone !== undefined ? phone : undefined,
        passportPhoto: passportPhoto !== undefined ? passportPhoto : undefined,
        linkedStudentIds: role === "parent" ? linkedStudentIds : undefined,
        subjectSpecialization:
          role === "teacher" ? subjectSpecialization : undefined,
        assignedClassId: role === "teacher" ? assignedClassId : undefined,
      },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens");

    // Update classroom's teacherId if assigned
    if (role === "teacher" && assignedClassId) {
      await Classroom.findByIdAndUpdate(assignedClassId, { teacherId: id });
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "USER_UPDATE",
      description: `Updated user ${name} (${email})`,
      targetId: id,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Delete/deactivate user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deletion of superadmin users
    if (user.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete superadmin users",
      });
    }

    // Handle teacher-specific cleanup before deactivation
    if (user.role === "teacher" && user.assignedClassId) {
      // Remove teacher from assigned classroom
      await Classroom.findByIdAndUpdate(user.assignedClassId, {
        teacherId: null,
      });
    }

    // Soft delete by setting status to inactive
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status: "inactive" },
      { new: true }
    ).select("-password -refreshTokens");

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "USER_DELETE",
      description: `Deactivated user ${user.name} (${user.email})`,
      targetId: id,
    });

    res.json({
      success: true,
      message: "User deactivated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Update student passport photo URL
// @route   PUT /api/admin/students/:studentId/passport-photo
// @access  Private/Admin
export const updateStudentPassportPhoto = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentId } = req.params;
    const { passportPhoto } = req.body;

    // Validate required fields
    if (!passportPhoto) {
      return res.status(400).json({
        success: false,
        message: "Passport photo URL is required",
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Update passport photo URL
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { passportPhoto },
      { new: true }
    ).select("-termFees -results");

    // Create audit log (don't fail the operation if audit logging fails)
    try {
      await AuditLog.create({
        userId: req.user?._id,
        actionType: "STUDENT_PHOTO_UPDATE",
        description: `Updated passport photo for student ${student.fullName} (${student.studentId})`,
        targetId: studentId,
      });
    } catch (auditError) {
      console.error("Audit log creation failed:", auditError);
      // Don't return error - audit logging failure shouldn't affect the main operation
    }

    res.json({
      success: true,
      message: "Passport photo updated successfully",
      data: {
        _id: updatedStudent?._id,
        studentId: updatedStudent?.studentId,
        fullName: updatedStudent?.fullName,
        passportPhoto: updatedStudent?.passportPhoto,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get audit logs with advanced filtering and pagination
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      search,
      userId,
      actionType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate and sanitize pagination parameters
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);

    const validatedPage = isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
    const validatedLimit =
      isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : Math.min(parsedLimit, 100);

    let query: any = {};

    // Text search filter (action type and description)
    if (search) {
      query.$or = [
        { actionType: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // User filter
    if (userId) {
      query.userId = userId;
    }

    // Action type filter
    if (actionType) {
      query.actionType = actionType;
    }

    // Date range filter with validation
    if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        query.timestamp.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid endDate format" });
        }
        // Set to end of day (23:59:59.999)
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const skip = (validatedPage - 1) * validatedLimit;

    const logs = await AuditLog.find(query)
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(validatedLimit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
