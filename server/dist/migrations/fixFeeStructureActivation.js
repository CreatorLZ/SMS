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
const FeeStructure_1 = require("../models/FeeStructure");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const runMigration = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        console.log("Starting fee structure activation migration...");
        // Get all fee structures
        const feeStructures = yield FeeStructure_1.FeeStructure.find({}).populate("termId", "isActive");
        console.log(`Found ${feeStructures.length} fee structures`);
        let updatedCount = 0;
        let errorCount = 0;
        for (const feeStructure of feeStructures) {
            const term = feeStructure.termId;
            try {
                if (!term) {
                    console.warn(`Fee structure ${feeStructure._id} has no associated term`);
                    errorCount++;
                    continue;
                }
                const shouldBeActive = term.isActive;
                const isCurrentlyActive = feeStructure.isActive;
                if (shouldBeActive !== isCurrentlyActive) {
                    feeStructure.isActive = shouldBeActive;
                    yield feeStructure.save();
                    updatedCount++;
                    const termDetails = `${term.name} ${term.year}`;
                    console.log(`Updated fee structure for classroom ${feeStructure.classroomId} - ${termDetails}: active=${shouldBeActive}`);
                }
            }
            catch (error) {
                console.error(`Error updating fee structure ${feeStructure._id}:`, error.message);
                errorCount++;
            }
        }
        console.log(`Migration completed: ${updatedCount} fee structures updated, ${errorCount} errors`);
        if (errorCount > 0) {
            console.warn("Some fee structures could not be updated. Please check manually.");
        }
        else {
            console.log("All fee structures are now correctly aligned with term activation status.");
        }
        yield mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error("Migration failed", error);
        process.exit(1);
    }
});
runMigration();
