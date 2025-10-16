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
exports.fixNullTeacherIds = fixNullTeacherIds;
const mongoose_1 = __importDefault(require("mongoose"));
const Classroom_1 = require("../models/Classroom");
const User_1 = require("../models/User");
function fixNullTeacherIds() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Starting to fix classrooms with null teacherId...");
            // Find all classrooms with null teacherId
            const classroomsWithNullTeacher = yield Classroom_1.Classroom.find({ teacherId: null });
            console.log(`Found ${classroomsWithNullTeacher.length} classrooms with null teacherId`);
            for (const classroom of classroomsWithNullTeacher) {
                console.log(`Processing classroom: ${classroom.name} (${classroom._id})`);
                // Check if there's a teacher assigned to this classroom via the old assignedClassId field
                const teacher = yield User_1.User.findOne({
                    role: "teacher",
                    assignedClassId: classroom._id,
                });
                if (teacher) {
                    console.log(`Found teacher ${teacher.name} for classroom ${classroom.name}`);
                    classroom.teacherId = teacher._id;
                    yield classroom.save();
                    console.log(`Updated classroom ${classroom.name} with teacher ${teacher.name}`);
                }
                else {
                    console.log(`No teacher found for classroom ${classroom.name} - leaving as null`);
                }
            }
            console.log("Finished fixing classrooms with null teacherId");
        }
        catch (error) {
            console.error("Error fixing null teacherIds:", error);
        }
        finally {
            mongoose_1.default.connection.close();
        }
    });
}
// Run the script if called directly
if (require.main === module) {
    // Connect to MongoDB (adjust connection string as needed)
    mongoose_1.default
        .connect(process.env.MONGODB_URI ||
        "mongodb+srv://isaacanyim:Lezico123@isaacdev.bpnm7.mongodb.net/treasureland?retryWrites=true&w=majority&appName=Isaacdev")
        .then(() => {
        console.log("Connected to MongoDB");
        return fixNullTeacherIds();
    })
        .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });
}
