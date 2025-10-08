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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncStudentFeesForClassroomBatched = syncStudentFeesForClassroomBatched;
exports.backfillStudentClassroomIds = backfillStudentClassroomIds;
exports.removeDuplicateStudentFees = removeDuplicateStudentFees;
exports.backfillMissingFees = backfillMissingFees;
exports.fullReconciliation = fullReconciliation;
// src/services/feeSync.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const Student_1 = require("../models/Student");
const FeeStructure_1 = require("../models/FeeStructure");
const Classroom_1 = require("../models/Classroom");
const crypto_1 = __importDefault(require("crypto"));
const BATCH_SIZE = 500;
function generatePinCode() {
    // 6 digit numeric but cryptographically random
    return crypto_1.default.randomInt(0, 1000000).toString().padStart(6, "0");
}
function generateOperationId() {
    return crypto_1.default.randomUUID();
}
function syncStudentFeesForClassroomBatched(classroomId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const operationId = generateOperationId();
        const errors = [];
        let created = 0;
        let updated = 0;
        let attempted = 0;
        // Load active fee structures for classroom
        const feeStructures = yield FeeStructure_1.FeeStructure.find({
            classroomId,
            isActive: true,
        }).populate({
            path: "termId",
            populate: {
                path: "sessionId",
                select: "name",
            },
        });
        if (!feeStructures || feeStructures.length === 0) {
            return { operationId, created, updated, attempted, errors };
        }
        // Get all active students in classroom
        const students = yield Student_1.Student.find({
            classroomId,
            status: "active",
        }).select("_id termFees");
        const bulkOps = [];
        const now = new Date();
        for (const student of students) {
            for (const fs of feeStructures) {
                const term = fs.termId;
                if (!term)
                    continue;
                const termName = term.name;
                const sessionName = ((_a = term.sessionId) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Session";
                const amount = (_b = fs.amount) !== null && _b !== void 0 ? _b : 0;
                // Check if student already has this fee
                const hasTerm = (_c = student.termFees) === null || _c === void 0 ? void 0 : _c.some((t) => t.term === termName && t.session === sessionName);
                if (!hasTerm) {
                    // Add new fee entry
                    bulkOps.push({
                        updateOne: {
                            filter: {
                                _id: student._id,
                                "termFees.term": { $ne: termName },
                                "termFees.session": { $ne: sessionName },
                            },
                            update: {
                                $push: {
                                    termFees: {
                                        term: termName,
                                        session: sessionName,
                                        paid: false,
                                        pinCode: generatePinCode(),
                                        viewable: false,
                                        amount,
                                        paymentDate: null,
                                        updatedBy: userId
                                            ? new mongoose_1.default.Types.ObjectId(userId)
                                            : undefined,
                                        createdAt: now,
                                    },
                                },
                            },
                        },
                    });
                    created++;
                }
                else {
                    // Update existing fee amount if changed
                    const existingFee = student.termFees.find((t) => t.term === termName && t.session === sessionName);
                    if (existingFee && existingFee.amount !== amount) {
                        bulkOps.push({
                            updateOne: {
                                filter: {
                                    _id: student._id,
                                    "termFees.term": termName,
                                    "termFees.session": sessionName,
                                },
                                update: {
                                    $set: {
                                        "termFees.$.amount": amount,
                                        "termFees.$.updatedBy": userId
                                            ? new mongoose_1.default.Types.ObjectId(userId)
                                            : undefined,
                                    },
                                },
                            },
                        });
                        updated++;
                    }
                    // Ensure PIN code exists
                    if (existingFee && !existingFee.pinCode) {
                        bulkOps.push({
                            updateOne: {
                                filter: {
                                    _id: student._id,
                                    "termFees.term": termName,
                                    "termFees.session": sessionName,
                                },
                                update: {
                                    $set: {
                                        "termFees.$.pinCode": generatePinCode(),
                                        "termFees.$.updatedBy": userId
                                            ? new mongoose_1.default.Types.ObjectId(userId)
                                            : undefined,
                                    },
                                },
                            },
                        });
                        updated++;
                    }
                }
            }
        }
        // Execute in batches
        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            const batch = bulkOps.slice(i, i + BATCH_SIZE);
            attempted += batch.length;
            try {
                const res = yield Student_1.Student.bulkWrite(batch, { ordered: false });
                const result = res;
                updated += result.nModified || 0;
                created += result.nUpserted || 0;
            }
            catch (err) {
                errors.push({ batchStart: i, error: err.message || err });
            }
        }
        return { operationId, created, updated, attempted, errors };
    });
}
function backfillStudentClassroomIds(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        let processed = 0;
        let updated = 0;
        try {
            // Get all classrooms for mapping
            const classrooms = yield Classroom_1.Classroom.find({}).select("_id name");
            const classroomMap = new Map(classrooms.map((c) => [c.name, c._id]));
            // Find students who have currentClass but no classroomId
            const studentsToUpdate = yield Student_1.Student.find({
                currentClass: { $exists: true, $ne: "" },
                $or: [{ classroomId: { $exists: false } }, { classroomId: null }],
            }).select("_id currentClass classroomId");
            processed = studentsToUpdate.length;
            if (processed === 0) {
                return { processed, updated, errors };
            }
            console.log(`Found ${processed} students to backfill classroomId`);
            // Process in batches
            const BATCH_SIZE = 100;
            for (let i = 0; i < studentsToUpdate.length; i += BATCH_SIZE) {
                const batch = studentsToUpdate.slice(i, i + BATCH_SIZE);
                const bulkOps = [];
                for (const student of batch) {
                    const classroomId = classroomMap.get(student.currentClass);
                    if (classroomId) {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: student._id },
                                update: { classroomId },
                            },
                        });
                    }
                    else {
                        errors.push({
                            studentId: student._id,
                            currentClass: student.currentClass,
                            error: `No classroom found for class name: ${student.currentClass}`,
                        });
                    }
                }
                if (bulkOps.length > 0) {
                    try {
                        const result = yield Student_1.Student.bulkWrite(bulkOps, { ordered: false });
                        updated += result.modifiedCount || 0;
                        console.log(`Updated ${result.modifiedCount} students in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
                    }
                    catch (err) {
                        console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err);
                        errors.push({ batchStart: i, error: err.message || err });
                    }
                }
            }
            console.log(`Backfill complete: ${processed} processed, ${updated} updated, ${errors.length} errors`);
        }
        catch (error) {
            console.error("Error in backfillStudentClassroomIds:", error);
            errors.push({ error: error.message || error });
        }
        return { processed, updated, errors };
    });
}
// Remove duplicate student fee records
function removeDuplicateStudentFees(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        let processed = 0;
        let duplicatesFound = 0;
        let duplicatesRemoved = 0;
        try {
            console.log("Starting duplicate fee removal process...");
            // Get all students with termFees
            const students = yield Student_1.Student.find({
                termFees: { $exists: true, $ne: [] },
            }).select("_id fullName studentId termFees");
            processed = students.length;
            for (const student of students) {
                if (!student.termFees || student.termFees.length === 0)
                    continue;
                // Find duplicate term/session combinations
                const seenTerms = new Map();
                const toRemove = [];
                student.termFees.forEach((fee, index) => {
                    const key = `${fee.term}-${fee.session}`;
                    if (!seenTerms.has(key)) {
                        seenTerms.set(key, []);
                    }
                    seenTerms.get(key).push(Object.assign(Object.assign({}, fee), { originalIndex: index }));
                });
                // Identify duplicates for each term/year (keep the most recently updated)
                seenTerms.forEach((fees, key) => {
                    if (fees.length > 1) {
                        duplicatesFound += fees.length - 1;
                        // Sort by updatedAt (null first, then by date)
                        fees.sort((a, b) => {
                            const aTime = a.updatedAt || a.createdAt || new Date(0);
                            const bTime = b.updatedAt || b.createdAt || new Date(0);
                            return bTime.getTime() - aTime.getTime(); // Descending order (latest first)
                        });
                        // Mark all but the first (latest) for removal
                        for (let i = 1; i < fees.length; i++) {
                            toRemove.push(fees[i].originalIndex.toString());
                        }
                    }
                });
                // Remove duplicates if any found
                if (toRemove.length > 0) {
                    try {
                        // Simpler approach: remove all duplicate entries by term/session
                        const removeConditions = toRemove.map((index) => {
                            const fee = student.termFees[parseInt(index)];
                            return { term: fee.term, session: fee.session };
                        });
                        yield Student_1.Student.updateOne({ _id: student._id }, {
                            $pull: {
                                termFees: { $or: removeConditions },
                            },
                        });
                        duplicatesRemoved += toRemove.length;
                        console.log(`Removed ${toRemove.length} duplicates for student ${student.fullName}`);
                    }
                    catch (err) {
                        console.error(`Error removing duplicates for student ${student._id}:`, err);
                        errors.push({
                            studentId: student._id,
                            error: err.message || err,
                        });
                    }
                }
            }
            console.log(`Duplicate removal complete: ${duplicatesFound} duplicates found, ${duplicatesRemoved} removed`);
        }
        catch (error) {
            console.error("Error in removeDuplicateStudentFees:", error);
            errors.push({ error: error.message || error });
        }
        return { processed, duplicatesFound, duplicatesRemoved, errors };
    });
}
// Backfill missing fees for students
function backfillMissingFees(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        let processed = 0;
        let missingFeesFound = 0;
        let feesBackfilled = 0;
        try {
            console.log("Starting missing fees backfill process...");
            // Get all active students
            const students = yield Student_1.Student.find({ status: "active" })
                .populate("classroomId", "_id")
                .select("_id fullName studentId admissionDate classroomId termFees");
            processed = students.length;
            // Get all active fee structures
            const feeStructures = yield FeeStructure_1.FeeStructure.find({ isActive: true })
                .populate("classroomId", "_id")
                .populate({
                path: "termId",
                populate: {
                    path: "sessionId",
                    select: "name",
                },
            });
            // Create fee structure lookup
            const feeStructureMap = new Map();
            feeStructures.forEach((fs) => {
                var _a;
                const sessionName = ((_a = fs.termId.sessionId) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Session";
                const key = `${fs.classroomId._id}-${fs.termId.name}-${sessionName}`;
                feeStructureMap.set(key, fs);
            });
            // Check each student for missing fees
            for (const student of students) {
                if (!student.classroomId)
                    continue;
                const classroomId = student.classroomId._id.toString();
                const admissionDate = new Date(student.admissionDate);
                const missingFees = [];
                // Check for missing fees that should exist
                feeStructures.forEach((fs) => {
                    var _a;
                    const fsClassroomId = fs.classroomId._id.toString();
                    if (fsClassroomId !== classroomId)
                        return;
                    const term = fs.termId;
                    const termEnd = new Date(term.endDate);
                    const sessionName = ((_a = term.sessionId) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Session";
                    // Skip if student wasn't enrolled during this term
                    if (admissionDate > termEnd)
                        return;
                    const feeKey = `${term.name}-${sessionName}`;
                    const hasFee = student.termFees.some((fee) => fee.term === term.name && fee.session === sessionName);
                    if (!hasFee) {
                        missingFees.push({
                            term: term.name,
                            session: sessionName,
                            amount: fs.amount,
                            feeStructureId: fs._id,
                        });
                    }
                });
                // Backfill missing fees
                if (missingFees.length > 0) {
                    missingFeesFound += missingFees.length;
                    const now = new Date();
                    try {
                        const bulkOps = missingFees.map((missingFee) => ({
                            updateOne: {
                                filter: {
                                    _id: student._id,
                                    "termFees.term": { $ne: missingFee.term },
                                    "termFees.session": { $ne: missingFee.session },
                                },
                                update: {
                                    $push: {
                                        termFees: {
                                            term: missingFee.term,
                                            session: missingFee.session,
                                            paid: false,
                                            pinCode: generatePinCode(),
                                            viewable: false,
                                            amount: missingFee.amount,
                                            paymentDate: null,
                                            updatedBy: userId
                                                ? new mongoose_1.default.Types.ObjectId(userId)
                                                : undefined,
                                            createdAt: now,
                                        },
                                    },
                                },
                            },
                        }));
                        yield Student_1.Student.bulkWrite(bulkOps, { ordered: false });
                        feesBackfilled += missingFees.length;
                        console.log(`Backfilled ${missingFees.length} fees for student ${student.fullName}`);
                    }
                    catch (err) {
                        console.error(`Error backfilling fees for student ${student._id}:`, err);
                        errors.push({
                            studentId: student._id,
                            error: err.message || err,
                        });
                    }
                }
            }
            console.log(`Missing fees backfill complete: ${missingFeesFound} missing fees found, ${feesBackfilled} backfilled`);
        }
        catch (error) {
            console.error("Error in backfillMissingFees:", error);
            errors.push({ error: error.message || error });
        }
        return { processed, missingFeesFound, feesBackfilled, errors };
    });
}
// Full reconciliation: remove duplicates + backfill missing fees
function fullReconciliation(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Starting full reconciliation process...");
            // First, remove duplicates
            console.log("Phase 1: Removing duplicate fees...");
            const deduplication = yield removeDuplicateStudentFees(userId);
            // Then, backfill missing fees
            console.log("Phase 2: Backfilling missing fees...");
            const backfill = yield backfillMissingFees(userId);
            const totalErrors = deduplication.errors.length + backfill.errors.length;
            console.log(`Full reconciliation complete: ${totalErrors} total errors`);
            return {
                deduplication,
                backfill,
                totalErrors,
            };
        }
        catch (error) {
            console.error("Error in fullReconciliation:", error);
            throw error;
        }
    });
}
