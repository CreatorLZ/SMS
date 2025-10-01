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
dotenv_1.default.config();
const resetSubjects = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
        yield mongoose_1.default.connect(mongoUri);
        console.log("📊 Connected to MongoDB");
        // Check if subjects collection exists
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error("Database connection not established");
        }
        const collections = yield db.listCollections().toArray();
        const subjectsCollection = collections.find((col) => col.name === "subjects");
        if (subjectsCollection) {
            // Drop the subjects collection
            yield db.dropCollection("subjects");
            console.log("🗑️  Dropped subjects collection");
        }
        else {
            console.log("ℹ️  Subjects collection doesn't exist, nothing to drop");
        }
        yield mongoose_1.default.connection.close();
        console.log("🔌 Database connection closed");
        console.log("✅ Database reset complete");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error resetting database:", error.message);
        process.exit(1);
    }
});
// Handle process termination
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\n🛑 Received SIGINT, closing database connection...");
    yield mongoose_1.default.connection.close();
    process.exit(0);
}));
resetSubjects();
