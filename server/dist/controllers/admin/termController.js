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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTerms = exports.deactivateTerm = exports.updateTerm = exports.activateTerm = exports.createTerm = void 0;
const Term_1 = require("../../models/Term");
const AuditLog_1 = require("../../models/AuditLog");
// @desc    Create a new term
// @route   POST /api/admin/terms
// @access  Private/Admin
const createTerm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, sessionId, startDate, endDate, holidays } = req.body;
        const term = yield Term_1.Term.create({
            name,
            sessionId,
            startDate,
            endDate,
            holidays: holidays || [],
            isActive: false,
        });
        // Populate session data for audit log
        yield term.populate("sessionId");
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "TERM_CREATE",
            description: `Created new term: ${name} ${term.sessionId.name}`,
            targetId: term._id,
        });
        res.status(201).json(term);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.createTerm = createTerm;
// @desc    Set term as active
// @route   PATCH /api/admin/terms/:id/activate
// @access  Private/Admin
const activateTerm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // First, deactivate any currently active term
        yield Term_1.Term.updateMany({}, { isActive: false });
        // Then activate the specified term
        const term = yield Term_1.Term.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!term) {
            return res.status(404).json({ message: "Term not found" });
        }
        // Activate all fee structures for this term
        const { FeeStructure } = yield Promise.resolve().then(() => __importStar(require("../../models/FeeStructure")));
        const { syncStudentFeesForClassroomBatched } = yield Promise.resolve().then(() => __importStar(require("../../services/feeSync.service")));
        const { FeeSyncLog } = yield Promise.resolve().then(() => __importStar(require("../../models/FeeSyncLog")));
        const feeStructuresUpdated = yield FeeStructure.updateMany({ termId: term._id }, { isActive: true, updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        // Return a response immediately while syncing in background
        let syncResult = null;
        if (feeStructuresUpdated.modifiedCount > 0) {
            try {
                // Sync fees for classrooms that have fee structures for this term
                const affectedFeeStructures = yield FeeStructure.find({
                    termId: term._id,
                }).select("classroomId");
                const processedClassrooms = new Set();
                for (const fs of affectedFeeStructures) {
                    const classroomId = fs.classroomId.toString();
                    if (!processedClassrooms.has(classroomId)) {
                        processedClassrooms.add(classroomId);
                        yield syncStudentFeesForClassroomBatched(classroomId, (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString());
                    }
                }
            }
            catch (syncError) {
                console.error("Error syncing fees for activated term:", syncError);
                // Don't fail the activation if sync fails
            }
        }
        // Populate session data for audit log
        yield term.populate("sessionId");
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
            actionType: "TERM_ACTIVATE",
            description: `Activated term: ${term.name} ${term.sessionId.name}${feeStructuresUpdated.modifiedCount > 0
                ? ` and synced fees for ${feeStructuresUpdated.modifiedCount} fee structures`
                : ""}`,
            targetId: term._id,
        });
        res.json({
            term,
            message: feeStructuresUpdated.modifiedCount > 0
                ? `Term activated successfully. Fees for ${feeStructuresUpdated.modifiedCount} fee structures have been synced to students.`
                : "Term activated successfully. No new fee structures to sync.",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.activateTerm = activateTerm;
// @desc    Update term
// @route   PUT /api/admin/terms/:id
// @access  Private/Admin
const updateTerm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, sessionId, startDate, endDate, holidays } = req.body;
        const term = yield Term_1.Term.findById(req.params.id);
        if (!term) {
            return res.status(404).json({ message: "Term not found" });
        }
        // Check if new term name/sessionId combination conflicts with existing term
        if ((name && name !== term.name) ||
            (sessionId && sessionId !== term.sessionId.toString())) {
            const existingTerm = yield Term_1.Term.findOne({
                name: name || term.name,
                sessionId: sessionId || term.sessionId,
                _id: { $ne: req.params.id },
            });
            if (existingTerm) {
                return res.status(400).json({
                    message: `Term "${name || term.name}" already exists for this session`,
                });
            }
        }
        const updatedTerm = yield Term_1.Term.findByIdAndUpdate(req.params.id, { name, sessionId, startDate, endDate, holidays }, { new: true, runValidators: true }).populate("sessionId");
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "TERM_UPDATE",
            description: `Updated term: ${term.name} ${term.sessionId.name}`,
            targetId: term._id,
        });
        res.json(updatedTerm);
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Term name and year combination already exists (duplicate)",
            });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.updateTerm = updateTerm;
// @desc    Deactivate term
// @route   PATCH /api/admin/terms/:id/deactivate
// @access  Private/Admin
const deactivateTerm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const term = yield Term_1.Term.findById(req.params.id);
        if (!term) {
            return res.status(404).json({ message: "Term not found" });
        }
        // Deactivate the term
        term.isActive = false;
        yield term.save();
        // Populate session data for audit log
        yield term.populate("sessionId");
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            actionType: "TERM_DEACTIVATE",
            description: `Deactivated term: ${term.name} ${term.sessionId.name}`,
            targetId: term._id,
        });
        res.json(term);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.deactivateTerm = deactivateTerm;
// @desc    Get all terms
// @route   GET /api/admin/terms
// @access  Private/Admin
const getTerms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const terms = yield Term_1.Term.find()
            .populate("sessionId")
            .sort({ "sessionId.startYear": -1, name: 1 });
        res.json(terms);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getTerms = getTerms;
