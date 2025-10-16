import { Request, Response } from "express";
import { User } from "../../models/User";
import { Student } from "../../models/Student";
import { Classroom } from "../../models/Classroom";
import { AuditLog } from "../../models/AuditLog";
import GradingScale from "../../models/GradingScale";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as XLSX from "xlsx";
import { submitResults } from "../teacher/resultController";
import multer from "multer";

// Extend Request interface for multer file uploads
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
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
      assignedClasses,
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
      assignedClasses:
        role === "teacher" && assignedClasses && assignedClasses.length > 0
          ? assignedClasses
          : [],
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

// @desc    Get grading scales
// @route   GET /api/admin/grading-scales
// @access  Private/Admin/Teacher
export const getGradingScales = async (req: Request, res: Response) => {
  try {
    const gradingScales = await GradingScale.find({})
      .sort({ min: -1 }) // Sort by min score descending (A first)
      .select("-__v"); // Exclude version field

    res.json({
      scales: gradingScales,
      total: gradingScales.length,
    });
  } catch (error: any) {
    console.error("Error fetching grading scales:", error);
    res.status(500).json({
      message: "Failed to fetch grading scales",
      error: error.message,
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

    // Handle parent relationship changes
    const originalParentId = student.parentId?.toString();

    if (parentId !== originalParentId) {
      // Remove from old parent's linked students (if there was an old parent)
      if (originalParentId) {
        await User.findByIdAndUpdate(originalParentId, {
          $pull: { linkedStudentIds: id },
        });
      }

      // Add to new parent's linked students (if a new parent is specified)
      if (parentId) {
        await User.findByIdAndUpdate(parentId, {
          $addToSet: { linkedStudentIds: id },
        });
      }
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

// @desc    Download Excel template for bulk results upload
// @route   GET /api/admin/results/template
// @access  Private/Admin/Teacher
export const downloadResultsTemplate = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.query;

    if (!classroomId) {
      return res.status(400).json({ message: "Classroom ID is required" });
    }

    // Get classroom and subjects
    const classroom = await Classroom.findById(classroomId).populate(
      "subjects"
    );
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Get students in the classroom
    const students = await Student.find({ currentClass: classroomId })
      .select("studentId fullName firstName lastName")
      .sort({ studentId: 1 });

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found in this classroom" });
    }

    // Create Excel template data
    const templateData: any[] = [];

    // Add header row
    const headerRow: any = {
      "Student ID": "",
      "Student Name": "",
    };

    // Add subject columns for each assessment type
    classroom.subjects.forEach((subject: any) => {
      headerRow[`${subject.name} - CA1 (20)`] = "";
      headerRow[`${subject.name} - CA2 (20)`] = "";
      headerRow[`${subject.name} - Exam (60)`] = "";
    });

    // Add comment column
    headerRow["Comment"] = "";

    templateData.push(headerRow);

    // Add sample data rows for each student
    students.forEach((student) => {
      const studentRow: any = {
        "Student ID": student.studentId,
        "Student Name":
          student.fullName || `${student.firstName} ${student.lastName}`,
      };

      // Add empty columns for each subject assessment
      classroom.subjects.forEach((subject: any) => {
        studentRow[`${subject.name} - CA1 (20)`] = "";
        studentRow[`${subject.name} - CA2 (20)`] = "";
        studentRow[`${subject.name} - Exam (60)`] = "";
      });

      studentRow["Comment"] = "";
      templateData.push(studentRow);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Student ID
      { wch: 25 }, // Student Name
    ];

    // Add widths for each subject (3 columns per subject)
    classroom.subjects.forEach(() => {
      colWidths.push({ wch: 15 }, { wch: 15 }, { wch: 15 });
    });

    colWidths.push({ wch: 30 }); // Comment

    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Results Template");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers for file download
    const filename = `results_template_${classroom.name.replace(
      /\s+/g,
      "_"
    )}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error: any) {
    console.error("Error generating Excel template:", error);
    res.status(500).json({
      message: "Failed to generate Excel template",
      error: error.message,
    });
  }
};

// @desc    Upload bulk results from Excel file
// @route   POST /api/admin/results/bulk-upload
// @access  Private/Admin/Teacher
export const uploadBulkResults = async (req: MulterRequest, res: Response) => {
  try {
    const { classroomId, term, year } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    if (!classroomId || !term || !year) {
      return res.status(400).json({
        message: "Classroom ID, term, and year are required",
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length < 2) {
      return res.status(400).json({
        message:
          "Excel file must contain at least a header row and one data row",
      });
    }

    // Get classroom and subjects for validation
    const classroom = await Classroom.findById(classroomId).populate(
      "subjects"
    );
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    const subjectNames = classroom.subjects.map((s: any) => s.name);

    // Process each row (skip header)
    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any;

      const studentId = row["Student ID"];
      const studentName = row["Student Name"];

      if (!studentId) {
        errors.push(`Row ${i + 1}: Missing Student ID`);
        continue;
      }

      // Find student
      const student = await Student.findOne({ studentId });
      if (!student) {
        errors.push(`Row ${i + 1}: Student with ID ${studentId} not found`);
        continue;
      }

      // Check if student is in the correct classroom
      if (student.currentClass.toString() !== classroomId) {
        errors.push(
          `Row ${i + 1}: Student ${studentId} is not in the selected classroom`
        );
        continue;
      }

      // Parse subject scores
      const scores: any[] = [];
      let hasValidScores = false;

      subjectNames.forEach((subjectName) => {
        const ca1Key = `${subjectName} - CA1 (20)`;
        const ca2Key = `${subjectName} - CA2 (20)`;
        const examKey = `${subjectName} - Exam (60)`;

        const ca1 = parseFloat(row[ca1Key]) || 0;
        const ca2 = parseFloat(row[ca2Key]) || 0;
        const exam = parseFloat(row[examKey]) || 0;

        // Validate score ranges
        if (ca1 > 20)
          errors.push(`Row ${i + 1}: ${subjectName} CA1 score exceeds 20`);
        if (ca2 > 20)
          errors.push(`Row ${i + 1}: ${subjectName} CA2 score exceeds 20`);
        if (exam > 60)
          errors.push(`Row ${i + 1}: ${subjectName} Exam score exceeds 60`);

        if (ca1 > 0 || ca2 > 0 || exam > 0) {
          hasValidScores = true;
        }

        scores.push({
          subject: subjectName,
          assessments: { ca1, ca2, exam },
          totalScore: ca1 + ca2 + exam,
        });
      });

      if (!hasValidScores) {
        errors.push(
          `Row ${i + 1}: No valid scores found for student ${studentId}`
        );
        continue;
      }

      results.push({
        studentId: student._id,
        scores,
        comment: row["Comment"] || "",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation errors found in uploaded file",
        errors,
      });
    }

    if (results.length === 0) {
      return res.status(400).json({
        message: "No valid results found in uploaded file",
      });
    }

    // Save results directly to database (bypassing controller validation since we already validated)
    const savePromises = results.map(async (result) => {
      const student = await Student.findById(result.studentId);
      if (!student) throw new Error(`Student not found: ${result.studentId}`);

      const resultIndex = student.results.findIndex(
        (r) => r.term === term && r.year === year
      );

      if (resultIndex > -1) {
        // Update existing result
        student.results[resultIndex] = {
          term,
          year,
          scores: result.scores,
          comment: result.comment,
          updatedBy: req.user?._id as any,
          updatedAt: new Date(),
        };
      } else {
        // Add new result
        student.results.push({
          term,
          year,
          scores: result.scores,
          comment: result.comment,
          updatedBy: req.user?._id as any,
          updatedAt: new Date(),
        });
      }

      await student.save();
      return result;
    });

    await Promise.all(savePromises);

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "RESULTS_BULK_UPLOAD",
      description: `Bulk uploaded results for ${results.length} students in ${classroom.name}`,
      targetId: classroomId,
    });

    res.json({
      message: `Successfully uploaded results for ${results.length} students`,
      uploadedCount: results.length,
    });
  } catch (error: any) {
    console.error("Error processing bulk upload:", error);
    res.status(500).json({
      message: "Failed to process bulk upload",
      error: error.message,
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
      assignedClasses,
      // Additional teacher fields
      dateOfBirth,
      gender,
      nationality,
      stateOfOrigin,
      localGovernmentArea,
      address,
      alternativePhone,
      personalEmail,
      emergencyContact,
      qualification,
      yearsOfExperience,
      previousSchool,
      employmentStartDate,
      teachingLicenseNumber,
      employmentType,
      maritalStatus,
      nationalIdNumber,
      bankInformation,
      bloodGroup,
      knownAllergies,
      medicalConditions,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validation for additional fields
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

    if (employmentStartDate && new Date(employmentStartDate) > new Date()) {
      return res
        .status(400)
        .json({ message: "Employment start date cannot be in the future" });
    }

    if (
      yearsOfExperience !== undefined &&
      (yearsOfExperience < 0 || !Number.isInteger(yearsOfExperience))
    ) {
      return res.status(400).json({
        message: "Years of experience must be a non-negative integer",
      });
    }

    if (alternativePhone && !/^\d+$/.test(alternativePhone)) {
      return res
        .status(400)
        .json({ message: "Alternative phone must contain only digits" });
    }

    // Validate emergency contact - ensure all sub-fields are present or none at all
    if (emergencyContact && typeof emergencyContact === "object") {
      const { name, relationship, phoneNumber } = emergencyContact;
      const hasAnyField = name || relationship || phoneNumber;
      const hasAllFields = name && relationship && phoneNumber;

      if (hasAnyField && !hasAllFields) {
        return res.status(400).json({
          message:
            "Emergency contact must include name, relationship, and phone number, or be completely empty",
        });
      }

      if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
        return res.status(400).json({
          message: "Emergency contact phone must contain only digits",
        });
      }
    }

    // Validate bank information - ensure all sub-fields are present or none at all
    if (bankInformation && typeof bankInformation === "object") {
      const { bankName, accountNumber, accountName } = bankInformation;
      const hasAnyField = bankName || accountNumber || accountName;
      const hasAllFields = bankName && accountNumber && accountName;

      if (hasAnyField && !hasAllFields) {
        return res.status(400).json({
          message:
            "Bank information must include bank name, account number, and account name, or be completely empty",
        });
      }

      if (accountNumber && !/^\d+$/.test(accountNumber)) {
        return res.status(400).json({
          message: "Bank account number must contain only digits",
        });
      }
    }

    // If assignedClasses is provided, check if classrooms exist and are not already assigned
    if (assignedClasses && assignedClasses.length > 0) {
      for (const classId of assignedClasses) {
        const classroom = await Classroom.findById(classId);
        if (!classroom) {
          return res
            .status(400)
            .json({ message: `Classroom ${classId} not found` });
        }
        if (classroom.teacherId) {
          return res.status(400).json({
            message: `Classroom "${classroom.name}" already has a teacher assigned`,
          });
        }
      }
    }

    // Prepare teacher data - handle subject specializations and additional fields
    const teacherData: any = {
      name,
      email,
      password,
      role: "teacher",
      assignedClasses,
      // Additional teacher fields
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      nationality,
      stateOfOrigin,
      localGovernmentArea,
      address,
      alternativePhone,
      personalEmail,
      emergencyContact: emergencyContact || undefined,
      qualification,
      yearsOfExperience,
      previousSchool,
      employmentStartDate: employmentStartDate
        ? new Date(employmentStartDate)
        : undefined,
      teachingLicenseNumber,
      employmentType,
      maritalStatus,
      nationalIdNumber,
      bankInformation: bankInformation || undefined,
      bloodGroup,
      knownAllergies,
      medicalConditions,
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

    // Update classrooms' teacherId if assigned
    if (assignedClasses && assignedClasses.length > 0) {
      for (const classId of assignedClasses) {
        await Classroom.findByIdAndUpdate(classId, {
          teacherId: teacher._id,
        });
      }
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
      assignedClasses: teacher.assignedClasses,
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
      .populate("assignedClasses", "name");

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
      .populate("assignedClasses", "name");

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
      assignedClassId, // Keep for backward compatibility
      assignedClasses, // New multiple classrooms support
      status,
      phone,
      passportPhoto,
      // Additional teacher fields
      dateOfBirth,
      gender,
      nationality,
      stateOfOrigin,
      localGovernmentArea,
      address,
      alternativePhone,
      personalEmail,
      emergencyContact,
      qualification,
      yearsOfExperience,
      previousSchool,
      employmentStartDate,
      teachingLicenseNumber,
      employmentType,
      maritalStatus,
      nationalIdNumber,
      bankInformation,
      bloodGroup,
      knownAllergies,
      medicalConditions,
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

    // Validation for additional teacher fields
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

    if (employmentStartDate && new Date(employmentStartDate) > new Date()) {
      return res
        .status(400)
        .json({ message: "Employment start date cannot be in the future" });
    }

    if (
      yearsOfExperience !== undefined &&
      (yearsOfExperience < 0 || !Number.isInteger(yearsOfExperience))
    ) {
      return res.status(400).json({
        message: "Years of experience must be a non-negative integer",
      });
    }

    if (alternativePhone && !/^\d+$/.test(alternativePhone)) {
      return res
        .status(400)
        .json({ message: "Alternative phone must contain only digits" });
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

    // Validate bank information if provided
    if (bankInformation && typeof bankInformation === "object") {
      if (
        bankInformation.accountNumber &&
        !/^\d+$/.test(bankInformation.accountNumber)
      ) {
        return res.status(400).json({
          message: "Bank account number must contain only digits",
        });
      }
    }

    // Determine which classroom assignment format to use
    let newAssignedClasses: string[] = [];

    if (
      assignedClasses &&
      Array.isArray(assignedClasses) &&
      assignedClasses.length > 0
    ) {
      // New multi-classroom format - use this as the source of truth
      newAssignedClasses = [...assignedClasses];
    } else if (assignedClassId) {
      // Single classroom format (backward compatibility) - convert to array
      newAssignedClasses = [assignedClassId];
    } else {
      // No classroom assignment - empty array
      newAssignedClasses = [];
    }

    // Validate all classrooms exist and are not already assigned to other teachers
    for (const classroomId of newAssignedClasses) {
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res
          .status(400)
          .json({ message: `Classroom ${classroomId} not found` });
      }
      // Allow reassignment if the classroom is currently assigned to this teacher
      if (classroom.teacherId && classroom.teacherId.toString() !== id) {
        return res.status(400).json({
          message: `Classroom "${classroom.name}" already has a teacher assigned. Use classroom management to reassign.`,
        });
      }
    }

    // Handle classroom reassignments
    // 1. Remove teacher from classrooms they're no longer assigned to
    const currentAssignedClasses = teacher.assignedClasses || [];
    const currentAssignedClassIds = currentAssignedClasses.map((c) =>
      c.toString()
    );

    // If teacher had single classroom assignment, remove it
    if (
      teacher.assignedClassId &&
      !currentAssignedClassIds.includes(teacher.assignedClassId.toString())
    ) {
      await Classroom.findByIdAndUpdate(teacher.assignedClassId, {
        teacherId: null,
      });
    }

    // Remove teacher from classrooms not in the new list
    for (const currentClassId of currentAssignedClassIds) {
      if (!newAssignedClasses.includes(currentClassId)) {
        await Classroom.findByIdAndUpdate(currentClassId, {
          teacherId: null,
        });
      }
    }

    // 2. Add teacher to new classrooms
    for (const newClassId of newAssignedClasses) {
      await Classroom.findByIdAndUpdate(newClassId, { teacherId: id });
    }

    // Prepare update data - handle subject specializations and classrooms
    const updateData: any = {
      name,
      email,
      assignedClasses:
        newAssignedClasses.length > 0 ? newAssignedClasses : undefined,
      status,
      phone,
      passportPhoto: passportPhoto !== undefined ? passportPhoto : undefined,
      // Additional teacher fields
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      nationality,
      stateOfOrigin,
      localGovernmentArea,
      address,
      alternativePhone,
      personalEmail,
      emergencyContact: emergencyContact || undefined,
      qualification,
      yearsOfExperience,
      previousSchool,
      employmentStartDate: employmentStartDate
        ? new Date(employmentStartDate)
        : undefined,
      teachingLicenseNumber,
      employmentType,
      maritalStatus,
      nationalIdNumber,
      bankInformation: bankInformation || undefined,
      bloodGroup,
      knownAllergies,
      medicalConditions,
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
    })
      .select("-password -refreshTokens")
      .populate("assignedClasses", "name");

    // Create audit log
    const classroomCount = newAssignedClasses.length;
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TEACHER_UPDATE",
      description: `Updated teacher ${name} (${email}) with ${classroomCount} classroom${
        classroomCount !== 1 ? "s" : ""
      }`,
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

    // Remove teacher from assigned classrooms
    if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
      for (const classId of teacher.assignedClasses) {
        await Classroom.findByIdAndUpdate(classId, {
          teacherId: null,
        });
      }
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
      .populate("assignedClasses", "name");

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

      // Remove teacher from assigned classrooms
      if (user.assignedClasses && user.assignedClasses.length > 0) {
        for (const classId of user.assignedClasses) {
          await Classroom.findByIdAndUpdate(classId, {
            teacherId: null,
          });
        }
      }
    }

    // Handle parent demotion - clear linked students
    if (roleChanged && user.role === "parent" && role !== "parent") {
      linkedStudentIds = undefined;
    }

    // Handle classroom reassignment for teachers
    if (role === "teacher") {
      // For now, keep this simple - the assignedClasses field should be handled by teacher-specific endpoints
      // This general user update endpoint should not handle complex classroom assignments
      if (assignedClassId) {
        return res.status(400).json({
          success: false,
          message: "Use teacher management endpoints to assign classrooms",
        });
      }
    }

    // Prepare update data carefully to avoid corrupting linkedStudentIds
    const updateData: any = {
      name,
      email,
      role,
      status,
      phone: phone !== undefined ? phone : undefined,
      passportPhoto: passportPhoto !== undefined ? passportPhoto : undefined,
    };

    // Handle linkedStudentIds carefully - only set if explicitly provided for parent role
    if (role === "parent") {
      // If linkedStudentIds is explicitly provided, use it; otherwise keep existing
      if (linkedStudentIds !== undefined) {
        updateData.linkedStudentIds = linkedStudentIds;
      }
      // For parent role, if linkedStudentIds is not provided, don't modify it
    } else {
      // For non-parent roles, clear linkedStudentIds
      updateData.linkedStudentIds = undefined;
    }

    // Handle teacher-specific fields
    if (role === "teacher") {
      updateData.subjectSpecialization = subjectSpecialization;
      // Note: assignedClasses should be managed by teacher-specific endpoints
    } else {
      // Clear teacher-specific fields for non-teacher roles
      updateData.subjectSpecialization = undefined;
      updateData.assignedClasses = undefined;
    }

    // Update user with validation enabled
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens");

    // Note: Classroom assignments should be handled by teacher-specific endpoints
    // This general user update endpoint does not handle classroom assignments

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
    if (
      user.role === "teacher" &&
      user.assignedClasses &&
      user.assignedClasses.length > 0
    ) {
      // Remove teacher from assigned classrooms
      for (const classId of user.assignedClasses) {
        await Classroom.findByIdAndUpdate(classId, {
          teacherId: null,
        });
      }
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
