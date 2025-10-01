"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSubjects = exports.getClassroomSubjects = exports.removeSubject = exports.assignSubjects = void 0;
const Classroom_1 = require("../../models/Classroom");
const Subject_1 = require("../../models/Subject");
const AuditLog_1 = require("../../models/AuditLog");
// @desc    Assign subjects to classroom
// @route   POST /api/classrooms/:id/subjects
// @access  Private/Admin
const assignSubjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { subjectIds } = req.body;
        const classroomId = req.params.id;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Verify all subjects exist and are active
        const subjects = yield Subject_1.Subject.find({
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
        const newSubjectIds = subjectIds.filter((id) => !currentSubjectIds.includes(id));
        if (newSubjectIds.length === 0) {
            return res.status(400).json({
                message: "All selected subjects are already assigned to this classroom",
            });
        }
        // Add new subjects to classroom
        classroom.subjects = [...classroom.subjects, ...newSubjectIds];
        yield classroom.save();
        // Get subject names for audit log
        const newSubjects = yield Subject_1.Subject.find({ _id: { $in: newSubjectIds } });
        const subjectNames = newSubjects.map((s) => s.name).join(", ");
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "CLASSROOM_SUBJECTS_ASSIGN",
            description: `Assigned ${newSubjectIds.length} subjects to classroom ${classroom.name}: ${subjectNames}`,
            targetId: classroom._id,
        });
        // Return updated classroom with populated subjects
        const updatedClassroom = yield Classroom_1.Classroom.findById(classroomId).populate("subjects", "name category level");
        res.json({
            message: `${newSubjectIds.length} subjects assigned successfully`,
            classroom: updatedClassroom,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.assignSubjects = assignSubjects;
// @desc    Remove subject from classroom
// @route   DELETE /api/classrooms/:id/subjects/:subjectId
// @access  Private/Admin
const removeSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const classroomId = req.params.id;
        const subjectId = req.params.subjectId;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check if subject exists
        const subject = yield Subject_1.Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        // Check if subject is assigned to this classroom
        if (!classroom.subjects.includes(subjectId)) {
            return res.status(400).json({
                message: "Subject is not assigned to this classroom",
            });
        }
        // Remove subject from classroom
        classroom.subjects = classroom.subjects.filter((id) => id.toString() !== subjectId);
        yield classroom.save();
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "CLASSROOM_SUBJECT_REMOVE",
            description: `Removed subject ${subject.name} from classroom ${classroom.name}`,
            targetId: classroom._id,
        });
        res.json({
            message: "Subject removed from classroom successfully",
            classroom,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.removeSubject = removeSubject;
// @desc    Get subjects for a specific classroom
// @route   GET /api/classrooms/:id/subjects
// @access  Private/Admin/Teacher
const getClassroomSubjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const classroomId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Check permissions: admin/superadmin can access any classroom, teachers only their own
        if (userRole === "teacher" &&
            classroom.teacherId.toString() !== (userId === null || userId === void 0 ? void 0 : userId.toString())) {
            return res.status(403).json({
                message: "You don't have permission to access this classroom",
            });
        }
        // Get subjects for this classroom
        const subjects = yield Subject_1.Subject.find({
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getClassroomSubjects = getClassroomSubjects;
// @desc    Get available subjects for classroom assignment
// @route   GET /api/classrooms/:id/available-subjects
// @access  Private/Admin
const getAvailableSubjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classroomId = req.params.id;
        // Check if classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Get all subjects (both active and inactive)
        const allSubjects = yield Subject_1.Subject.find({}).sort({
            name: 1,
        });
        // Get already assigned subject IDs
        const assignedSubjectIds = classroom.subjects.map((id) => id.toString());
        // Filter out already assigned subjects
        const availableSubjects = allSubjects.filter((subject) => !assignedSubjectIds.includes(subject._id.toString()));
        res.json({
            classroom: {
                _id: classroom._id,
                name: classroom.name,
            },
            availableSubjects,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getAvailableSubjects = getAvailableSubjects;
