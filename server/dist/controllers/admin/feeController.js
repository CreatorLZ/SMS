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
exports.getFeeHealthCheck = exports.getOperationStatus = exports.fullFeeReconciliation = exports.backfillMissingStudentFees = exports.deduplicateStudentFees = exports.syncTermsFees = exports.syncIndividualStudentFees = exports.syncAllStudentFees = exports.getArrears = exports.getStudentFees = exports.markFeePaid = exports.deleteFeeStructure = exports.confirmDeleteFeeStructure = exports.previewDeleteFeeStructure = exports.updateFeeStructure = exports.getFeeStructures = exports.createFeeStructure = void 0;
const FeeStructure_1 = require("../../models/FeeStructure");
const Student_1 = require("../../models/Student");
const Classroom_1 = require("../../models/Classroom");
const Term_1 = require("../../models/Term");
const AuditLog_1 = require("../../models/AuditLog");
const FeeSyncLog_1 = require("../../models/FeeSyncLog");
const feeSync_service_1 = require("../../services/feeSync.service");
// Generate PIN code for fee access
const generatePinCode = () => {
    return Math.random().toString().slice(2, 8).padStart(6, "0");
};
// @desc    Create fee structure
// @route   POST /api/admin/fees/structures
// @access  Private/Admin
const createFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { classroomId, termId, amount } = req.body;
        // Validate classroom exists
        const classroom = yield Classroom_1.Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        // Validate term exists
        const term = yield Term_1.Term.findById(termId);
        if (!term) {
            return res.status(404).json({ message: "Term not found" });
        }
        const feeStructure = yield FeeStructure_1.FeeStructure.create({
            classroomId,
            termId,
            amount,
            isActive: term.isActive, // Only activate if term is active
            createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            updatedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
        });
        // Perform synchronous fee sync only if term is active
        let syncResult = null;
        if (term.isActive) {
            // Get all active students in this classroom for sync
            const students = yield Student_1.Student.find({
                classroomId,
                status: "active",
            }).select("_id");
            const studentIds = students.map((s) => s._id.toString());
            // Perform synchronous fee sync
            syncResult = yield (0, feeSync_service_1.syncStudentFeesForClassroomBatched)(classroomId.toString(), (_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString());
        }
        // Create fee sync log only if synced
        if (syncResult) {
            yield FeeSyncLog_1.FeeSyncLog.create({
                operationId: syncResult.operationId,
                classroomId,
                termId,
                enqueuedBy: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
                status: "completed",
                summary: {
                    syncedStudents: syncResult.created + syncResult.updated,
                    totalFees: syncResult.attempted,
                    errors: ((_f = syncResult.errors) === null || _f === void 0 ? void 0 : _f.length) || 0,
                },
                syncErrors: syncResult.errors,
                startedAt: new Date(),
                finishedAt: new Date(),
            });
        }
        // Create audit log
        let description = `Created fee structure for ${classroom.name} - ${term.name} ${term.year}: ₦${amount}`;
        if (syncResult) {
            description += ` and synced ${syncResult.created + syncResult.updated} student fees`;
        }
        else {
            description += ` (term is inactive - no sync performed)`;
        }
        yield AuditLog_1.AuditLog.create({
            userId: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id,
            actionType: "FEE_STRUCTURE_UPDATE",
            description,
            targetId: feeStructure._id,
        });
        let message = term.isActive
            ? "Fee structure created and fees synced successfully"
            : "Fee structure created successfully (term is inactive - fees will sync when term is activated)";
        res.status(201).json({
            feeStructure,
            message,
            syncResult,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Fee structure already exists for this classroom and term",
            });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.createFeeStructure = createFeeStructure;
// @desc    Get all fee structures
// @route   GET /api/admin/fees/structures
// @access  Private/Admin
const getFeeStructures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId, termId } = req.query;
        let filter = {};
        if (classroomId)
            filter.classroomId = classroomId;
        if (termId)
            filter.termId = termId;
        const feeStructures = yield FeeStructure_1.FeeStructure.find(Object.assign(Object.assign({}, filter), { isActive: true }))
            .populate("classroomId", "name")
            .populate("termId", "name year")
            .populate("createdBy", "name")
            .populate("updatedBy", "name")
            .sort({ createdAt: -1 });
        res.json(feeStructures);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getFeeStructures = getFeeStructures;
