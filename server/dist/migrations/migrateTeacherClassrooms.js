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
exports.migrateTeacherClassrooms = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
// Load environment variables
dotenv_1.default.config();
/**
 * Migration script to migrate existing assignedClassId to assignedClasses array
 * This enables teachers to have multiple classroom assignments
 */
const migrateTeacherClassrooms = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting teacher classroom assignment migration...");
        // Find all teachers with assignedClassId but empty assignedClasses
        const teachersToMigrate = yield User_1.User.find({
            role: "teacher",
            assignedClassId: { $exists: true, $ne: null },
            $or: [
                { assignedClasses: { $exists: false } },
                { assignedClasses: { $size: 0 } },
            ],
        });
        console.log(`Found ${teachersToMigrate.length} teachers to migrate`);
        for (const teacher of teachersToMigrate) {
            if (teacher.assignedClassId) {
                // Migrate single assignedClassId to assignedClasses array
                yield User_1.User.findByIdAndUpdate(teacher._id, {
                    assignedClasses: [teacher.assignedClassId],
                });
                console.log(`Migrated teacher ${teacher.name}: ${teacher.assignedClassId} -> assignedClasses array`);
            }
        }
        // Verify migration - count teachers with old vs new structure
        const teachersWithOldStructure = yield User_1.User.countDocuments({
            role: "teacher",
            assignedClassId: { $exists: true, $ne: null },
            $and: [
                { assignedClasses: { $exists: true } },
                { assignedClasses: { $size: 0 } },
            ],
        });
        const teachersWithNewStructure = yield User_1.User.countDocuments({
            role: "teacher",
            assignedClasses: { $exists: true, $not: { $size: 0 } },
        });
        console.log(`Migration stats:`);
        console.log(`- Teachers still needing migration: ${teachersWithOldStructure}`);
        console.log(`- Teachers with migrated structure: ${teachersWithNewStructure}`);
        console.log("Teacher classroom migration complete.");
        return teachersWithOldStructure === 0;
    }
    catch (error) {
        console.error("Migration failed:", error);
        return false;
    }
});
exports.migrateTeacherClassrooms = migrateTeacherClassrooms;
// If running this script directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const dbUrl = process.env.MONGODB_URI ||
            process.env.DATABASE_URL ||
            "mongodb://localhost:27017/schoolms";
        yield mongoose_1.default.connect(dbUrl);
        console.log(`Connected to MongoDB at ${dbUrl}`);
        const success = yield (0, exports.migrateTeacherClassrooms)();
        yield mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(success ? 0 : 1);
    }))();
}
