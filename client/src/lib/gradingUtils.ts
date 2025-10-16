import { GradingScale } from "../hooks/useGradingScales";

export interface GradingResult {
  grade: string;
  remark: string;
  gradePoint?: number;
}

/**
 * Get grade and remark for a given score using Nigerian grading system
 * @param score - The percentage score (0-100)
 * @param gradingScales - Array of grading scales from the server
 * @returns GradingResult object with grade, remark, and optional grade point
 */
export function getGradeFromScore(
  score: number,
  gradingScales: GradingScale[]
): GradingResult {
  // Find the grading scale that matches the score
  const matchingScale = gradingScales.find(
    (scale) => score >= scale.min && score <= scale.max
  );

  if (matchingScale) {
    // Calculate grade point for secondary school grades (A1-F9)
    let gradePoint: number | undefined;
    if (matchingScale.grade.match(/^[A-F]\d$/)) {
      // Secondary school grading with grade points
      const gradeMap: Record<string, number> = {
        A1: 5.0,
        B2: 4.0,
        B3: 3.0,
        C4: 2.0,
        C5: 2.0,
        C6: 2.0,
        D7: 1.0,
        E8: 1.0,
        F9: 0.0,
      };
      gradePoint = gradeMap[matchingScale.grade];
    }

    return {
      grade: matchingScale.grade,
      remark: matchingScale.remark,
      gradePoint,
    };
  }

  // Fallback for scores that don't match any scale
  return {
    grade: "N/A",
    remark: "Not Available",
  };
}

/**
 * Get all available grades for display purposes
 * @param gradingScales - Array of grading scales from the server
 * @returns Array of unique grade strings
 */
export function getAvailableGrades(gradingScales: GradingScale[]): string[] {
  return [...new Set(gradingScales.map((scale) => scale.grade))].sort();
}

/**
 * Check if a grade is a passing grade
 * @param grade - The grade to check
 * @returns boolean indicating if the grade is passing
 */
export function isPassingGrade(grade: string): boolean {
  // Primary school: A-E are passing, F is failing
  if (grade.match(/^[A-E]$/)) {
    return grade !== "F";
  }

  // Secondary school: A1-E8 are passing, F9 is failing
  if (grade.match(/^[A-F]\d$/)) {
    return !grade.startsWith("F");
  }

  return false;
}

/**
 * Get color class for grade display
 * @param grade - The grade to get color for
 * @returns Tailwind CSS color class
 */
export function getGradeColorClass(grade: string): string {
  if (grade.startsWith("A")) return "text-green-600 bg-green-50";
  if (grade.startsWith("B")) return "text-blue-600 bg-blue-50";
  if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-50";
  if (grade.startsWith("D")) return "text-orange-600 bg-orange-50";
  if (grade.startsWith("E")) return "text-red-600 bg-red-50";
  if (grade.startsWith("F")) return "text-red-700 bg-red-50";

  return "text-gray-600 bg-gray-50";
}

/**
 * Format grade for display with proper styling
 * @param grade - The grade to format
 * @returns Formatted grade string
 */
export function formatGrade(grade: string): string {
  if (!grade || grade === "N/A") return "N/A";

  // Add spaces for secondary school grades (A1 -> A 1, B2 -> B 2, etc.)
  if (grade.match(/^[A-F]\d$/)) {
    return grade.charAt(0) + " " + grade.charAt(1);
  }

  return grade;
}

/**
 * Calculate GPA from an array of grade points
 * @param gradePoints - Array of grade points
 * @returns Calculated GPA
 */
export function calculateGPA(gradePoints: (number | undefined)[]): number {
  const validPoints = gradePoints.filter(
    (point): point is number => point !== undefined && point >= 0
  );

  if (validPoints.length === 0) return 0;

  const sum = validPoints.reduce((acc, point) => acc + point, 0);
  return Math.round((sum / validPoints.length) * 100) / 100; // Round to 2 decimal places
}