// @desc    Update fee structure
// @route   PUT /api/admin/fees/structures/:id
// @access  Private/Admin
const updateFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { amount } = req.body;
        const feeStructure = yield FeeStructure_1.FeeStructure.findById(req.params.id)
            .populate("classroomId", "name")
            .populate("termId", "name year");
        if (!feeStructure) {
            return res.status(404).json({ message: "Fee structure not found" });
        }
        const oldAmount = feeStructure.amount;
        feeStructure.amount = amount;
        if ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) {
            feeStructure.updatedBy = req.user._id;
        }
        yield feeStructure.save();
        // Get all active students in this classroom for sync
        const students = yield Student_1.Student.find({
            classroomId: feeStructure.classroomId._id,
            status: "active",
        }).select("_id");
        const studentIds = students.map((s) => s._id.toString());
        // Perform synchronous fee sync
        const syncResult = yield (0, feeSync_service_1.syncStudentFeesForClassroomBatched)(feeStructure.classroomId._id.toString(), (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString());
        // Create fee sync log
        yield FeeSyncLog_1.FeeSyncLog.create({
            operationId: `sync-${Date.now()}-${feeStructure._id}`,
            classroomId: feeStructure.classroomId._id,
            termId: feeStructure.termId._id,
            enqueuedBy: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
            status: "completed",
            summary: syncResult,
            syncErrors: syncResult.errors,
            startedAt: new Date(),
            finishedAt: new Date(),
        });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
            actionType: "FEE_STRUCTURE_UPDATE",
            description: `Updated fee structure amount from ₦${oldAmount} to ₦${amount} and synced ${syncResult.created + syncResult.updated} student fees`,
            targetId: feeStructure._id,
        });
        res.status(200).json({
            feeStructure,
            message: "Fee structure updated and fees synced successfully",
            syncResult,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.updateFeeStructure = updateFeeStructure;
// @desc    Preview delete fee structure
// @route   GET /api/admin/fees/structures/:id/preview-delete
// @access  Private/Admin
const previewDeleteFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const feeStructure = yield FeeStructure_1.FeeStructure.findById(req.params.id)
            .populate("classroomId", "name")
            .populate("termId", "name year");
        if (!feeStructure) {
            return res.status(404).json({ message: "Fee structure not found" });
        }
        if (!feeStructure.isActive) {
            return res
                .status(400)
                .json({ message: "Fee structure is already deleted" });
        }
        const termName = (_a = feeStructure.termId) === null || _a === void 0 ? void 0 : _a.name;
        const termYear = (_b = feeStructure.termId) === null || _b === void 0 ? void 0 : _b.year;
        const classroomId = (_c = feeStructure.classroomId) === null || _c === void 0 ? void 0 : _c._id;
        // Count affected students
        const studentsAffected = yield Student_1.Student.countDocuments({
            classroomId: classroomId,
            "termFees.term": termName,
            "termFees.year": termYear,
        });
        // Count affected termFees entries
        const termFeesCount = ((_d = (yield Student_1.Student.aggregate([
            { $match: { classroomId: classroomId } },
            {
                $project: {
                    count: {
                        $size: {
                            $filter: {
                                input: "$termFees",
                                as: "tf",
                                cond: {
                                    $and: [
                                        { $eq: ["$$tf.term", termName] },
                                        { $eq: ["$$tf.year", termYear] },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            { $group: { _id: null, total: { $sum: "$count" } } },
        ]))[0]) === null || _d === void 0 ? void 0 : _d.total) || 0;
        res.json({
            feeStructure: {
                _id: feeStructure._id,
                classroom: (_e = feeStructure.classroomId) === null || _e === void 0 ? void 0 : _e.name,
                term: `${termName} ${termYear}`,
                amount: feeStructure.amount,
            },
            impact: {
                studentsAffected,
                termFeesCount,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.previewDeleteFeeStructure = previewDeleteFeeStructure;
// @desc    Confirm delete fee structure
// @route   POST /api/admin/fees/structures/:id/confirm-delete
// @access  Private/Admin
const confirmDeleteFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { confirm } = req.body;
        if (!confirm) {
            return res.status(400).json({ message: "Confirmation required" });
        }
        const feeStructure = yield FeeStructure_1.FeeStructure.findById(req.params.id)
            .populate("classroomId", "name")
            .populate("termId", "name year");
        if (!feeStructure) {
            return res.status(404).json({ message: "Fee structure not found" });
        }
        if (!feeStructure.isActive) {
            return res
                .status(400)
                .json({ message: "Fee structure is already deleted" });
        }
        const termName = (_a = feeStructure.termId) === null || _a === void 0 ? void 0 : _a.name;
        const termYear = (_b = feeStructure.termId) === null || _b === void 0 ? void 0 : _b.year;
        const classroomId = (_c = feeStructure.classroomId) === null || _c === void 0 ? void 0 : _c._id;
        // Generate CSV export of affected data
        const affectedStudents = yield Student_1.Student.find({
            classroomId: classroomId,
            "termFees.term": termName,
            "termFees.year": termYear,
        }).select("fullName studentId termFees");
        const csvData = affectedStudents.map((student) => {
            const termFee = student.termFees.find((tf) => tf.term === termName && tf.year === termYear);
            return {
                studentId: student.studentId,
                fullName: student.fullName,
                term: termFee === null || termFee === void 0 ? void 0 : termFee.term,
                year: termFee === null || termFee === void 0 ? void 0 : termFee.year,
                amount: termFee === null || termFee === void 0 ? void 0 : termFee.amount,
                paid: termFee === null || termFee === void 0 ? void 0 : termFee.paid,
                paymentDate: termFee === null || termFee === void 0 ? void 0 : termFee.paymentDate,
                pinCode: termFee === null || termFee === void 0 ? void 0 : termFee.pinCode,
            };
        });
        // Soft delete the fee structure
        feeStructure.isActive = false;
        feeStructure.deletedAt = new Date();
        feeStructure.deletedBy = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        yield feeStructure.save();
        // Remove related termFees from students
        const result = yield Student_1.Student.updateMany({
            classroomId: classroomId,
            "termFees.term": termName,
            "termFees.year": termYear,
        }, {
            $pull: {
                termFees: { term: termName, year: termYear },
            },
        });
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
            actionType: "FEE_STRUCTURE_DELETE",
            description: `Soft deleted fee structure and removed ${result.modifiedCount} term fee records. CSV export generated.`,
            targetId: req.params.id,
        });
        res.json({
            message: "Fee structure deleted successfully",
            stats: {
                studentsAffected: result.modifiedCount,
                csvData,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.confirmDeleteFeeStructure = confirmDeleteFeeStructure;
// @desc    Delete fee structure (legacy - now uses soft delete)
// @route   DELETE /api/admin/fees/structures/:id
// @access  Private/Admin
const deleteFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const feeStructure = yield FeeStructure_1.FeeStructure.findById(req.params.id)
            .populate("classroomId", "name")
            .populate("termId", "name year");
        if (!feeStructure) {
            return res.status(404).json({ message: "Fee structure not found" });
        }
        if (!feeStructure.isActive) {
            return res
                .status(400)
                .json({ message: "Fee structure is already deleted" });
        }
        // Soft delete instead of hard delete
        feeStructure.isActive = false;
        feeStructure.deletedAt = new Date();
        feeStructure.deletedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        yield feeStructure.save();
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            actionType: "FEE_STRUCTURE_UPDATE",
            description: `Soft deleted fee structure for ${(_c = feeStructure.classroomId) === null || _c === void 0 ? void 0 : _c.name} - ${(_d = feeStructure.termId) === null || _d === void 0 ? void 0 : _d.name} ${(_e = feeStructure.termId) === null || _e === void 0 ? void 0 : _e.year}`,
            targetId: req.params.id,
        });
        res.json({
            message: "Fee structure soft deleted successfully",
            feeStructure: {
                _id: feeStructure._id,
                isActive: false,
                deletedAt: feeStructure.deletedAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.deleteFeeStructure = deleteFeeStructure;
// @desc    Mark student fee as paid
// @route   POST /api/admin/fees/students/:studentId/pay
// @access  Private/Admin
const markFeePaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { term, year, paymentMethod, receiptNumber } = req.body;
        const student = yield Student_1.Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Find the term fee record
        const termFeeIndex = student.termFees.findIndex((fee) => fee.term === term && fee.year === year);
        if (termFeeIndex === -1) {
            return res.status(404).json({ message: "Term fee record not found" });
        }
        // Generate receipt number if not provided
        const finalReceiptNumber = receiptNumber || `RCP-${Date.now()}-${student.studentId}`;
        // Update the fee record
        student.termFees[termFeeIndex].paid = true;
        student.termFees[termFeeIndex].viewable = true;
        student.termFees[termFeeIndex].paymentDate = new Date();
        student.termFees[termFeeIndex].paymentMethod = paymentMethod || "cash";
        student.termFees[termFeeIndex].receiptNumber = finalReceiptNumber;
        if ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) {
            student.termFees[termFeeIndex].updatedBy = req.user._id;
        }
        yield student.save();
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            actionType: "FEE_PAYMENT",
            description: `Marked fee as paid for ${student.fullName} (${term} ${year}) - Receipt: ${finalReceiptNumber}`,
            targetId: student._id,
        });
        res.json({
            message: "Fee marked as paid successfully",
            termFee: student.termFees[termFeeIndex],
            receiptNumber: finalReceiptNumber,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.markFeePaid = markFeePaid;
// @desc    Get student fee history
// @route   GET /api/admin/fees/students/:studentId/fees
// @access  Private/Admin
const getStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const student = yield Student_1.Student.findById(req.params.studentId)
            .populate("classroomId", "name")
            .select("fullName studentId termFees classroomId");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Get all existing fee structures to filter fees
        const feeStructures = yield FeeStructure_1.FeeStructure.find({})
            .populate("classroomId", "_id")
            .populate("termId", "name year");
        // Create a map of existing fee structures for quick lookup
        const feeStructureMap = new Map();
        feeStructures.forEach((fs) => {
            const key = `${fs.classroomId._id}-${fs.termId.name}-${fs.termId.year}`;
            feeStructureMap.set(key, fs);
        });
        // Filter out fees that don't have corresponding fee structures
        const filteredTermFees = student.termFees.filter((fee) => {
            var _a;
            const feeKey = `${(_a = student.classroomId) === null || _a === void 0 ? void 0 : _a._id}-${fee.term}-${fee.year}`;
            return feeStructureMap.has(feeKey);
        });
        // Check for inconsistencies - Detect missing or incorrect fees
        let inconsistenciesFound = false;
        const repairedFees = [...filteredTermFees];
        // Check if student has classroom and get admission date for validation
        if (student.classroomId) {
            const admissionDate = new Date(student.admissionDate || "2020-01-01");
            // Check for missing fees that should exist
            for (const feeStructure of feeStructures) {
                const fsClassroomId = feeStructure.classroomId._id.toString();
                if (fsClassroomId !== student.classroomId._id.toString())
                    continue;
                const term = feeStructure.termId;
                const termEnd = new Date(term.endDate);
                // Skip if student wasn't enrolled during this term
                if (admissionDate > termEnd)
                    continue;
                const feeKey = `${term.name}-${term.year}`;
                const hasFee = filteredTermFees.some((fee) => fee.term === term.name && fee.year === term.year);
                // Auto-repair: Create missing fee record
                if (!hasFee) {
                    console.log(`Auto-repairing missing fee for student ${student.fullName}: ${term.name} ${term.year}`);
                    inconsistenciesFound = true;
                    repairedFees.push({
                        term: term.name,
                        year: term.year,
                        paid: false,
                        pinCode: generatePinCode(),
                        viewable: false,
                        amount: feeStructure.amount,
                        paymentDate: undefined,
                        updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                    });
                }
            }
            // Check for amount mismatches and repair
            for (const fee of filteredTermFees) {
                const feeKey = `${student.classroomId._id}-${fee.term}-${fee.year}`;
                const feeStructure = feeStructureMap.get(feeKey);
                if (feeStructure && fee.amount !== feeStructure.amount) {
                    console.log(`Auto-repairing fee amount for student ${student.fullName}: ${fee.term} ${fee.year} - ${fee.amount} -> ${feeStructure.amount}`);
                    inconsistenciesFound = true;
                    // Find and update the fee in repairedFees
                    const index = repairedFees.findIndex((f) => f.term === fee.term && f.year === fee.year);
                    if (index !== -1) {
                        repairedFees[index] = Object.assign(Object.assign({}, repairedFees[index]), { amount: feeStructure.amount, updatedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id });
                    }
                }
            }
            // If inconsistencies found, save the repaired data
            if (inconsistenciesFound) {
                student.termFees = repairedFees;
                yield student.save();
                // Create audit log for auto-repair
                yield AuditLog_1.AuditLog.create({
                    userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
                    actionType: "FEE_AUTO_REPAIR",
                    description: `Auto-repaired fee inconsistencies for student ${student.fullName}`,
                    targetId: student._id,
                });
                console.log(`Auto-repaired ${repairedFees.length - filteredTermFees.length} fee entries for student ${student.fullName}`);
            }
        }
        // Return student with repaired fees
        const resultStudent = Object.assign(Object.assign({}, student.toObject()), { termFees: repairedFees, autoRepaired: inconsistenciesFound });
        res.json(resultStudent);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getStudentFees = getStudentFees;
// @desc    Get students with unpaid fees (arrears)
// @route   GET /api/admin/fees/arrears
// @access  Private/Admin
const getArrears = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classroomId, term, year } = req.query;
        // Get all active students first
        let studentFilter = { status: "active" };
        if (classroomId) {
            studentFilter.classroomId = classroomId;
        }
        const students = yield Student_1.Student.find(studentFilter)
            .populate("classroomId", "name")
            .select("fullName studentId currentClass termFees classroomId")
            .sort({ currentClass: 1, fullName: 1 });
        // Get all existing fee structures to filter fees
        const feeStructures = yield FeeStructure_1.FeeStructure.find({})
            .populate("classroomId", "_id")
            .populate("termId", "name year");
        // Create a map of existing fee structures for quick lookup
        const feeStructureMap = new Map();
        feeStructures.forEach((fs) => {
            const key = `${fs.classroomId._id}-${fs.termId.name}-${fs.termId.year}`;
            feeStructureMap.set(key, fs);
        });
        // Filter students with unpaid fees that have corresponding fee structures
        const arrearsData = students
            .map((student) => {
            var _a;
            let unpaidFees = student.termFees.filter((fee) => {
                var _a;
                // Only include fees that have a corresponding fee structure
                const feeKey = `${(_a = student.classroomId) === null || _a === void 0 ? void 0 : _a._id}-${fee.term}-${fee.year}`;
                return !fee.paid && feeStructureMap.has(feeKey);
            });
            // Filter by specific term/year if provided
            if (term && year) {
                unpaidFees = unpaidFees.filter((fee) => fee.term === term && fee.year === parseInt(year));
            }
            // Only include students with unpaid fees
            if (unpaidFees.length > 0) {
                return {
                    _id: student._id,
                    fullName: student.fullName,
                    studentId: student.studentId,
                    currentClass: student.currentClass,
                    classroom: ((_a = student.classroomId) === null || _a === void 0 ? void 0 : _a.name) || "N/A",
                    unpaidFees,
                    totalUnpaid: unpaidFees.reduce((sum, fee) => sum + (fee.amount || 0), 0),
                };
            }
            return null;
        })
            .filter((student) => student !== null); // Remove null entries
        res.json(arrearsData);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getArrears = getArrears;
// @desc    Comprehensive fee sync for all students
// @route   POST /api/admin/fees/sync-all
// @access  Private/Admin
const syncAllStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        console.log("Starting comprehensive fee sync for all students...");
        const startTime = Date.now();
        // Get all active students
        const allStudents = yield Student_1.Student.find({ status: "active" })
            .select("_id classroomId")
            .populate("classroomId", "_id");
        if (allStudents.length === 0) {
            return res.json({
                message: "No active students found",
                stats: { totalStudents: 0, syncedStudents: 0, totalFees: 0 },
            });
        }
        // Group students by classroom
        const classroomStudentMap = new Map();
        const studentsWithoutClassroom = [];
        allStudents.forEach((student) => {
            var _a, _b;
            const classroomId = (_b = (_a = student.classroomId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
            if (classroomId) {
                if (!classroomStudentMap.has(classroomId)) {
                    classroomStudentMap.set(classroomId, []);
                }
                classroomStudentMap
                    .get(classroomId)
                    .push(student._id.toString());
            }
            else {
                studentsWithoutClassroom.push(student._id.toString());
            }
        });
        let totalSyncedStudents = 0;
        let totalFeesProcessed = 0;
        let totalErrors = 0;
        const classroomResults = [];
        // Process each classroom
        for (const [classroomId, studentIds] of classroomStudentMap) {
            try {
                console.log(`Syncing ${studentIds.length} students for classroom ${classroomId}`);
                const result = yield (0, feeSync_service_1.syncStudentFeesForClassroomBatched)(classroomId, (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString());
                classroomResults.push({
                    classroomId,
                    students: studentIds.length,
                    syncedStudents: result.created + result.updated,
                    feesProcessed: result.attempted,
                    errors: ((_c = result.errors) === null || _c === void 0 ? void 0 : _c.length) || 0,
                });
                totalSyncedStudents += result.created + result.updated;
                totalFeesProcessed += result.attempted;
                if (result.errors)
                    totalErrors += result.errors.length;
            }
            catch (classroomError) {
                console.error(`Error syncing classroom ${classroomId}:`, classroomError);
                classroomResults.push({
                    classroomId,
                    students: studentIds.length,
                    syncedStudents: 0,
                    feesProcessed: 0,
                    errors: 1,
                    errorMessage: classroomError.message,
                });
                totalErrors++;
            }
        }
        const duration = Date.now() - startTime;
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
            actionType: "FEE_STRUCTURE_UPDATE",
            description: `Comprehensive fee sync completed: ${totalSyncedStudents}/${allStudents.length} students synced, ${totalFeesProcessed} fees processed in ${duration}ms`,
            targetId: null,
        });
        res.json({
            message: "Comprehensive fee synchronization completed",
            stats: {
                totalStudents: allStudents.length,
                studentsWithoutClassroom: studentsWithoutClassroom.length,
                syncedStudents: totalSyncedStudents,
                totalFeesProcessed,
                totalErrors,
                duration: `${duration}ms`,
            },
            classroomResults,
            studentsWithoutClassroom: studentsWithoutClassroom.length > 0
                ? studentsWithoutClassroom
                : undefined,
        });
    }
    catch (error) {
        console.error("Error during comprehensive fee sync:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.syncAllStudentFees = syncAllStudentFees;
// @desc    Sync fees for a specific student
// @route   POST /api/admin/fees/students/:studentId/sync
// @access  Private/Admin
const syncIndividualStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { studentId } = req.params;
        const student = yield Student_1.Student.findById(studentId).populate("classroomId", "_id");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        if (!student.classroomId) {
            return res.status(400).json({
                message: "Student is not assigned to any classroom",
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    studentId: student.studentId,
                },
            });
        }
        const result = yield (0, feeSync_service_1.syncStudentFeesForClassroomBatched)(student.classroomId._id.toString(), (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString());
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            actionType: "FEE_STRUCTURE_UPDATE",
            description: `Manually synced fees for student ${student.fullName} (${student.studentId})`,
            targetId: student._id,
        });
        res.json({
            message: "Student fees synced successfully",
            student: {
                _id: student._id,
                fullName: student.fullName,
                studentId: student.studentId,
            },
            syncResult: result,
        });
    }
    catch (error) {
        console.error("Error syncing student fees:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.syncIndividualStudentFees = syncIndividualStudentFees;
// @desc    Sync all fee structures for a specific term
// @route   POST /api/admin/fees/terms/:termId/sync
// @access  Private/Admin
const syncTermsFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { termId } = req.params;
        // Validate term exists
        const term = yield Term_1.Term.findById(termId);
        if (!term) {
            return res.status(404).json({ message: "Term not found" });
        }
        console.log(`Starting fee sync for term: ${term.name} ${term.year}`);
        const startTime = Date.now();
        // Get all active fee structures for this term
        const feeStructures = yield FeeStructure_1.FeeStructure.find({
            termId,
            isActive: true,
        })
            .populate("classroomId", "_id")
            .populate("termId", "name year");
        if (feeStructures.length === 0) {
            return res.json({
                message: "No active fee structures found for this term",
                stats: { totalFeeStructures: 0, syncedClassrooms: 0, totalStudents: 0 },
            });
        }
        console.log(`Found ${feeStructures.length} fee structures for term ${term.name} ${term.year}`);
        let totalSyncedStudents = 0;
        let totalFeesProcessed = 0;
        let totalErrors = 0;
        const processedClassrooms = new Set();
        const classroomResults = [];
        // Process each fee structure - sync the associated classroom
        for (const feeStructure of feeStructures) {
            const classroomId = feeStructure.classroomId._id.toString();
            // Skip if we already processed this classroom
            if (processedClassrooms.has(classroomId)) {
                continue;
            }
            processedClassrooms.add(classroomId);
            try {
                console.log(`Syncing classroom ${classroomId} for term ${term.name} ${term.year}`);
                const result = yield (0, feeSync_service_1.syncStudentFeesForClassroomBatched)(classroomId, (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString());
                classroomResults.push({
                    classroomId,
                    students: result.created + result.updated,
                    feesProcessed: result.attempted,
                    errors: ((_c = result.errors) === null || _c === void 0 ? void 0 : _c.length) || 0,
                });
                totalSyncedStudents += result.created + result.updated;
                totalFeesProcessed += result.attempted;
                if (result.errors)
                    totalErrors += result.errors.length;
            }
            catch (classroomError) {
                console.error(`Error syncing classroom ${classroomId}:`, classroomError);
                classroomResults.push({
                    classroomId,
                    students: 0,
                    feesProcessed: 0,
                    errors: 1,
                    errorMessage: classroomError.message,
                });
                totalErrors++;
            }
        }
        const duration = Date.now() - startTime;
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
            actionType: "FEE_STRUCTURE_UPDATE",
            description: `Term fee sync completed: ${term.name} ${term.year} - ${totalSyncedStudents} students synced, ${totalFeesProcessed} fees processed in ${duration}ms`,
            targetId: term._id,
        });
        res.json({
            message: `Term fee synchronization completed for ${term.name} ${term.year}`,
            term: {
                _id: term._id,
                name: term.name,
                year: term.year,
            },
            stats: {
                totalFeeStructures: feeStructures.length,
                syncedClassrooms: processedClassrooms.size,
                syncedStudents: totalSyncedStudents,
                totalFeesProcessed,
                totalErrors,
                duration: `${duration}ms`,
            },
            classroomResults,
        });
    }
    catch (error) {
        console.error("Error during term fee sync:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.syncTermsFees = syncTermsFees;
// @desc    Remove duplicate student fee records
// @route   POST /api/admin/fees/reconcile/deduplicate
// @access  Private/Admin
const deduplicateStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log("Starting fee deduplication process...");
        const result = yield (0, feeSync_service_1.removeDuplicateStudentFees)((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString());
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            actionType: "FEE_RECONCILIATION",
            description: `Fee deduplication completed: ${result.duplicatesFound} duplicates found, ${result.duplicatesRemoved} removed, ${result.errors.length} errors`,
            targetId: null,
        });
        res.json({
            message: "Fee deduplication completed",
            stats: result,
        });
    }
    catch (error) {
        console.error("Error during fee deduplication:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.deduplicateStudentFees = deduplicateStudentFees;
// @desc    Backfill missing fees for students
// @route   POST /api/admin/fees/reconcile/backfill
// @access  Private/Admin
const backfillMissingStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log("Starting fee backfill process...");
        const result = yield (0, feeSync_service_1.backfillMissingFees)((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString());
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            actionType: "FEE_RECONCILIATION",
            description: `Fee backfill completed: ${result.missingFeesFound} missing fees found, ${result.feesBackfilled} backfilled, ${result.errors.length} errors`,
            targetId: null,
        });
        res.json({
            message: "Fee backfill completed",
            stats: result,
        });
    }
    catch (error) {
        console.error("Error during fee backfill:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.backfillMissingStudentFees = backfillMissingStudentFees;
// @desc    Full reconciliation (deduplicate + backfill)
// @route   POST /api/admin/fees/reconcile/full
// @access  Private/Admin
const fullFeeReconciliation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log("Starting full fee reconciliation process...");
        const result = yield (0, feeSync_service_1.fullReconciliation)((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString());
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            actionType: "FEE_RECONCILIATION",
            description: `Full fee reconciliation completed: ${result.deduplication.duplicatesRemoved} duplicates removed, ${result.backfill.feesBackfilled} fees backfilled, ${result.totalErrors} total errors`,
            targetId: null,
        });
        res.json({
            message: "Full fee reconciliation completed",
            stats: result,
        });
    }
    catch (error) {
        console.error("Error during full fee reconciliation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.fullFeeReconciliation = fullFeeReconciliation;
// @desc    Get operation status
// @route   GET /api/admin/fees/operations/:operationId
// @access  Private/Admin
const getOperationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const operation = yield FeeSyncLog_1.FeeSyncLog.findOne({
            operationId: req.params.operationId,
        })
            .populate("classroomId", "name")
            .populate("termId", "name year")
            .populate("enqueuedBy", "name");
        if (!operation) {
            return res.status(404).json({ message: "Operation not found" });
        }
        res.json(operation);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getOperationStatus = getOperationStatus;
// @desc    Health check for fee system integrity
// @route   GET /api/admin/fees/health-check
// @access  Private/Admin
const getFeeHealthCheck = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting fee system health check...");
        const healthReport = {
            timestamp: new Date(),
            summary: {
                totalStudents: 0,
                studentsWithMissingFees: 0,
                studentsWithExtraFees: 0,
                totalFeeDiscrepancies: 0,
            },
            details: {
                missingFees: [],
                extraFees: [],
                classroomStats: [],
            },
        };
        // Get all active students
        const students = yield Student_1.Student.find({ status: "active" })
            .populate("classroomId", "name")
            .select("fullName studentId admissionDate classroomId termFees");
        healthReport.summary.totalStudents = students.length;
        // Get all fee structures
        const feeStructures = yield FeeStructure_1.FeeStructure.find({})
            .populate("classroomId", "_id name")
            .populate("termId", "name year startDate endDate");
        // Create fee structure lookup map
        const feeStructureMap = new Map();
        feeStructures.forEach((fs) => {
            const key = `${fs.classroomId._id}-${fs.termId.name}-${fs.termId.year}`;
            feeStructureMap.set(key, fs);
        });
        // Analyze each student
        for (const student of students) {
            if (!student.classroomId) {
                healthReport.details.missingFees.push({
                    studentId: student.studentId,
                    fullName: student.fullName,
                    issue: "No classroom assigned",
                });
                healthReport.summary.studentsWithMissingFees++;
                continue;
            }
            const classroomId = student.classroomId._id.toString();
            const admissionDate = new Date(student.admissionDate);
            // Check for missing fees
            const missingFees = [];
            for (const feeStructure of feeStructures) {
                const fsClassroomId = feeStructure.classroomId._id.toString();
                if (fsClassroomId !== classroomId)
                    continue;
                const term = feeStructure.termId;
                const termEnd = new Date(term.endDate);
                // Skip if student wasn't enrolled during this term
                if (admissionDate > termEnd)
                    continue;
                const feeKey = `${term.name}-${term.year}`;
                const hasFee = student.termFees.some((fee) => fee.term === term.name && fee.year === term.year);
                if (!hasFee) {
                    missingFees.push({
                        term: term.name,
                        year: term.year,
                        expectedAmount: feeStructure.amount,
                    });
                }
            }
            if (missingFees.length > 0) {
                healthReport.details.missingFees.push({
                    studentId: student.studentId,
                    fullName: student.fullName,
                    classroom: student.classroomId.name,
                    missingFees,
                });
                healthReport.summary.studentsWithMissingFees++;
                healthReport.summary.totalFeeDiscrepancies += missingFees.length;
            }
            // Check for extra fees (fees without corresponding fee structures)
            const extraFees = [];
            for (const fee of student.termFees) {
                const feeKey = `${classroomId}-${fee.term}-${fee.year}`;
                if (!feeStructureMap.has(feeKey)) {
                    // Check if student was enrolled during this term
                    const term = feeStructures.find((fs) => fs.termId.name === fee.term &&
                        fs.termId.year === fee.year);
                    if (term) {
                        const termEnd = new Date(term.termId.endDate);
                        if (admissionDate <= termEnd) {
                            extraFees.push(fee);
                        }
                    }
                    else {
                        extraFees.push(fee);
                    }
                }
            }
            if (extraFees.length > 0) {
                healthReport.details.extraFees.push({
                    studentId: student.studentId,
                    fullName: student.fullName,
                    classroom: student.classroomId.name,
                    extraFees,
                });
                healthReport.summary.studentsWithExtraFees++;
                healthReport.summary.totalFeeDiscrepancies += extraFees.length;
            }
        }
        // Classroom statistics
        const classroomMap = new Map();
        students.forEach((student) => {
            var _a, _b, _c;
            const classroomId = (_b = (_a = student.classroomId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
            const classroomName = ((_c = student.classroomId) === null || _c === void 0 ? void 0 : _c.name) || "No Classroom";
            if (!classroomMap.has(classroomId || "none")) {
                classroomMap.set(classroomId || "none", {
                    name: classroomName,
                    totalStudents: 0,
                    studentsWithIssues: 0,
                });
            }
            const classroom = classroomMap.get(classroomId || "none");
            classroom.totalStudents++;
            // Check if this student has issues
            const hasMissingFees = healthReport.details.missingFees.some((issue) => issue.studentId === student.studentId);
            const hasExtraFees = healthReport.details.extraFees.some((issue) => issue.studentId === student.studentId);
            if (hasMissingFees || hasExtraFees) {
                classroom.studentsWithIssues++;
            }
        });
        healthReport.details.classroomStats = Array.from(classroomMap.values());
        // Overall health status
        const healthStatus = {
            status: healthReport.summary.totalFeeDiscrepancies === 0
                ? "healthy"
                : "warning",
            message: healthReport.summary.totalFeeDiscrepancies === 0
                ? "All student fees are properly synchronized"
                : `${healthReport.summary.totalFeeDiscrepancies} fee discrepancies found`,
        };
        console.log(`Fee health check completed: ${healthReport.summary.totalFeeDiscrepancies} discrepancies found`);
        res.json(Object.assign(Object.assign({}, healthReport), { healthStatus }));
    }
    catch (error) {
        console.error("Error during fee health check:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getFeeHealthCheck = getFeeHealthCheck;
