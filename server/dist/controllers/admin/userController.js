"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.updateStudentPassportPhoto = exports.deleteUser = exports.updateUser = exports.getUserById = exports.deleteTeacher = exports.updateTeacher = exports.getTeacherById = exports.getTeachers = exports.createTeacher = exports.uploadBulkResults = exports.downloadResultsTemplate = exports.toggleStudentStatus = exports.updateStudent = exports.createStudent = exports.getStudentById = exports.getStudents = exports.getUsers = exports.getGradingScales = exports.registerUser = void 0;
const User_1 = require("../../models/User");
const Student_1 = require("../../models/Student");
const Classroom_1 = require("../../models/Classroom");
const AuditLog_1 = require("../../models/AuditLog");
const GradingScale_1 = __importDefault(require("../../models/GradingScale"));
const XLSX = __importStar(require("xlsx"));
const studentIdGenerator_1 = require("../../utils/studentIdGenerator");
// @desc    Register a new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, password, role, phone, studentId, currentClass, linkedStudentIds, subjectSpecialization, assignedClassId, } = req.body;
        // Check if user already exists
        const userExists = yield User_1.User.findOne({ email });
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
            const existingStudent = yield Student_1.Student.findOne({ studentId });
            if (existingStudent) {
                return res.status(400).json({ message: "Student ID already exists" });
            }
        }
        // Create user - handle optional ObjectId fields properly
        const user = yield User_1.User.create({
            name,
            email,
            password,
            role,
            phone: phone || undefined,
            linkedStudentIds: role === "parent" ? linkedStudentIds : undefined,
            subjectSpecialization: role === "teacher" ? subjectSpecialization : undefined,
            assignedClassId: role === "teacher" && assignedClassId && assignedClassId.trim() !== ""
                ? assignedClassId
                : undefined,
        });
        // Create Student record if role is student
        let studentRecord = null;
        if (role === "student") {
            studentRecord = yield Student_1.Student.create({
                fullName: name,
                studentId,
                currentClass,
                userId: user._id,
                termFees: [],
                results: [],
            });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "USER_CREATE",
            description: `Created new ${role} account for ${name}`,
            targetId: user._id,
        });
        res.status(201).json({
            success: true,
            message: `${role} created successfully`,
            data: Object.assign({ _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }, (studentRecord && { studentId: studentRecord.studentId })),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.registerUser = registerUser;
// @desc    Get grading scales
// @route   GET /api/admin/grading-scales
// @access  Private/Admin/Teacher
const getGradingScales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gradingScales = yield GradingScale_1.default.find({})
            .sort({ min: -1 }) // Sort by min score descending (A first)
            .select("-__v"); // Exclude version field
        res.json({
            scales: gradingScales,
            total: gradingScales.length,
        });
    }
    catch (error) {
        console.error("Error fetching grading scales:", error);
        res.status(500).json({
            message: "Failed to fetch grading scales",
            error: error.message,
        });
    }
});
exports.getGradingScales = getGradingScales;
// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, status, search, page = 1, limit = 10 } = req.query;
        let query = {};
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
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
        const users = yield User_1.User.find(query)
            .select("-password -refreshTokens")
            .populate("linkedStudentIds", "fullName studentId")
            .populate("assignedClassId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield User_1.User.countDocuments(query);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getUsers = getUsers;
// @desc    Get all students with filtering and pagination
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, classId, page = 1, limit = 10 } = req.query;
        let query = {};
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const students = yield Student_1.Student.find(query)
            .select("fullName studentId currentClass status createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield Student_1.Student.countDocuments(query);
        res.json({
            students,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getStudents = getStudents;
// @desc    Get student by ID
// @route   GET /api/admin/students/:id
// @access  Private/Admin
const getStudentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const student = yield Student_1.Student.findById(id)
            .populate("classroomId", "name")
            .populate("parentId", "name email");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Check if user has access to this student
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            // For teachers, check if they teach this student's class
            if (req.user.role === "teacher") {
                const classroom = yield Classroom_1.Classroom.findOne({
                    _id: student.classroomId,
                    teacherId: req.user._id,
                });
                if (!classroom) {
                    return res.status(403).json({
                        message: "Not authorized to view this student",
                    });
                }
            }
            else if (req.user.role === "parent") {
                // Parents can only view their own children
                if (((_a = student.parentId) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user._id.toString()) {
                    return res.status(403).json({
                        message: "Not authorized to view this student",
                    });
                }
            }
            else {
                return res.status(403).json({
                    message: "Not authorized to view students",
                });
            }
        }
        // Format student data to match frontend expectations
        const formattedStudent = Object.assign(Object.assign({}, student.toObject()), { 
            // Map database fields to frontend expectations
            email: student.email, enrollmentDate: student.admissionDate, 
            // Handle populated relationships
            classroom: student.classroomId, parent: student.parentId });
        res.json(formattedStudent);
    }
    catch (error) {
        console.error("Error fetching student:", error);
        res.status(500).json({
            message: "Failed to fetch student",
            error: error.message,
        });
    }
});
exports.getStudentById = getStudentById;
// @desc    Create a new student
// @route   POST /api/admin/students
// @access  Private/Admin
const createStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { firstName, lastName, studentId: providedStudentId, currentClass, classroomId, parentId, gender, dateOfBirth, address, location, email, parentName, parentPhone, relationshipToStudent, admissionDate, emergencyContact, } = req.body;
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
            if (emergencyContact.phoneNumber &&
                !/^\d+$/.test(emergencyContact.phoneNumber)) {
                return res.status(400).json({
                    message: "Emergency contact phone must contain only digits",
                });
            }
        }
        let studentId = providedStudentId;
        // Auto-generate student ID if not provided or empty
        if (!studentId || studentId.trim() === "") {
            studentId = yield (0, studentIdGenerator_1.generateStudentId)(currentClass);
        }
        else {
            // Validate provided student ID
            const isAvailable = yield (0, studentIdGenerator_1.isStudentIdAvailable)(studentId);
            if (!isAvailable) {
                return res.status(400).json({ message: "Student ID already exists" });
            }
        }
        // Create student - only include classroomId if it's a valid ObjectId
        const studentData = {
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
        const student = yield Student_1.Student.create(studentData);
        // If parent is provided, update parent's linked students
        if (parentId) {
            yield User_1.User.findByIdAndUpdate(parentId, {
                $addToSet: { linkedStudentIds: student._id },
            });
        }
        // Create audit log (don't fail the operation if audit logging fails)
        try {
            yield AuditLog_1.AuditLog.create({
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                actionType: "STUDENT_CREATE",
                description: `Created new student ${firstName} ${lastName} (${studentId})`,
                targetId: student._id,
            });
        }
        catch (auditError) {
            console.error("Audit log creation failed:", auditError);
            // Don't return error - audit logging failure shouldn't affect the main operation
        }
        res.status(201).json(Object.assign(Object.assign({}, student.toObject()), { wasAutoGenerated: !providedStudentId || providedStudentId.trim() === "" }));
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.createStudent = createStudent;
// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
const updateStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { firstName, lastName, studentId, currentClass, parentId, gender, dateOfBirth, address, location, email, parentName, parentPhone, relationshipToStudent, admissionDate, emergencyContact, } = req.body;
        // Check if student exists
        const student = yield Student_1.Student.findById(id);
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
            if (emergencyContact.phoneNumber &&
                !/^\d+$/.test(emergencyContact.phoneNumber)) {
                return res.status(400).json({
                    message: "Emergency contact phone must contain only digits",
                });
            }
        }
        // Check if new student ID conflicts (if changed)
        if (studentId !== student.studentId) {
            const existingStudent = yield Student_1.Student.findOne({ studentId });
            if (existingStudent) {
                return res.status(400).json({ message: "Student ID already exists" });
            }
        }
        // Update student - handle field mappings from frontend to database
        const updateData = {
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
        if (parentName !== undefined)
            updateData.parentName = parentName;
        if (parentPhone !== undefined)
            updateData.parentPhone = parentPhone;
        if (relationshipToStudent !== undefined)
            updateData.relationshipToStudent = relationshipToStudent;
        const updatedStudent = yield Student_1.Student.findByIdAndUpdate(id, updateData, {
            new: true,
        });
        // Handle parent relationship changes
        const originalParentId = (_a = student.parentId) === null || _a === void 0 ? void 0 : _a.toString();
        if (parentId !== originalParentId) {
            // Remove from old parent's linked students (if there was an old parent)
            if (originalParentId) {
                yield User_1.User.findByIdAndUpdate(originalParentId, {
                    $pull: { linkedStudentIds: id },
                });
            }
            // Add to new parent's linked students (if a new parent is specified)
            if (parentId) {
                yield User_1.User.findByIdAndUpdate(parentId, {
                    $addToSet: { linkedStudentIds: id },
                });
            }
        }
        // Create audit log (don't fail the operation if audit logging fails)
        try {
            yield AuditLog_1.AuditLog.create({
                userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
                actionType: "STUDENT_UPDATE",
                description: `Updated student ${firstName} ${lastName} (${studentId})`,
                targetId: id,
            });
        }
        catch (auditError) {
            console.error("Audit log creation failed:", auditError);
            // Don't return error - audit logging failure shouldn't affect the main operation
        }
        res.json(updatedStudent);
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.updateStudent = updateStudent;
// @desc    Toggle student status (activate/deactivate)
// @route   PATCH /api/admin/students/:id/status
// @access  Private/Admin
const toggleStudentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        // Check if student exists
        const student = yield Student_1.Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // For soft delete, we can add an isActive field to the Student model
        // For now, we'll use a simple approach with a status field
        const updatedStudent = yield Student_1.Student.findByIdAndUpdate(id, { status: isActive ? "active" : "inactive" }, { new: true });
        // Create audit log (don't fail the operation if audit logging fails)
        try {
            yield AuditLog_1.AuditLog.create({
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                actionType: isActive ? "STUDENT_ACTIVATE" : "STUDENT_DEACTIVATE",
                description: `${isActive ? "Activated" : "Deactivated"} student ${student.fullName}`,
                targetId: id,
            });
        }
        catch (auditError) {
            console.error("Audit log creation failed:", auditError);
            // Don't return error - audit logging failure shouldn't affect the main operation
        }
        res.json(updatedStudent);
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.toggleStudentStatus = toggleStudentStatus;
// @desc    Download Excel template for bulk results upload
// @route   GET /api/admin/results/template
// @access  Private/Admin/Teacher
const downloadResultsTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId } = req.query;
        if (!classroomId) {
            return res.status(400).json({ message: "Classroom ID is required" });
        }
        // Get classroom and subjects
        const classroom = yield Classroom_1.Classroom.findById(classroomId).populate("subjects");
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Get students in the classroom
        const students = yield Student_1.Student.find({ currentClass: classroomId })
            .select("studentId fullName firstName lastName")
            .sort({ studentId: 1 });
        if (students.length === 0) {
            return res
                .status(404)
                .json({ message: "No students found in this classroom" });
        }
        // Create Excel template data
        const templateData = [];
        // Add header row
        const headerRow = {
            "Student ID": "",
            "Student Name": "",
        };
        // Add subject columns for each assessment type
        classroom.subjects.forEach((subject) => {
            headerRow[`${subject.name} - CA1 (20)`] = "";
            headerRow[`${subject.name} - CA2 (20)`] = "";
            headerRow[`${subject.name} - Exam (60)`] = "";
        });
        // Add comment column
        headerRow["Comment"] = "";
        templateData.push(headerRow);
        // Add sample data rows for each student
        students.forEach((student) => {
            const studentRow = {
                "Student ID": student.studentId,
                "Student Name": student.fullName || `${student.firstName} ${student.lastName}`,
            };
            // Add empty columns for each subject assessment
            classroom.subjects.forEach((subject) => {
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
        const filename = `results_template_${classroom.name.replace(/\s+/g, "_")}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    catch (error) {
        console.error("Error generating Excel template:", error);
        res.status(500).json({
            message: "Failed to generate Excel template",
            error: error.message,
        });
    }
});
exports.downloadResultsTemplate = downloadResultsTemplate;
// @desc    Upload bulk results from Excel file
// @route   POST /api/admin/results/bulk-upload
// @access  Private/Admin/Teacher
const uploadBulkResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
                message: "Excel file must contain at least a header row and one data row",
            });
        }
        // Get classroom and subjects for validation
        const classroom = yield Classroom_1.Classroom.findById(classroomId).populate("subjects");
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        const subjectNames = classroom.subjects.map((s) => s.name);
        // Process each row (skip header)
        const results = [];
        const errors = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const studentId = row["Student ID"];
            const studentName = row["Student Name"];
            if (!studentId) {
                errors.push(`Row ${i + 1}: Missing Student ID`);
                continue;
            }
            // Find student
            const student = yield Student_1.Student.findOne({ studentId });
            if (!student) {
                errors.push(`Row ${i + 1}: Student with ID ${studentId} not found`);
                continue;
            }
            // Check if student is in the correct classroom
            if (student.currentClass.toString() !== classroomId) {
                errors.push(`Row ${i + 1}: Student ${studentId} is not in the selected classroom`);
                continue;
            }
            // Parse subject scores
            const scores = [];
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
                errors.push(`Row ${i + 1}: No valid scores found for student ${studentId}`);
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
        const savePromises = results.map((result) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const student = yield Student_1.Student.findById(result.studentId);
            if (!student)
                throw new Error(`Student not found: ${result.studentId}`);
            const resultIndex = student.results.findIndex((r) => r.term === term && r.year === year);
            if (resultIndex > -1) {
                // Update existing result
                student.results[resultIndex] = {
                    term,
                    year,
                    scores: result.scores,
                    comment: result.comment,
                    updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                    updatedAt: new Date(),
                };
            }
            else {
                // Add new result
                student.results.push({
                    term,
                    year,
                    scores: result.scores,
                    comment: result.comment,
                    updatedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
                    updatedAt: new Date(),
                });
            }
            yield student.save();
            return result;
        }));
        yield Promise.all(savePromises);
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "RESULTS_BULK_UPLOAD",
            description: `Bulk uploaded results for ${results.length} students in ${classroom.name}`,
            targetId: classroomId,
        });
        res.json({
            message: `Successfully uploaded results for ${results.length} students`,
            uploadedCount: results.length,
        });
    }
    catch (error) {
        console.error("Error processing bulk upload:", error);
        res.status(500).json({
            message: "Failed to process bulk upload",
            error: error.message,
        });
    }
});
exports.uploadBulkResults = uploadBulkResults;
// @desc    Create a new teacher
// @route   POST /api/admin/teachers
// @access  Private/Admin
const createTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, password, subjectSpecializations, subjectSpecialization, assignedClassId, } = req.body;
        // Check if user already exists
        const userExists = yield User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        // If assignedClassId is provided, check if classroom exists and is not already assigned
        if (assignedClassId) {
            const classroom = yield Classroom_1.Classroom.findById(assignedClassId);
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
        const teacherData = {
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
        }
        else if (subjectSpecialization) {
            // Fallback to old string format
            teacherData.subjectSpecialization = subjectSpecialization;
        }
        // Create teacher
        const teacher = yield User_1.User.create(teacherData);
        // Update classroom's teacherId if assigned
        if (assignedClassId) {
            yield Classroom_1.Classroom.findByIdAndUpdate(assignedClassId, {
                teacherId: teacher._id,
            });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
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
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.createTeacher = createTeacher;
// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private/Admin
const getTeachers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teachers = yield User_1.User.find({ role: "teacher" })
            .select("-password -refreshTokens")
            .populate("assignedClasses", "name");
        res.json(teachers);
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getTeachers = getTeachers;
// @desc    Get teacher by ID
// @route   GET /api/admin/teachers/:id
// @access  Private/Admin
const getTeacherById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const teacher = yield User_1.User.findOne({ _id: id, role: "teacher" })
            .select("-password -refreshTokens")
            .populate("assignedClasses", "name");
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json(teacher);
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getTeacherById = getTeacherById;
// @desc    Update teacher details
// @route   PUT /api/admin/teachers/:id
// @access  Private/Admin
const updateTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { name, email, subjectSpecializations, subjectSpecialization, assignedClassId, // Keep for backward compatibility
        assignedClasses, // New multiple classrooms support
        status, phone, passportPhoto, } = req.body;
        // Check if teacher exists
        const teacher = yield User_1.User.findOne({ _id: id, role: "teacher" });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        // Check if email is being changed and if it's already taken
        if (email !== teacher.email) {
            const existingUser = yield User_1.User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }
        // Determine which classroom assignment format to use
        let newAssignedClasses = [];
        if (assignedClasses &&
            Array.isArray(assignedClasses) &&
            assignedClasses.length > 0) {
            // New multi-classroom format - use this as the source of truth
            newAssignedClasses = [...assignedClasses];
        }
        else if (assignedClassId) {
            // Single classroom format (backward compatibility) - convert to array
            newAssignedClasses = [assignedClassId];
        }
        else {
            // No classroom assignment - empty array
            newAssignedClasses = [];
        }
        // Validate all classrooms exist and are not already assigned to other teachers
        for (const classroomId of newAssignedClasses) {
            const classroom = yield Classroom_1.Classroom.findById(classroomId);
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
        const currentAssignedClassIds = currentAssignedClasses.map((c) => c.toString());
        // If teacher had single classroom assignment, remove it
        if (teacher.assignedClassId &&
            !currentAssignedClassIds.includes(teacher.assignedClassId.toString())) {
            yield Classroom_1.Classroom.findByIdAndUpdate(teacher.assignedClassId, {
                teacherId: null,
            });
        }
        // Remove teacher from classrooms not in the new list
        for (const currentClassId of currentAssignedClassIds) {
            if (!newAssignedClasses.includes(currentClassId)) {
                yield Classroom_1.Classroom.findByIdAndUpdate(currentClassId, {
                    teacherId: null,
                });
            }
        }
        // 2. Add teacher to new classrooms
        for (const newClassId of newAssignedClasses) {
            yield Classroom_1.Classroom.findByIdAndUpdate(newClassId, { teacherId: id });
        }
        // Prepare update data - handle subject specializations and classrooms
        const updateData = {
            name,
            email,
            assignedClasses: newAssignedClasses.length > 0 ? newAssignedClasses : undefined,
            status,
            phone,
            passportPhoto: passportPhoto !== undefined ? passportPhoto : undefined,
        };
        // Handle subject specializations - prefer array format but support both
        if (subjectSpecializations && Array.isArray(subjectSpecializations)) {
            // New array format
            updateData.subjectSpecializations = subjectSpecializations;
            // Clear old format for consistency
            updateData.subjectSpecialization = undefined;
        }
        else if (subjectSpecialization) {
            // Fallback to old string format
            updateData.subjectSpecialization = subjectSpecialization;
            // Clear array format
            updateData.subjectSpecializations = undefined;
        }
        // Update teacher
        const updatedTeacher = yield User_1.User.findByIdAndUpdate(id, updateData, {
            new: true,
        })
            .select("-password -refreshTokens")
            .populate("assignedClasses", "name");
        // Create audit log
        const classroomCount = newAssignedClasses.length;
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "TEACHER_UPDATE",
            description: `Updated teacher ${name} (${email}) with ${classroomCount} classroom${classroomCount !== 1 ? "s" : ""}`,
            targetId: id,
        });
        res.json(updatedTeacher);
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.updateTeacher = updateTeacher;
// @desc    Delete/deactivate teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Private/Admin
const deleteTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // Check if teacher exists
        const teacher = yield User_1.User.findOne({ _id: id, role: "teacher" });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        // Remove teacher from assigned classroom
        if (teacher.assignedClassId) {
            yield Classroom_1.Classroom.findByIdAndUpdate(teacher.assignedClassId, {
                teacherId: null,
            });
        }
        // Delete teacher
        yield User_1.User.findByIdAndDelete(id);
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "TEACHER_DELETE",
            description: `Deleted teacher ${teacher.name} (${teacher.email})`,
            targetId: id,
        });
        res.json({ message: "Teacher deleted successfully" });
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.deleteTeacher = deleteTeacher;
// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield User_1.User.findById(id)
            .select("-password -refreshTokens")
            .populate("linkedStudentIds", "fullName studentId")
            .populate("assignedClasses", "name")
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getUserById = getUserById;
// @desc    Update user details
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { name, email, role, status, phone, passportPhoto } = req.body;
        let { linkedStudentIds, subjectSpecialization, assignedClassId } = req.body;
        // Check if user exists
        const user = yield User_1.User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Check if email is being changed and if it's already taken
        if (email !== user.email) {
            const existingUser = yield User_1.User.findOne({ email });
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
                yield Classroom_1.Classroom.findByIdAndUpdate(user.assignedClassId, {
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
            if (assignedClassId !== ((_a = user.assignedClassId) === null || _a === void 0 ? void 0 : _a.toString())) {
                // Remove teacher from old classroom
                if (user.assignedClassId) {
                    yield Classroom_1.Classroom.findByIdAndUpdate(user.assignedClassId, {
                        teacherId: null,
                    });
                }
                // Check if new classroom exists and is not already assigned
                if (assignedClassId) {
                    const classroom = yield Classroom_1.Classroom.findById(assignedClassId);
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
        // Prepare update data carefully to avoid corrupting linkedStudentIds
        const updateData = {
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
        }
        else {
            // For non-parent roles, clear linkedStudentIds
            updateData.linkedStudentIds = undefined;
        }
        // Handle teacher-specific fields
        if (role === "teacher") {
            updateData.subjectSpecialization = subjectSpecialization;
            updateData.assignedClassId = assignedClassId;
        }
        else {
            // Clear teacher-specific fields for non-teacher roles
            updateData.subjectSpecialization = undefined;
            updateData.assignedClassId = undefined;
        }
        // Update user with validation enabled
        const updatedUser = yield User_1.User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).select("-password -refreshTokens");
        // Update classroom's teacherId if assigned
        if (role === "teacher" && assignedClassId) {
            yield Classroom_1.Classroom.findByIdAndUpdate(assignedClassId, { teacherId: id });
        }
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            actionType: "USER_UPDATE",
            description: `Updated user ${name} (${email})`,
            targetId: id,
        });
        res.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.updateUser = updateUser;
// @desc    Delete/deactivate user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // Check if user exists
        const user = yield User_1.User.findById(id);
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
            yield Classroom_1.Classroom.findByIdAndUpdate(user.assignedClassId, {
                teacherId: null,
            });
        }
        // Soft delete by setting status to inactive
        const updatedUser = yield User_1.User.findByIdAndUpdate(id, { status: "inactive" }, { new: true }).select("-password -refreshTokens");
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "USER_DELETE",
            description: `Deactivated user ${user.name} (${user.email})`,
            targetId: id,
        });
        res.json({
            success: true,
            message: "User deactivated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.deleteUser = deleteUser;
// @desc    Update student passport photo URL
// @route   PUT /api/admin/students/:studentId/passport-photo
// @access  Private/Admin
const updateStudentPassportPhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const student = yield Student_1.Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }
        // Update passport photo URL
        const updatedStudent = yield Student_1.Student.findByIdAndUpdate(studentId, { passportPhoto }, { new: true }).select("-termFees -results");
        // Create audit log (don't fail the operation if audit logging fails)
        try {
            yield AuditLog_1.AuditLog.create({
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                actionType: "STUDENT_PHOTO_UPDATE",
                description: `Updated passport photo for student ${student.fullName} (${student.studentId})`,
                targetId: studentId,
            });
        }
        catch (auditError) {
            console.error("Audit log creation failed:", auditError);
            // Don't return error - audit logging failure shouldn't affect the main operation
        }
        res.json({
            success: true,
            message: "Passport photo updated successfully",
            data: {
                _id: updatedStudent === null || updatedStudent === void 0 ? void 0 : updatedStudent._id,
                studentId: updatedStudent === null || updatedStudent === void 0 ? void 0 : updatedStudent.studentId,
                fullName: updatedStudent === null || updatedStudent === void 0 ? void 0 : updatedStudent.fullName,
                passportPhoto: updatedStudent === null || updatedStudent === void 0 ? void 0 : updatedStudent.passportPhoto,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.updateStudentPassportPhoto = updateStudentPassportPhoto;
// @desc    Get audit logs with advanced filtering and pagination
// @route   GET /api/admin/logs
// @access  Private/Admin
const getAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, userId, actionType, startDate, endDate, page = 1, limit = 10, } = req.query;
        // Validate and sanitize pagination parameters
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);
        const validatedPage = isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
        const validatedLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : Math.min(parsedLimit, 100);
        let query = {};
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
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return res.status(400).json({ message: "Invalid startDate format" });
                }
                query.timestamp.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({ message: "Invalid endDate format" });
                }
                // Set to end of day (23:59:59.999)
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }
        const skip = (validatedPage - 1) * validatedLimit;
        const logs = yield AuditLog_1.AuditLog.find(query)
            .populate("userId", "name email")
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(validatedLimit);
        const total = yield AuditLog_1.AuditLog.countDocuments(query);
        res.json({
            logs,
            pagination: {
                page: validatedPage,
                limit: validatedLimit,
                total,
                pages: Math.ceil(total / validatedLimit),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getAuditLogs = getAuditLogs;
