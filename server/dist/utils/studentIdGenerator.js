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
exports.generateSuggestedStudentId = exports.isStudentIdAvailable = exports.previewNextStudentId = exports.validateStudentIdFormat = exports.generateStudentId = void 0;
const Student_1 = require("../models/Student");
/**
 * Generates a unique student ID based on class and sequential numbering
 * Format: {ClassPrefix}{Year}{SequentialNumber}
 * Example: JSS1250001, SSS3250002
 */
const generateStudentId = (currentClass_1, ...args_1) => __awaiter(void 0, [currentClass_1, ...args_1], void 0, function* (currentClass, config = {}) {
    const { includeYear = true, yearDigits = 2, sequencePadding = 4 } = config;
    // Extract class prefix - handle new subdivided format
    let classPrefix;
    if (currentClass.includes("SCIENCE")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "S";
    }
    else if (currentClass.includes("COMMERCIAL")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "C";
    }
    else if (currentClass.includes("ART")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "A";
    }
    else {
        // Fallback for old format (remove numbers and spaces)
        classPrefix = currentClass.replace(/[\d\s]/g, "").toUpperCase();
    }
    // Get current year (last N digits)
    const currentYear = includeYear
        ? new Date().getFullYear().toString().slice(-yearDigits)
        : "";
    // Build the base pattern for this class/year
    const basePattern = `^${classPrefix}${currentYear}`;
    try {
        // Find the highest existing student ID for this class/year
        const lastStudent = yield Student_1.Student.findOne({
            studentId: new RegExp(basePattern),
        }).sort({ studentId: -1 });
        let nextSequence = 1;
        if (lastStudent) {
            // Extract the sequence number from the last student ID
            const sequencePart = lastStudent.studentId.slice(classPrefix.length + currentYear.length);
            const lastSequence = parseInt(sequencePart, 10);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }
        // Format the sequence number with padding
        const formattedSequence = nextSequence
            .toString()
            .padStart(sequencePadding, "0");
        return `${classPrefix}${currentYear}${formattedSequence}`;
    }
    catch (error) {
        console.error("Error generating student ID:", error);
        // Fallback to a timestamp-based ID if database query fails
        const timestamp = Date.now().toString().slice(-6);
        return `${classPrefix}${currentYear}${timestamp}`;
    }
});
exports.generateStudentId = generateStudentId;
/**
 * Validates if a student ID follows the expected format
 */
const validateStudentIdFormat = (studentId) => {
    // Basic validation: should contain letters followed by numbers
    const pattern = /^[A-Z]+(?:\d+)?\d+$/;
    return pattern.test(studentId);
};
exports.validateStudentIdFormat = validateStudentIdFormat;
/**
 * Generates a preview of what the next student ID would look like
 */
const previewNextStudentId = (currentClass) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract class prefix - handle new subdivided format
    let classPrefix;
    if (currentClass.includes("SCIENCE")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "S";
    }
    else if (currentClass.includes("COMMERCIAL")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "C";
    }
    else if (currentClass.includes("ART")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "A";
    }
    else {
        // Fallback for old format (remove numbers and spaces)
        classPrefix = currentClass.replace(/[\d\s]/g, "").toUpperCase();
    }
    const currentYear = new Date().getFullYear().toString().slice(-2);
    try {
        const basePattern = `^${classPrefix}${currentYear}`;
        const lastStudent = yield Student_1.Student.findOne({
            studentId: new RegExp(basePattern),
        }).sort({ studentId: -1 });
        let nextSequence = 1;
        if (lastStudent) {
            const sequencePart = lastStudent.studentId.slice(classPrefix.length + currentYear.length);
            const lastSequence = parseInt(sequencePart, 10);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }
        const formattedSequence = nextSequence.toString().padStart(4, "0");
        return `${classPrefix}${currentYear}${formattedSequence}`;
    }
    catch (error) {
        // Return a preview format if database query fails
        return `${classPrefix}${currentYear}XXXX`;
    }
});
exports.previewNextStudentId = previewNextStudentId;
/**
 * Checks if a student ID is available (not already taken)
 */
const isStudentIdAvailable = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingStudent = yield Student_1.Student.findOne({ studentId });
        return !existingStudent;
    }
    catch (error) {
        console.error("Error checking student ID availability:", error);
        return false;
    }
});
exports.isStudentIdAvailable = isStudentIdAvailable;
/**
 * Generates a suggested student ID for preview purposes
 */
const generateSuggestedStudentId = (currentClass) => {
    // Extract class prefix - handle new subdivided format
    let classPrefix;
    if (currentClass.includes("SCIENCE")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "S";
    }
    else if (currentClass.includes("COMMERCIAL")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "C";
    }
    else if (currentClass.includes("ART")) {
        classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "A";
    }
    else {
        // Fallback for old format (remove numbers and spaces)
        classPrefix = currentClass.replace(/[\d\s]/g, "").toUpperCase();
    }
    const currentYear = new Date().getFullYear().toString().slice(-2);
    return `${classPrefix}${currentYear}XXXX`; // XXXX will be replaced with actual sequence
};
exports.generateSuggestedStudentId = generateSuggestedStudentId;
