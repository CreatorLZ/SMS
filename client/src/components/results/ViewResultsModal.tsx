import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { StudentResult } from "@/hooks/useResults";
import jsPDF from "jspdf";

interface ViewResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  results: StudentResult[];
  session: string;
  term: string;
  className: string;
}

export default function ViewResultsModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  results,
  session,
  term,
  className,
}: ViewResultsModalProps) {
  // Find the result for the current session and term
  const currentResult = results.find(
    (result) =>
      result.term === term && result.year === parseInt(session.split("/")[0])
  );

  const handleDownloadPDF = () => {
    if (!currentResult) return;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Student Results Report", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Student Info
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Student Name: ${studentName}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Student ID: ${studentId}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Class: ${className}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Session: ${session}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Term: ${term}`, 20, yPosition);
      yPosition += 15;

      // Results Table
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Subject Scores", 20, yPosition);
      yPosition += 10;

      // Table headers
      const headers = ["Subject", "CA1", "CA2", "Exam", "Total", "Grade"];
      const columnWidths = [60, 20, 20, 20, 25, 25];
      let xPosition = 20;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      yPosition += 5;

      // Table rows
      pdf.setFont("helvetica", "normal");
      currentResult.scores.forEach((score) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        xPosition = 20;
        const grade =
          score.totalScore >= 70
            ? "A"
            : score.totalScore >= 60
            ? "B"
            : score.totalScore >= 50
            ? "C"
            : score.totalScore >= 45
            ? "D"
            : "F";

        const rowData = [
          score.subject,
          score.assessments.ca1.toString(),
          score.assessments.ca2.toString(),
          score.assessments.exam.toString(),
          score.totalScore.toString(),
          grade,
        ];

        rowData.forEach((data, index) => {
          pdf.text(data, xPosition, yPosition);
          xPosition += columnWidths[index];
        });

        yPosition += 8;
      });

      // Comments
      if (currentResult.comment) {
        yPosition += 10;
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text("Teacher's Comment:", 20, yPosition);
        yPosition += 8;

        pdf.setFont("helvetica", "normal");
        const commentLines = pdf.splitTextToSize(
          currentResult.comment,
          pageWidth - 40
        );
        pdf.text(commentLines, 20, yPosition);
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Generated on ${new Date().toLocaleDateString()}`,
          20,
          pageHeight - 10
        );
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      }

      pdf.save(
        `${studentName.replace(/\s+/g, "_")}_Results_${term}_${session}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Student Results - {studentName}
            </h2>
            <div className="flex gap-4 text-sm text-gray-600 mt-1">
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                ID: {studentId}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                Class: {className}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                Session: {session}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                Term: {term}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {currentResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="modal-content-for-pdf p-6 space-y-6 bg-white">
          {!currentResult ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found for the selected session and term.
            </div>
          ) : (
            <>
              {/* Subject Scores */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Subject Scores
                  </h3>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700 text-sm">
                          Subject
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          CA1
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          CA2
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          Exam
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          Total
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResult.scores.map((score, index) => (
                        <tr
                          key={score.subject}
                          className={
                            index !== currentResult.scores.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          }
                        >
                          <td className="py-3 px-2 text-gray-700 text-sm font-medium">
                            {score.subject}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm">
                            {score.assessments.ca1}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm">
                            {score.assessments.ca2}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm">
                            {score.assessments.exam}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm font-semibold">
                            {score.totalScore}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge
                              variant={
                                score.totalScore >= 70
                                  ? "default"
                                  : score.totalScore >= 60
                                  ? "secondary"
                                  : score.totalScore >= 50
                                  ? "outline"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {score.totalScore >= 70
                                ? "A"
                                : score.totalScore >= 60
                                ? "B"
                                : score.totalScore >= 50
                                ? "C"
                                : score.totalScore >= 45
                                ? "D"
                                : "F"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comments */}
              {currentResult.comment && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Teacher's Comment
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {currentResult.comment}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
