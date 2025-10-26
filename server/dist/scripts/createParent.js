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
const User_1 = require("../models/User");
const Student_1 = require("../models/Student");
// Load environment variables
dotenv_1.default.config();
/**
 * Script to create a parent user linked to a student
 *
 * Usage:
 * npm run create:parent
 * STUDENT_ID=SS1S250023 npm run create:parent
 */
function createParent() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const studentId = process.env.STUDENT_ID || "SS1S250023";
            console.log(`🎯 Creating parent for student: ${studentId}`);
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
            yield mongoose_1.default.connect(mongoUri);
            console.log("📊 Connected to MongoDB");
            // Find the student
            const student = yield Student_1.Student.findOne({ studentId });
            if (!student) {
                throw new Error(`Student with ID ${studentId} not found`);
            }
            console.log(`👨‍🎓 Found student: ${student.fullName}`);
            // Check if parent already exists
            const existingParent = yield User_1.User.findOne({
                linkedStudentIds: student._id,
                role: "parent",
            });
            if (existingParent) {
                console.log(`⚠️ Parent already exists for this student: ${existingParent.email}`);
                console.log(`🔑 Parent ID: ${existingParent._id}`);
                return;
            }
            // Create parent user
            const parentEmail = `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}.parent@school.com`;
            const parentPassword = "password123";
            const parent = new User_1.User({
                name: student.parentName,
                email: parentEmail,
                password: parentPassword,
                role: "parent",
                linkedStudentIds: [student._id],
                verified: true,
            });
            const savedParent = yield parent.save();
            console.log(`✅ Created parent: ${savedParent.name}`);
            console.log(`📧 Email: ${savedParent.email}`);
            console.log(`🔑 Password: ${parentPassword}`);
            console.log(`🆔 Parent ID: ${savedParent._id}`);
        }
        catch (error) {
            console.error("❌ Error creating parent:", error.message);
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
createParent();
