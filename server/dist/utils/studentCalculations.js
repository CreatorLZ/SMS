"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAttendance = exports.calculateGPA = void 0;
const schoolDays_1 = require("./schoolDays");
/**
 * Calculate GPA for a student based on their results
 * @param student - Student object with results array
 * @returns GPA as a number (0 if no valid results)
 */
const calculateGPA = (student) => {
    if (!student.results || student.results.length === 0)
        return 0;
    let validResultsCount = 0;
    const totalScore = student.results.reduce((sum, result) => {
        if (result.scores && result.scores.length > 0) {
            const subjectAverage = result.scores.reduce((subjectSum, score) => {
                return subjectSum + score.totalScore;
            }, 0) / result.scores.length;
            validResultsCount++;
            return sum + subjectAverage;
        }
        else {
            console.warn(`Student ${student._id}: Result for term ${result.term} year ${result.year} has empty scores array`);
            return sum; // Skip this result, treat as 0
        }
    }, 0);
    return validResultsCount > 0 ? totalScore / validResultsCount : 0;
};
exports.calculateGPA = calculateGPA;
/**
 * Calculate attendance percentage for a student
 * @param student - Student object with classroomId
 * @param activeTerm - Active term object with startDate, endDate, holidays
 * @param attendanceMap - Map of attendance records keyed by classroomId-date
 * @param includeBreakdown - Whether to include detailed breakdown (present/absent/late counts)
 * @returns Object with percentage and optional breakdown
 */
const calculateAttendance = (student, activeTerm, attendanceMap, includeBreakdown = false) => {
    if (!student.classroomId || !activeTerm) {
        return includeBreakdown
            ? {
                percentage: 0,
                breakdown: { present: 0, absent: 0, late: 0, total: 0 },
            }
            : { percentage: 0 };
    }
    const schoolDays = (0, schoolDays_1.calculateSchoolDays)(activeTerm.startDate, activeTerm.endDate, activeTerm.holidays);
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    const classroomId = student.classroomId.toString();
    const studentId = student._id.toString();
    // Iterate through all dates in the term
    for (let d = new Date(activeTerm.startDate); d <= activeTerm.endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = `${classroomId}-${d.toISOString().split("T")[0]}`;
        const dayRecords = attendanceMap.get(dateKey) || [];
        for (const record of dayRecords) {
            const studentRecord = record.records.find((r) => r.studentId.toString() === studentId);
            if (studentRecord) {
                if (studentRecord.status === "present")
                    presentDays++;
                else if (studentRecord.status === "absent")
                    absentDays++;
                else if (studentRecord.status === "late")
                    lateDays++;
                break; // Found attendance for this day, move to next day
            }
        }
    }
    const percentage = schoolDays > 0 ? (presentDays / schoolDays) * 100 : 0;
    if (includeBreakdown) {
        return {
            percentage,
            breakdown: {
                present: presentDays,
                absent: absentDays,
                late: lateDays,
                total: schoolDays,
            },
        };
    }
    return { percentage };
};
exports.calculateAttendance = calculateAttendance;
