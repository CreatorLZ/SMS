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
exports.fixCorruptedClassrooms = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Classroom_1 = require("../models/Classroom");
// Load environment variables
dotenv_1.default.config();
/**
 * Script to find and fix corrupted Classroom documents where students field is not an array
 */
const fixCorruptedClassrooms = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Checking for corrupted Classroom documents...");
        // Find all classrooms
        const allClassrooms = yield Classroom_1.Classroom.find({});
        console.log(`Found ${allClassrooms.length} classrooms`);
        let corruptedCount = 0;
        for (const classroom of allClassrooms) {
            console.log(`Classroom ${classroom._id}: students =`, classroom.students, `type: ${typeof classroom.students}`);
            if (typeof classroom.students === "string") {
                console.log(`Corrupted classroom found: ${classroom._id}, name: ${classroom.name}, students: "${classroom.students}"`);
                // Fix it
                yield Classroom_1.Classroom.findByIdAndUpdate(classroom._id, {
                    students: [],
                });
                console.log(`Fixed classroom ${classroom._id}`);
                corruptedCount++;
            }
            else if (!Array.isArray(classroom.students)) {
                console.log(`Invalid students type for classroom ${classroom._id}: ${typeof classroom.students}`);
                corruptedCount++;
            }
            else {
                // Check if array contains invalid ObjectIds
                const invalidStudents = classroom.students.filter((studentId) => {
                    if (typeof studentId === "string") {
                        return !mongoose_1.default.Types.ObjectId.isValid(studentId);
                    }
                    // If it's an ObjectId instance, it's valid
                    return false;
                });
                if (invalidStudents.length > 0) {
                    console.log(`Classroom ${classroom._id} has invalid student IDs:`, invalidStudents);
                    // Fix by removing invalid IDs
                    const validStudents = classroom.students.filter((studentId) => {
                        if (typeof studentId === "string") {
                            return mongoose_1.default.Types.ObjectId.isValid(studentId);
                        }
                        // Keep ObjectId instances
                        return true;
                    });
                    yield Classroom_1.Classroom.findByIdAndUpdate(classroom._id, {
                        students: validStudents,
                    });
                    console.log(`Fixed classroom ${classroom._id}, removed ${invalidStudents.length} invalid IDs`);
                    corruptedCount++;
                }
            }
        }
        console.log(`Fixed ${corruptedCount} corrupted classrooms`);
        return corruptedCount === 0;
    }
    catch (error) {
        console.error("Script failed:", error);
        return false;
    }
});
exports.fixCorruptedClassrooms = fixCorruptedClassrooms;
// If running this script directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const dbUrl = process.env.MONGODB_URI ||
            process.env.DATABASE_URL ||
            "mongodb://localhost:27017/schoolms";
        yield mongoose_1.default.connect(dbUrl);
        console.log(`Connected to MongoDB at ${dbUrl}`);
        const success = yield (0, exports.fixCorruptedClassrooms)();
        yield mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(success ? 0 : 1);
    }))();
}
