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
exports.cleanupLegacyAssignedClassId = cleanupLegacyAssignedClassId;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Classroom_1 = require("../models/Classroom");
function cleanupLegacyAssignedClassId() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            console.log("Starting comprehensive cleanup of legacy assignedClassId...");
            // Step 1: Migrate any remaining assignedClassId to assignedClasses
            console.log("Step 1: Migrating remaining assignedClassId data...");
            const teachersWithLegacyField = yield User_1.User.find({
                role: "teacher",
                assignedClassId: { $exists: true, $ne: null },
            });
            console.log(`Found ${teachersWithLegacyField.length} teachers with legacy assignedClassId`);
            for (const teacher of teachersWithLegacyField) {
                const assignedClassId = teacher.assignedClassId;
                if (!assignedClassId)
                    continue;
                // Check if assignedClasses already contains this classroom
                const hasClassroom = (_a = teacher.assignedClasses) === null || _a === void 0 ? void 0 : _a.includes(assignedClassId.toString());
                if (!hasClassroom) {
                    // Add to assignedClasses array
                    yield User_1.User.findByIdAndUpdate(teacher._id, {
                        $addToSet: { assignedClasses: assignedClassId },
                    });
                    console.log(`Migrated teacher ${teacher.name}: added ${assignedClassId} to assignedClasses`);
                }
                // Ensure classroom.teacherId is set correctly
                const classroom = yield Classroom_1.Classroom.findById(assignedClassId);
                if (classroom &&
                    ((_b = classroom.teacherId) === null || _b === void 0 ? void 0 : _b.toString()) !== teacher._id.toString()) {
                    yield Classroom_1.Classroom.findByIdAndUpdate(assignedClassId, {
                        teacherId: teacher._id,
                    });
                    console.log(`Fixed classroom ${classroom.name}: set teacherId to ${teacher.name}`);
                }
            }
            // Step 2: Remove assignedClassId field from all users
            console.log("Step 2: Removing assignedClassId field from all users...");
            const result = yield User_1.User.updateMany({ assignedClassId: { $exists: true } }, { $unset: { assignedClassId: 1 } });
            console.log(`Removed assignedClassId field from ${result.modifiedCount} users`);
            // Step 3: Verify data integrity
            console.log("Step 3: Verifying data integrity...");
            const teachers = yield User_1.User.find({ role: "teacher" }).populate("assignedClasses", "name teacherId");
            let integrityIssues = 0;
            for (const teacher of teachers) {
                if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
                    for (const classroom of teacher.assignedClasses) {
                        if (((_c = classroom.teacherId) === null || _c === void 0 ? void 0 : _c.toString()) !== teacher._id.toString()) {
                            console.error(`Integrity issue: Classroom ${classroom.name} has teacherId ${classroom.teacherId} but teacher ${teacher.name} has it assigned`);
                            integrityIssues++;
                            // Fix the issue
                            yield Classroom_1.Classroom.findByIdAndUpdate(classroom._id, {
                                teacherId: teacher._id,
                            });
                            console.log(`Fixed: Set classroom ${classroom.name} teacherId to ${teacher.name}`);
                        }
                    }
                }
            }
            // Step 4: Check for orphaned classrooms (classrooms with teacherId but teacher doesn't have them assigned)
            console.log("Step 4: Checking for orphaned classroom assignments...");
            const classrooms = yield Classroom_1.Classroom.find({
                teacherId: { $exists: true, $ne: null },
            }).populate("teacherId", "name assignedClasses");
            for (const classroom of classrooms) {
                if (classroom.teacherId) {
                    const teacher = classroom.teacherId;
                    const hasAssignment = (_d = teacher.assignedClasses) === null || _d === void 0 ? void 0 : _d.includes(classroom._id.toString());
                    if (!hasAssignment) {
                        console.error(`Orphaned assignment: Classroom ${classroom.name} has teacherId ${teacher.name} but teacher doesn't have it in assignedClasses`);
                        // Fix by adding to teacher's assignedClasses
                        yield User_1.User.findByIdAndUpdate(teacher._id, {
                            $addToSet: { assignedClasses: classroom._id },
                        });
                        console.log(`Fixed: Added classroom ${classroom.name} to teacher ${teacher.name}'s assignedClasses`);
                    }
                }
            }
            console.log("Cleanup Summary:");
            console.log(`- Migrated ${teachersWithLegacyField.length} teachers from assignedClassId to assignedClasses`);
            console.log(`- Removed assignedClassId field from ${result.modifiedCount} users`);
            console.log(`- Fixed ${integrityIssues} data integrity issues`);
            console.log("- Legacy assignedClassId cleanup completed successfully");
        }
        catch (error) {
            console.error("Error during legacy cleanup:", error);
            throw error;
        }
        finally {
            mongoose_1.default.connection.close();
        }
    });
}
// Run the script if called directly
if (require.main === module) {
    // Connect to MongoDB
    mongoose_1.default
        .connect(process.env.MONGODB_URI ||
        "mongodb+srv://isaacanyim:Lezico123@isaacdev.bpnm7.mongodb.net/treasureland?retryWrites=true&w=majority&appName=Isaacdev")
        .then(() => {
        console.log("Connected to MongoDB");
        return cleanupLegacyAssignedClassId();
    })
        .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });
}
