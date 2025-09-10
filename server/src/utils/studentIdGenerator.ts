import { Student } from "../models/Student";

export interface StudentIdConfig {
  includeYear?: boolean;
  yearDigits?: number;
  sequencePadding?: number;
}

/**
 * Generates a unique student ID based on class and sequential numbering
 * Format: {ClassPrefix}{Year}{SequentialNumber}
 * Example: JSS1250001, SSS3250002
 */
export const generateStudentId = async (
  currentClass: string,
  config: StudentIdConfig = {}
): Promise<string> => {
  const { includeYear = true, yearDigits = 2, sequencePadding = 4 } = config;

  // Extract class prefix - handle new subdivided format
  let classPrefix: string;
  if (currentClass.includes("SCIENCE")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "S";
  } else if (currentClass.includes("COMMERCIAL")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "C";
  } else if (currentClass.includes("ART")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "A";
  } else {
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
    const lastStudent = await Student.findOne({
      studentId: new RegExp(basePattern),
    }).sort({ studentId: -1 });

    let nextSequence = 1;

    if (lastStudent) {
      // Extract the sequence number from the last student ID
      const sequencePart = lastStudent.studentId.slice(
        classPrefix.length + currentYear.length
      );
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
  } catch (error) {
    console.error("Error generating student ID:", error);
    // Fallback to a timestamp-based ID if database query fails
    const timestamp = Date.now().toString().slice(-6);
    return `${classPrefix}${currentYear}${timestamp}`;
  }
};

/**
 * Validates if a student ID follows the expected format
 */
export const validateStudentIdFormat = (studentId: string): boolean => {
  // Basic validation: should contain letters followed by numbers
  const pattern = /^[A-Z]+(?:\d+)?\d+$/;
  return pattern.test(studentId);
};

/**
 * Generates a preview of what the next student ID would look like
 */
export const previewNextStudentId = async (
  currentClass: string
): Promise<string> => {
  // Extract class prefix - handle new subdivided format
  let classPrefix: string;
  if (currentClass.includes("SCIENCE")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "S";
  } else if (currentClass.includes("COMMERCIAL")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "C";
  } else if (currentClass.includes("ART")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "A";
  } else {
    // Fallback for old format (remove numbers and spaces)
    classPrefix = currentClass.replace(/[\d\s]/g, "").toUpperCase();
  }
  const currentYear = new Date().getFullYear().toString().slice(-2);

  try {
    const basePattern = `^${classPrefix}${currentYear}`;
    const lastStudent = await Student.findOne({
      studentId: new RegExp(basePattern),
    }).sort({ studentId: -1 });

    let nextSequence = 1;

    if (lastStudent) {
      const sequencePart = lastStudent.studentId.slice(
        classPrefix.length + currentYear.length
      );
      const lastSequence = parseInt(sequencePart, 10);

      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }

    const formattedSequence = nextSequence.toString().padStart(4, "0");

    return `${classPrefix}${currentYear}${formattedSequence}`;
  } catch (error) {
    // Return a preview format if database query fails
    return `${classPrefix}${currentYear}XXXX`;
  }
};

/**
 * Checks if a student ID is available (not already taken)
 */
export const isStudentIdAvailable = async (
  studentId: string
): Promise<boolean> => {
  try {
    const existingStudent = await Student.findOne({ studentId });
    return !existingStudent;
  } catch (error) {
    console.error("Error checking student ID availability:", error);
    return false;
  }
};

/**
 * Generates a suggested student ID for preview purposes
 */
export const generateSuggestedStudentId = (currentClass: string): string => {
  // Extract class prefix - handle new subdivided format
  let classPrefix: string;
  if (currentClass.includes("SCIENCE")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "S";
  } else if (currentClass.includes("COMMERCIAL")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "C";
  } else if (currentClass.includes("ART")) {
    classPrefix = currentClass.replace(/\s+.*$/, "").toUpperCase() + "A";
  } else {
    // Fallback for old format (remove numbers and spaces)
    classPrefix = currentClass.replace(/[\d\s]/g, "").toUpperCase();
  }
  const currentYear = new Date().getFullYear().toString().slice(-2);
  return `${classPrefix}${currentYear}XXXX`; // XXXX will be replaced with actual sequence
};
