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
exports.fixUndefinedSessions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Student_1 = require("../models/Student");
const Term_1 = require("../models/Term");
const AuditLog_1 = require("../models/AuditLog");
const User_1 = require("../models/User");
require("../models/Session"); // Register Session model
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fixUndefinedSessions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting undefined session fix...");
        const startTime = Date.now();
        let totalFixed = 0;
        let studentsAffected = 0;
        // Get an admin user for audit logging
        const adminUser = yield User_1.User.findOne({
            role: { $in: ["admin", "superadmin"] },
        }).select("_id");
        if (!adminUser) {
            throw new Error("No admin user found for audit logging");
        }
        // Get all terms with session populated for lookup
        const terms = yield Term_1.Term.find({}).populate("sessionId", "name");
        const termSessionMap = new Map();
        terms.forEach((term) => {
            var _a;
            const sessionName = ((_a = term.sessionId) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Session";
            termSessionMap.set(term.name, sessionName);
        });
        console.log(`Loaded ${terms.length} terms for session lookup`);
        // Debug: Log term session mapping
        console.log("Term to session mapping:");
        terms.forEach((term) => {
            var _a, _b;
            console.log(`  Term "${term.name}": sessionId=${(_a = term.sessionId) === null || _a === void 0 ? void 0 : _a._id}, sessionName="${((_b = term.sessionId) === null || _b === void 0 ? void 0 : _b.name) || "NO SESSION"}"`);
        });
        // Find all students with termFees
        const students = yield Student_1.Student.find({
            termFees: { $exists: true, $ne: [] },
        }).select("_id fullName studentId termFees");
        console.log(`Checking ${students.length} students for undefined sessions...`);
        // Debug: Log all fees to see what sessions exist
        for (const student of students) {
            if (student.termFees && student.termFees.length > 0) {
                console.log(`Student ${student.fullName} has fees:`);
                student.termFees.forEach((fee, index) => {
                    console.log(`  Fee ${index}: term="${fee.term}", session="${fee.session}" (type: ${typeof fee.session})`);
                });
            }
        }
        for (const student of students) {
            if (!student.termFees || student.termFees.length === 0)
                continue;
            let studentFixed = false;
            // Check each fee for incorrect session (undefined, null, empty, or "Unknown Session")
            for (const fee of student.termFees) {
                if (fee.session === undefined ||
                    fee.session === null ||
                    fee.session === "" ||
                    fee.session === "Unknown Session") {
                    // Look up the correct session name for this term
                    const correctSession = termSessionMap.get(fee.term);
                    if (correctSession) {
                        console.log(`Fixing undefined session for student ${student.fullName}: ${fee.term} -> session: "${correctSession}"`);
                        fee.session = correctSession;
                        totalFixed++;
                        studentFixed = true;
                    }
                    else {
                        console.warn(`Could not find session for term "${fee.term}" - leaving as undefined`);
                    }
                }
            }
            // Save the student if any fees were fixed
            if (studentFixed) {
                yield student.save();
                studentsAffected++;
            }
        }
        const duration = Date.now() - startTime;
        // Create audit log
        yield AuditLog_1.AuditLog.create({
            userId: adminUser._id,
            actionType: "FEE_RECONCILIATION",
            description: `Fixed undefined sessions in student fees: ${totalFixed} fees updated across ${studentsAffected} students in ${duration}ms`,
            targetId: null,
        });
        console.log("=== SESSION FIX SUMMARY ===");
        console.log(`Total fees fixed: ${totalFixed}`);
        console.log(`Students affected: ${studentsAffected}`);
        console.log(`Duration: ${duration}ms`);
        console.log("============================");
        console.log("✅ Session fix completed successfully!");
    }
    catch (error) {
        console.error("Error during session fix:", error);
        throw error;
    }
});
exports.fixUndefinedSessions = fixUndefinedSessions;
// Run the script if called directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const dbUrl = process.env.MONGODB_URI ||
            process.env.DATABASE_URL ||
            process.env.MONGO_URI ||
            "mongodb://localhost:27017/schoolms";
        yield mongoose_1.default.connect(dbUrl);
        console.log(`Connected to MongoDB at ${dbUrl}`);
        yield fixUndefinedSessions();
        yield mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(0);
    }))().catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
}
