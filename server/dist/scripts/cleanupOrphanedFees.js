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
const mongoose_1 = __importDefault(require("mongoose"));
const Student_1 = require("../models/Student");
const FeeStructure_1 = require("../models/FeeStructure");
const AuditLog_1 = require("../models/AuditLog");
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cleanupOrphanedFees = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting orphaned fee cleanup...");
        const startTime = Date.now();
        let totalOrphanedFees = 0;
        let studentsAffected = 0;
        // Get an admin user for audit logging
        const adminUser = yield User_1.User.findOne({
            role: { $in: ["admin", "superadmin"] },
        }).select("_id");
        if (!adminUser) {
            throw new Error("No admin user found for audit logging");
        }
        // Get all active fee structures for lookup
        const feeStructures = yield FeeStructure_1.FeeStructure.find({ isActive: true })
            .populate("classroomId", "_id")
            .populate({
            path: "termId",
            populate: {
                path: "sessionId",
                select: "name",
            },
        });
        // Create fee structure lookup map
        const feeStructureMap = new Map();
        feeStructures.forEach((fs) => {
            var _a;
            const sessionName = ((_a = fs.termId.sessionId) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Session";
            const key = `${fs.classroomId._id}-${fs.termId.name}-${sessionName}`;
            feeStructureMap.set(key, fs);
        });
        console.log(`Found ${feeStructures.length} active fee structures`);
        // Get all students with term fees
        const students = yield Student_1.Student.find({
            "termFees.0": { $exists: true }, // Students with at least one term fee
        }).select("_id fullName studentId classroomId termFees");
        console.log(`Checking ${students.length} students for orphaned fees...`);
        for (const student of students) {
            if (!student.classroomId) {
                console.log(`Student ${student.fullName} has no classroom assigned, skipping...`);
                continue;
            }
            const classroomId = student.classroomId._id.toString();
            const orphanedFees = [];
            // Check each term fee
            for (const fee of student.termFees) {
                const feeKey = `${classroomId}-${fee.term}-${fee.session}`;
                if (!feeStructureMap.has(feeKey)) {
                    orphanedFees.push({
                        term: fee.term,
                        session: fee.session,
                        amount: fee.amount,
                        paid: fee.paid,
                    });
                }
            }
            // Remove orphaned fees if any found
            if (orphanedFees.length > 0) {
                console.log(`Student ${student.fullName} (${student.studentId}) has ${orphanedFees.length} orphaned fees:`);
                orphanedFees.forEach((fee) => {
                    console.log(`  - ${fee.term} ${fee.session}: ₦${fee.amount} (${fee.paid ? "paid" : "unpaid"})`);
                });
                // Remove orphaned fees from student
                const conditions = orphanedFees.map((fee) => ({
                    term: fee.term,
                    session: fee.session,
                }));
                yield Student_1.Student.updateOne({ _id: student._id }, {
                    $pull: {
                        termFees: { $or: conditions },
                    },
                });
                totalOrphanedFees += orphanedFees.length;
                studentsAffected++;
                // Create audit log for this student
                yield AuditLog_1.AuditLog.create({
                    userId: adminUser._id,
                    actionType: "FEE_RECONCILIATION",
                    description: `Cleaned up ${orphanedFees.length} orphaned fees for student ${student.fullName} (${student.studentId})`,
                    targetId: student._id,
                });
            }
        }
        const duration = Date.now() - startTime;
        // Create summary audit log
        yield AuditLog_1.AuditLog.create({
            userId: adminUser._id,
            actionType: "FEE_RECONCILIATION",
            description: `Orphaned fee cleanup completed: ${totalOrphanedFees} orphaned fees removed from ${studentsAffected} students in ${duration}ms`,
            targetId: null,
        });
        console.log("\n=== CLEANUP SUMMARY ===");
        console.log(`Total orphaned fees removed: ${totalOrphanedFees}`);
        console.log(`Students affected: ${studentsAffected}`);
        console.log(`Duration: ${duration}ms`);
        console.log("========================\n");
        if (totalOrphanedFees > 0) {
            console.log("✅ Cleanup completed successfully!");
        }
        else {
            console.log("ℹ️  No orphaned fees found - system is clean.");
        }
        yield mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error("Cleanup failed:", error);
        throw error;
    }
});
// If running this script directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const dbUrl = process.env.MONGODB_URI ||
            process.env.DATABASE_URL ||
            process.env.MONGO_URI ||
            "mongodb://localhost:27017/schoolms";
        yield mongoose_1.default.connect(dbUrl);
        console.log(`Connected to MongoDB at ${dbUrl}`);
        yield cleanupOrphanedFees();
        yield mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(0);
    }))();
}
