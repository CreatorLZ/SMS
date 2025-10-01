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
exports.backfillUserStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
// Migration script to backfill status field for existing users
const backfillUserStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting user status backfill migration...");
        // Connect to MongoDB if not already connected
        if (mongoose_1.default.connection.readyState !== 1) {
            console.log("MongoDB not connected. Please ensure database connection is established.");
            return;
        }
        // Update all users that have null or undefined status to "active"
        const result = yield User_1.User.updateMany({
            $or: [{ status: { $exists: false } }, { status: null }, { status: "" }],
        }, {
            $set: { status: "active" },
        });
        console.log(`Migration completed successfully:`);
        console.log(`- Documents matched: ${result.matchedCount}`);
        console.log(`- Documents modified: ${result.modifiedCount}`);
        if (result.modifiedCount > 0) {
            console.log("✅ Status field successfully backfilled for existing users");
        }
        else {
            console.log("ℹ️  No users needed status backfill (all users already have status set)");
        }
        return result;
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
});
exports.backfillUserStatus = backfillUserStatus;
// Script to run the migration
if (require.main === module) {
    // This allows running the script directly with: npx ts-node src/utils/migration-backfill-status.ts
    console.log("Running user status backfill migration...");
    // Note: You'll need to establish your database connection here
    // For example:
    // await mongoose.connect(process.env.MONGODB_URI!);
    (0, exports.backfillUserStatus)()
        .then(() => {
        console.log("Migration script completed");
        process.exit(0);
    })
        .catch((error) => {
        console.error("Migration script failed:", error);
        process.exit(1);
    });
}
exports.default = exports.backfillUserStatus;
