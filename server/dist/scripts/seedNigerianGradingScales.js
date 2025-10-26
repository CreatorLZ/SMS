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
const GradingScale_1 = __importDefault(require("../models/GradingScale"));
const nigerianGradingScales = [
    // Primary School Grading Scale (A-F)
    { min: 70, max: 100, grade: "A", remark: "Excellent" },
    { min: 60, max: 69, grade: "B", remark: "Very Good" },
    { min: 50, max: 59, grade: "C", remark: "Good" },
    { min: 45, max: 49, grade: "D", remark: "Pass" },
    { min: 40, max: 44, grade: "E", remark: "Fair" },
    { min: 0, max: 39, grade: "F", remark: "Fail" },
    // Secondary School Grading Scale (A1-F9)
    { min: 75, max: 100, grade: "A1", remark: "Excellent" },
    { min: 70, max: 74, grade: "B2", remark: "Very Good" },
    { min: 65, max: 69, grade: "B3", remark: "Good" },
    { min: 60, max: 64, grade: "C4", remark: "Credit" },
    { min: 55, max: 59, grade: "C5", remark: "Credit" },
    { min: 50, max: 54, grade: "C6", remark: "Credit" },
    { min: 45, max: 49, grade: "D7", remark: "Pass" },
    { min: 40, max: 44, grade: "E8", remark: "Pass" },
    { min: 0, max: 39, grade: "F9", remark: "Fail" },
];
function seedNigerianGradingScales() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🌱 Seeding Nigerian grading scales...");
            // Clear existing grading scales
            yield GradingScale_1.default.deleteMany({});
            console.log("🗑️  Cleared existing grading scales");
            // Insert new grading scales
            const insertedScales = yield GradingScale_1.default.insertMany(nigerianGradingScales);
            console.log(`✅ Successfully seeded ${insertedScales.length} grading scales`);
            // Display the seeded scales
            console.log("\n📊 Seeded Grading Scales:");
            console.log("Primary School (A-F):");
            insertedScales.slice(0, 6).forEach((scale) => {
                console.log(`  ${scale.grade}: ${scale.min}-${scale.max}% (${scale.remark})`);
            });
            console.log("\nSecondary School (A1-F9):");
            insertedScales.slice(6).forEach((scale) => {
                console.log(`  ${scale.grade}: ${scale.min}-${scale.max}% (${scale.remark})`);
            });
            console.log("\n🎉 Nigerian grading scales seeding completed!");
        }
        catch (error) {
            console.error("❌ Error seeding Nigerian grading scales:", error);
            throw error;
        }
    });
}
// Run if called directly
if (require.main === module) {
    // Load environment variables
    require("dotenv").config();
    mongoose_1.default
        .connect(process.env.MONGODB_URI)
        .then(() => {
        console.log("📡 Connected to MongoDB");
        return seedNigerianGradingScales();
    })
        .then(() => {
        console.log("🏁 Seeding process completed");
        process.exit(0);
    })
        .catch((error) => {
        console.error("💥 Seeding failed:", error);
        process.exit(1);
    });
}
exports.default = seedNigerianGradingScales;
