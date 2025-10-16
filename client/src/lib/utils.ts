import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { GradingScale } from "../hooks/useGradingScales";
import { getGradeFromScore, formatGrade } from "./gradingUtils";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StudentResult {
  studentId: string;
  fullName: string;
  scores: {
    subject: string;
    assessments: {
      ca1: number;
      ca2: number;
      exam: number;
    };
    totalScore: number;
    grade?: string;
    remark?: string;
  }[];
  comment?: string;
}

// Generate individual student result PDF
export function generateStudentResultPDF(
  student: StudentResult,
  term: string,
  session: string,
  className: string,
  gradingScales: GradingScale[] = []
) {
  const doc = new jsPDF();

  // Add school header
  doc.setFontSize(20);
  doc.text("Treasure Land Academy", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("Student Result Slip", 105, 35, { align: "center" });

  doc.setFontSize(12);
  doc.text(`${term} - ${session}`, 105, 50, { align: "center" });

  // Student info
  doc.setFontSize(10);
  doc.text(`Student Name: ${student.fullName}`, 20, 70);
  doc.text(`Student ID: ${student.studentId}`, 20, 80);
  doc.text(`Class: ${className}`, 20, 90);

  // Results table
  const tableData = student.scores.map((score) => {
    const gradeResult = getGradeFromScore(score.totalScore, gradingScales);
    return [
      score.subject,
      `${score.assessments.ca1}`,
      `${score.assessments.ca2}`,
      `${score.assessments.exam}`,
      `${score.totalScore}/100`,
      formatGrade(gradeResult.grade),
    ];
  });

  doc.autoTable({
    head: [["Subject", "CA1 (20)", "CA2 (20)", "Exam (60)", "Total", "Grade"]],
    body: tableData,
    startY: 100,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Comments section
  if (student.comment) {
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.text("Teacher Comments:", 20, finalY);
    doc.setFontSize(8);
    const commentLines = doc.splitTextToSize(student.comment, 170);
    doc.text(commentLines, 20, finalY + 10);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    20,
    pageHeight - 20
  );

  // Save and download
  doc.save(`${student.studentId}_${term}_result.pdf`);
}

// Generate class broadsheet PDF
export function generateClassBroadsheetPDF(
  students: StudentResult[],
  term: string,
  session: string,
  className: string,
  gradingScales: GradingScale[] = []
) {
  const doc = new jsPDF("landscape");

  // Add school header
  doc.setFontSize(16);
  doc.text("Treasure Land Academy - Class Broadsheet", 105, 20, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text(`${className} - ${term} ${session}`, 105, 35, { align: "center" });

  // Build table data
  const tableHeaders = ["Student ID", "Student Name"];

  // Get all unique subjects
  const allSubjects = new Set<string>();
  students.forEach((student) => {
    student.scores.forEach((score) => allSubjects.add(score.subject));
  });

  // Add subject columns for totals
  Array.from(allSubjects).forEach((subject) => {
    tableHeaders.push(subject);
  });
  tableHeaders.push("Overall Average");

  // Build table body
  const tableBody = students.map((student) => {
    const row = [student.studentId, student.fullName];

    // Add subject scores
    Array.from(allSubjects).forEach((subject) => {
      const subjectScore = student.scores.find((s) => s.subject === subject);
      row.push(subjectScore ? `${subjectScore.totalScore}` : "N/A");
    });

    // Calculate overall average
    const validScores = student.scores.filter((s) => s.totalScore > 0);
    const average =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((sum, s) => sum + s.totalScore, 0) /
              validScores.length
          )
        : 0;
    row.push(`${average}`);

    return row;
  });

  doc.autoTable({
    head: [tableHeaders],
    body: tableBody,
    startY: 50,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Student ID column wider
      1: { cellWidth: 50 }, // Student Name column wider
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    20,
    pageHeight - 20
  );
  doc.text(`Total Students: ${students.length}`, 150, pageHeight - 20);

  // Save and download
  doc.save(`${className}_${term}_broadsheet.pdf`);
}

// Generate consolidated class PDF
export function generateClassResultsPDF(
  students: StudentResult[],
  term: string,
  session: string,
  className: string,
  gradingScales: GradingScale[] = []
) {
  const doc = new jsPDF();

  // Add school header
  doc.setFontSize(18);
  doc.text("Treasure Land Academy", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("Class Results Summary", 105, 35, { align: "center" });

  doc.setFontSize(12);
  doc.text(`${className} - ${term} ${session}`, 105, 50, { align: "center" });

  let currentY = 70;

  // Process each student
  students.forEach((student, index) => {
    if (index > 0 && currentY > 200) {
      doc.addPage();
      currentY = 30;
    }

    // Student header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Student: ${student.fullName} (${student.studentId})`,
      20,
      currentY
    );
    currentY += 10;

    // Student results table
    const studentTableData = student.scores.map((score) => {
      const gradeResult = getGradeFromScore(score.totalScore, gradingScales);
      return [
        score.subject,
        `${score.totalScore}/100`,
        formatGrade(gradeResult.grade),
      ];
    });

    doc.autoTable({
      head: [["Subject", "Total Score", "Grade"]],
      body: studentTableData,
      startY: currentY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      margin: { left: 20 },
      tableWidth: 170,
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Add some space between students
    currentY += 10;
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    20,
    pageHeight - 20
  );
  doc.text(`Total Students: ${students.length}`, 150, pageHeight - 20);

  // Save and download
  doc.save(`${className}_${term}_class_results.pdf`);
}
