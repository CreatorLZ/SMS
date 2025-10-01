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
const seedSubjects_1 = require("../utils/seedSubjects");
// Load environment variables
dotenv_1.default.config();
const runSeed = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
        yield mongoose_1.default.connect(mongoUri);
        console.log("📊 Connected to MongoDB");
        // Seed subjects
        yield (0, seedSubjects_1.seedSubjects)();
        console.log("✅ Subjects seeded successfully!");
        console.log("🎓 60+ Nigerian curriculum subjects added to database");
        // Close connection
        yield mongoose_1.default.connection.close();
        console.log("🔌 Database connection closed");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error seeding subjects:", error.message);
        process.exit(1);
    }
});
// Handle process termination
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\n🛑 Received SIGINT, closing database connection...");
    yield mongoose_1.default.connection.close();
    process.exit(0);
}));
runSeed();
