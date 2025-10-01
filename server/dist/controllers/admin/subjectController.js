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
exports.activateSubject = exports.deactivateSubject = exports.updateSubject = exports.getSubjectById = exports.getSubjects = exports.createSubject = void 0;
const Subject_1 = require("../../models/Subject");
const AuditLog_1 = require("../../models/AuditLog");
// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, category, level } = req.body;
        // Check if subject name already exists
        const existingSubject = yield Subject_1.Subject.findOne({ name });
        if (existingSubject) {
            return res.status(400).json({
                message: `Subject "${name}" already exists`,
            });
        }
        const subject = yield Subject_1.Subject.create({
            name,
            category,
            level,
        });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "SUBJECT_CREATE",
            description: `Created new subject ${name} (${category} - ${level})`,
            targetId: subject._id,
        });
        res.status(201).json(subject);
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Subject name already exists (duplicate)",
            });
        }
        res.status(500).json({ message: "Server error", error: error.message });
        console.log(error.message);
    }
});
exports.createSubject = createSubject;
// @desc    Get all subjects with optional filters
// @route   GET /api/subjects
// @access  Private/Admin
const getSubjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, level, isActive, search } = req.query;
        let filter = {};
        if (category)
            filter.category = category;
        if (level)
            filter.level = level;
        if (isActive !== undefined)
            filter.isActive = isActive === "true";
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        const subjects = yield Subject_1.Subject.find(filter)
            .sort({ name: 1 })
            .select("name category level isActive createdAt updatedAt");
        res.json(subjects);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getSubjects = getSubjects;
// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private/Admin
const getSubjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subject = yield Subject_1.Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json(subject);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getSubjectById = getSubjectById;
// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, category, level, isActive } = req.body;
        const subject = yield Subject_1.Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        // Check if new name conflicts with existing subject
        if (name && name !== subject.name) {
            const existingSubject = yield Subject_1.Subject.findOne({ name });
            if (existingSubject) {
                return res.status(400).json({
                    message: `Subject "${name}" already exists`,
                });
            }
        }
        const updatedSubject = yield Subject_1.Subject.findByIdAndUpdate(req.params.id, { name, category, level, isActive }, { new: true, runValidators: true });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "SUBJECT_UPDATE",
            description: `Updated subject ${subject.name}`,
            targetId: subject._id,
        });
        res.json(updatedSubject);
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Subject name already exists (duplicate)",
            });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.updateSubject = updateSubject;
// @desc    Deactivate subject (soft delete)
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deactivateSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const subject = yield Subject_1.Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        // Deactivate the subject
        subject.isActive = false;
        yield subject.save();
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "SUBJECT_DEACTIVATE",
            description: `Deactivated subject ${subject.name}`,
            targetId: subject._id,
        });
        res.json({ message: "Subject deactivated successfully", subject });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.deactivateSubject = deactivateSubject;
// @desc    Activate subject
// @route   PATCH /api/subjects/:id/activate
// @access  Private/Admin
const activateSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const subject = yield Subject_1.Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        // Activate the subject
        subject.isActive = true;
        yield subject.save();
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "SUBJECT_ACTIVATE",
            description: `Activated subject ${subject.name}`,
            targetId: subject._id,
        });
        res.json({ message: "Subject activated successfully", subject });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.activateSubject = activateSubject;
