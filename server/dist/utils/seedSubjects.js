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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSubjects = void 0;
const Subject_1 = require("../models/Subject");
const subjects = [
    // PRIMARY 1–3
    { name: "Mathematics", category: "Core", level: "Primary" },
    {
        name: "Nigerian Language (Hausa/Yoruba/Igbo)",
        category: "Humanities",
        level: "Primary",
    },
    { name: "Basic Science", category: "Science", level: "Primary" },
    {
        name: "Physical & Health Education",
        category: "Science",
        level: "Primary",
    },
    {
        name: "Christian Religious Studies",
        category: "Humanities",
        level: "Primary",
    },
    { name: "Islamic Studies", category: "Humanities", level: "Primary" },
    { name: "Nigerian History", category: "Humanities", level: "Primary" },
    {
        name: "Social & Citizenship Studies",
        category: "Humanities",
        level: "Primary",
    },
    {
        name: "Cultural & Creative Arts (CCA)",
        category: "Humanities",
        level: "Primary",
    },
    { name: "Arabic Language", category: "Optional", level: "Primary" },
    // PRIMARY 4–6
    { name: "English Studies", category: "Core", level: "Primary" },
    { name: "Basic Science & Technology", category: "Science", level: "Primary" },
    { name: "Basic Digital Literacy", category: "Core", level: "Primary" },
    { name: "Pre-vocational Studies", category: "Business", level: "Primary" },
    { name: "French", category: "Optional", level: "Primary" },
    // JUNIOR SECONDARY SCHOOL
    { name: "English Studies", category: "Core", level: "Junior Secondary" },
    { name: "Mathematics", category: "Core", level: "Junior Secondary" },
    {
        name: "Nigerian Language (Hausa/Yoruba/Igbo)",
        category: "Humanities",
        level: "Junior Secondary",
    },
    {
        name: "Intermediate Science",
        category: "Science",
        level: "Junior Secondary",
    },
    {
        name: "Physical & Health Education",
        category: "Science",
        level: "Junior Secondary",
    },
    { name: "Digital Technologies", category: "Core", level: "Junior Secondary" },
    {
        name: "Christian Religious Studies",
        category: "Humanities",
        level: "Junior Secondary",
    },
    {
        name: "Islamic Studies",
        category: "Humanities",
        level: "Junior Secondary",
    },
    {
        name: "Nigerian History",
        category: "Humanities",
        level: "Junior Secondary",
    },
    {
        name: "Social & Citizenship Studies",
        category: "Humanities",
        level: "Junior Secondary",
    },
    {
        name: "Cultural & Creative Arts (CCA)",
        category: "Humanities",
        level: "Junior Secondary",
    },
    {
        name: "Trade: Solar PV Installation",
        category: "Trade",
        level: "Junior Secondary",
    },
    {
        name: "Trade: Fashion Design & Garment Making",
        category: "Trade",
        level: "Junior Secondary",
    },
    {
        name: "Trade: Livestock Farming",
        category: "Trade",
        level: "Junior Secondary",
    },
    {
        name: "Trade: Beauty & Cosmetology",
        category: "Trade",
        level: "Junior Secondary",
    },
    {
        name: "Trade: Computer Hardware & GSM Repairs",
        category: "Trade",
        level: "Junior Secondary",
    },
    {
        name: "Trade: Horticulture & Crop Production",
        category: "Trade",
        level: "Junior Secondary",
    },
    { name: "French", category: "Optional", level: "Junior Secondary" },
    { name: "Arabic Language", category: "Optional", level: "Junior Secondary" },
    // SENIOR SECONDARY SCHOOL
    { name: "English Language", category: "Core", level: "Senior Secondary" },
    { name: "General Mathematics", category: "Core", level: "Senior Secondary" },
    {
        name: "Citizenship & Heritage Studies",
        category: "Core",
        level: "Senior Secondary",
    },
    { name: "Digital Technologies", category: "Core", level: "Senior Secondary" },
    { name: "Biology", category: "Science", level: "Senior Secondary" },
    { name: "Chemistry", category: "Science", level: "Senior Secondary" },
    { name: "Physics", category: "Science", level: "Senior Secondary" },
    { name: "Agriculture", category: "Science", level: "Senior Secondary" },
    {
        name: "Further Mathematics",
        category: "Science",
        level: "Senior Secondary",
    },
    {
        name: "Physical Education",
        category: "Science",
        level: "Senior Secondary",
    },
    { name: "Health Education", category: "Science", level: "Senior Secondary" },
    { name: "Food & Nutrition", category: "Science", level: "Senior Secondary" },
    { name: "Geography", category: "Science", level: "Senior Secondary" },
    { name: "Technical Drawing", category: "Science", level: "Senior Secondary" },
    {
        name: "Nigerian History",
        category: "Humanities",
        level: "Senior Secondary",
    },
    { name: "Government", category: "Humanities", level: "Senior Secondary" },
    {
        name: "Christian Religious Studies",
        category: "Humanities",
        level: "Senior Secondary",
    },
    {
        name: "Islamic Studies",
        category: "Humanities",
        level: "Senior Secondary",
    },
    {
        name: "Nigerian Language (Hausa/Igbo/Yoruba)",
        category: "Humanities",
        level: "Senior Secondary",
    },
    { name: "French", category: "Optional", level: "Senior Secondary" },
    { name: "Arabic Language", category: "Optional", level: "Senior Secondary" },
    { name: "Visual Arts", category: "Humanities", level: "Senior Secondary" },
    { name: "Music", category: "Humanities", level: "Senior Secondary" },
    {
        name: "English Literature",
        category: "Humanities",
        level: "Senior Secondary",
    },
    {
        name: "Home Management",
        category: "Humanities",
        level: "Senior Secondary",
    },
    { name: "Catering Craft", category: "Humanities", level: "Senior Secondary" },
    { name: "Accounting", category: "Business", level: "Senior Secondary" },
    { name: "Commerce", category: "Business", level: "Senior Secondary" },
    { name: "Marketing", category: "Business", level: "Senior Secondary" },
    { name: "Economics", category: "Business", level: "Senior Secondary" },
    {
        name: "Trade: Solar PV Installation",
        category: "Trade",
        level: "Senior Secondary",
    },
    {
        name: "Trade: Fashion Design & Garment Making",
        category: "Trade",
        level: "Senior Secondary",
    },
    {
        name: "Trade: Livestock Farming",
        category: "Trade",
        level: "Senior Secondary",
    },
    {
        name: "Trade: Beauty & Cosmetology",
        category: "Trade",
        level: "Senior Secondary",
    },
    {
        name: "Trade: Computer Hardware & GSM Repairs",
        category: "Trade",
        level: "Senior Secondary",
    },
    {
        name: "Trade: Horticulture & Crop Production",
        category: "Trade",
        level: "Senior Secondary",
    },
];
const seedSubjects = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🌱 Seeding ${subjects.length} subjects...`);
        // Insert with better error handling
        let insertedCount = 0;
        let skippedCount = 0;
        for (const subject of subjects) {
            try {
                yield Subject_1.Subject.create(subject);
                insertedCount++;
            }
            catch (error) {
                if (error.code === 11000) {
                    // Duplicate key error - skip this subject
                    skippedCount++;
                }
                else {
                    // Re-throw other errors
                    throw error;
                }
            }
        }
        console.log(`✅ Successfully inserted ${insertedCount} subjects`);
        if (skippedCount > 0) {
            console.log(`⚠️  Skipped ${skippedCount} duplicate subjects`);
        }
        // Get final count
        const totalCount = yield Subject_1.Subject.countDocuments();
        console.log(`📊 Total subjects in database: ${totalCount}`);
    }
    catch (error) {
        console.error("❌ Error seeding subjects:", error.message);
        // If it's a duplicate key error, show more helpful message
        if (error.code === 11000) {
            console.log("💡 Tip: Run 'npm run reset:subjects' first to clear existing data");
        }
        throw error; // Re-throw to be handled by caller
    }
});
exports.seedSubjects = seedSubjects;
