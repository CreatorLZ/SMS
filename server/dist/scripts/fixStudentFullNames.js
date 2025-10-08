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
const dotenv_1 = __importDefault(require("dotenv"));
const Student_1 = require("../models/Student");
// Load environment variables
dotenv_1.default.config();
/**
 * Migration script to fix students that don't have fullName field populated
 *
 * This script finds all students where fullName is missing or empty,
 * and sets it to firstName + " " + lastName
 *
 * Usage:
 * npm run fix:student-fullnames
 */
function fixStudentFullNames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
            yield mongoose_1.default.connect(mongoUri);
            console.log("📊 Connected to MongoDB");
            // Find students without fullName or with empty fullName
            const studentsWithoutFullName = yield Student_1.Student.find({
                $or: [
                    { fullName: { $exists: false } },
                    { fullName: "" },
                    { fullName: null },
                ],
            }).select("firstName lastName fullName studentId");
            console.log(`🔍 Found ${studentsWithoutFullName.length} students without fullName`);
            if (studentsWithoutFullName.length === 0) {
                console.log("✅ All students already have fullName populated");
                return;
            }
            // Update each student
            let updatedCount = 0;
            for (const student of studentsWithoutFullName) {
                if (student.firstName && student.lastName) {
                    const newFullName = `${student.firstName} ${student.lastName}`;
                    yield Student_1.Student.findByIdAndUpdate(student._id, {
                        fullName: newFullName,
                    });
                    console.log(`✅ Updated ${student.studentId}: "${newFullName}"`);
                    updatedCount++;
                }
                else {
                    console.log(`⚠️  Skipped ${student.studentId}: Missing firstName or lastName`);
                }
            }
            console.log(`🎉 Successfully updated ${updatedCount} students with fullName field`);
            // Verify the updates
            const remainingWithoutFullName = yield Student_1.Student.countDocuments({
                $or: [
                    { fullName: { $exists: false } },
                    { fullName: "" },
                    { fullName: null },
                ],
            });
            console.log(`📊 Students still without fullName: ${remainingWithoutFullName}`);
        }
        catch (error) {
            console.error("❌ Error fixing student fullNames:", error.message);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log("🔌 Database connection closed");
            process.exit(0);
        }
    });
}
// Handle process termination
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\n🛑 Received SIGINT, closing database connection...");
    yield mongoose_1.default.disconnect();
    process.exit(0);
}));
fixStudentFullNames();
