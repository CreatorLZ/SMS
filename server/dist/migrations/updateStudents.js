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
exports.migrateStudentNames = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Student_1 = require("../models/Student");
/**
 * Migration script to split existing fullName into firstName and lastName
 * Run this script once after updating the Student model with name fields
 */
const migrateStudentNames = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting student name migration...");
        // Find all students that don't have firstName or lastName set
        const studentsToMigrate = yield Student_1.Student.find({
            $or: [
                { firstName: { $exists: false } },
                { lastName: { $exists: false } },
                { firstName: "" },
                { lastName: "" },
            ],
        });
        console.log(`Found ${studentsToMigrate.length} students to migrate`);
        for (const student of studentsToMigrate) {
            if (student.fullName) {
                // Split fullName into firstName and lastName
                const nameParts = student.fullName.trim().split(/\s+/);
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";
                // Update the student with split names
                yield Student_1.Student.findByIdAndUpdate(student._id, {
                    firstName: firstName.charAt(0).toUpperCase() +
                        firstName.slice(1).toLowerCase(),
                    lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase(),
                });
                console.log(`Migrated: ${student.fullName} -> ${firstName} ${lastName}`);
            }
        }
        // Verify all students now have firstName and lastName
        const studentsWithoutNames = yield Student_1.Student.find({
            $or: [
                { firstName: { $exists: false } },
                { lastName: { $exists: false } },
                { firstName: "" },
                { lastName: "" },
            ],
        });
        console.log(`Migration complete. ${studentsWithoutNames.length} students still missing names.`);
        return studentsWithoutNames.length === 0;
    }
    catch (error) {
        console.error("Migration failed:", error);
        return false;
    }
});
exports.migrateStudentNames = migrateStudentNames;
// If running this script directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/schoolms");
        const success = yield (0, exports.migrateStudentNames)();
        yield mongoose_1.default.disconnect();
        process.exit(success ? 0 : 1);
    }))();
}
