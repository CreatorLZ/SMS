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
const Classroom_1 = require("../models/Classroom");
const studentIdGenerator_1 = require("../utils/studentIdGenerator");
// Load environment variables
dotenv_1.default.config();
/**
 * Script to create multiple students for a specified class
 *
 * Features:
 * - Uses the proper generateStudentId utility for unique, sequential IDs
 * - Generates realistic Nigerian student data
 * - Configurable via environment variables:
 *   - TARGET_CLASS: Class name (default: "SS1 SCIENCE")
 *   - NUM_STUDENTS: Number of students to create (default: 20)
 *
 * Usage:
 * npm run create:students
 * TARGET_CLASS="SS2 COMMERCIAL" NUM_STUDENTS=15 npm run create:students
 */
// Sample data arrays for generating realistic Nigerian student data
const sampleFirstNames = [
    "John",
    "Mary",
    "Peter",
    "Grace",
    "David",
    "Sarah",
    "Michael",
    "Elizabeth",
    "James",
    "Anna",
    "Joseph",
    "Victoria",
    "Samuel",
    "Rebecca",
    "Daniel",
    "Catherine",
    "Matthew",
    "Joy",
    "Andrew",
    "Blessing",
    "Joshua",
    "Patience",
    "Emmanuel",
    "Mercy",
];
const sampleLastNames = [
    "Adebayo",
    "Okafor",
    "Ibrahim",
    "Eze",
    "Okon",
    "Nnamdi",
    "Chukwu",
    "Abdi",
    "Yusuf",
    "Bello",
    "Ogunleye",
    "Nwosu",
    "Iheanacho",
    "Onyeka",
    "Uzochukwu",
    "Afolabi",
    "Balogun",
    "Ekwueme",
    "Fashola",
    "Gbadamosi",
    "Hassan",
    "Igbinedion",
    "Jelani",
    "Kuti",
];
const sampleAddresses = [
    "123 Main Street, Lagos",
    "456 Oak Avenue, Abuja",
    "789 Pine Road, Port Harcourt",
    "321 Cedar Lane, Kano",
    "654 Elm Street, Ibadan",
    "987 Maple Drive, Benin City",
    "147 Birch Boulevard, Enugu",
    "258 Willow Way, Calabar",
    "369 Spruce Court, Jos",
    "741 Ash Alley, Kaduna",
];
const sampleLocations = [
    "Lagos",
    "Abuja",
    "Port Harcourt",
    "Kano",
    "Ibadan",
    "Benin City",
    "Enugu",
    "Calabar",
    "Jos",
    "Kaduna",
];
function createStudents() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Configuration - can be made configurable via environment variables
            const targetClass = process.env.TARGET_CLASS || "SS1 SCIENCE";
            const numberOfStudents = parseInt(process.env.NUM_STUDENTS || "20");
            console.log(`🎯 Target class: ${targetClass}`);
            console.log(`👥 Number of students to create: ${numberOfStudents}`);
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
            yield mongoose_1.default.connect(mongoUri);
            console.log("📊 Connected to MongoDB");
            // Find target classroom
            const classroom = yield Classroom_1.Classroom.findOne({ name: targetClass });
            if (!classroom) {
                throw new Error(`${targetClass} classroom not found. Please ensure the classroom exists.`);
            }
            console.log(`🎓 Found classroom: ${classroom.name}`);
            // Generate and save students one by one to ensure proper ID sequencing
            const savedStudents = [];
            console.log(`🔄 Creating ${numberOfStudents} students with proper IDs...`);
            for (let i = 0; i < numberOfStudents; i++) {
                try {
                    const firstName = sampleFirstNames[Math.floor(Math.random() * sampleFirstNames.length)];
                    const lastName = sampleLastNames[Math.floor(Math.random() * sampleLastNames.length)];
                    const gender = Math.random() > 0.5 ? "Male" : "Female";
                    const dateOfBirth = new Date(2005 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                    const address = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];
                    const location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
                    // Generate phone numbers (Nigerian format)
                    const generatePhone = () => `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`;
                    // Generate unique student ID using the proper utility
                    const studentId = yield (0, studentIdGenerator_1.generateStudentId)(targetClass);
                    console.log(`📝 Generated ID for ${firstName} ${lastName}: ${studentId}`);
                    const student = new Student_1.Student({
                        firstName,
                        lastName,
                        fullName: `${firstName} ${lastName}`, // Explicitly set fullName since save() triggers pre-save hooks but we set it explicitly for consistency
                        studentId,
                        gender,
                        dateOfBirth,
                        address,
                        location,
                        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.com`,
                        passportPhoto: null, // Leave empty as specified
                        emergencyContact: {
                            name: `${firstName} ${lastName} Sr.`,
                            relationship: "Parent",
                            phoneNumber: generatePhone(),
                        },
                        parentName: `${firstName} ${lastName} Parent`,
                        parentPhone: generatePhone(),
                        parentEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.parent@school.com`,
                        relationshipToStudent: Math.random() > 0.5 ? "Father" : "Mother",
                        currentClass: targetClass,
                        classroomId: classroom._id,
                        status: "active",
                        admissionDate: new Date(),
                    });
                    // Save student individually to ensure ID uniqueness
                    const savedStudent = yield student.save();
                    savedStudents.push(savedStudent);
                    console.log(`✅ Created student ${i + 1}/${numberOfStudents}: ${savedStudent.fullName} (${studentId})`);
                }
                catch (error) {
                    console.error(`❌ Failed to create student ${i + 1}:`, error.message);
                    throw new Error(`Student creation failed for student ${i + 1}: ${error.message}`);
                }
            }
            console.log(`✅ Successfully created ${savedStudents.length} students`);
            // Update classroom with new students
            yield Classroom_1.Classroom.findByIdAndUpdate(classroom._id, {
                $push: { students: { $each: savedStudents.map((s) => s._id) } },
            });
            console.log("🔗 Students added to classroom");
            console.log(`🎉 Successfully created ${numberOfStudents} students for ${targetClass} class!`);
            console.log(`📋 Student IDs generated: ${savedStudents
                .map((s) => s.studentId)
                .join(", ")}`);
        }
        catch (error) {
            console.error("❌ Error creating students:", error.message);
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
createStudents();
