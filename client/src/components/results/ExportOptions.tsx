import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useGradingScales } from "@/hooks/useGradingScales";

interface StudentResult {
  studentId: string;
  fullName: string;
  scores: {
    subject: string;
    totalScore: number;
    grade?: string;
  }[];
  comment?: string;
}

interface ExportOptionsProps {
  students: StudentResult[];
  session: string;
  term: string;
  className: string;
  onSuccess?: () => void;
}

export default function ExportOptions({
  students,
  session,
  term,
  className,
  onSuccess,
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<{
    type: string;
    status: "success" | "error";
    message: string;
  } | null>(null);

  const { data: gradingScales = [] } = useGradingScales();

  const handleExportCSV = async () => {
    if (students.length === 0) return;

    setIsExporting("csv");
    try {
      // Create CSV content
      const headers = [
        "Student ID",
        "Student Name",
        "Subject",
        "Score",
        "Grade",
        "Term",
        "Session",
        "Class",
      ];
      const rows: string[][] = [];

      students.forEach((student) => {
        student.scores.forEach((score) => {
          rows.push([
            student.studentId,
            student.fullName,
            score.subject,
            score.totalScore.toString(),
            score.grade || "",
            term,
            session,
            className,
          ]);
        });
      });

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${className}_${term}_${session}_results.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus({
        type: "CSV",
        status: "success",
        message: "CSV export completed successfully",
      });
    } catch (error) {
      console.error("CSV export error:", error);
      setExportStatus({
        type: "CSV",
        status: "error",
        message: "Failed to export CSV",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (students.length === 0) return;

    setIsExporting("excel");
    try {
      // For now, we'll create a simple Excel-like format
      // In a real implementation, you'd use a library like xlsx or exceljs
      const headers = [
        "Student ID",
        "Student Name",
        "Subject",
        "Score",
        "Grade",
        "Term",
        "Session",
        "Class",
      ];
      const rows: string[][] = [];

      students.forEach((student) => {
        student.scores.forEach((score) => {
          rows.push([
            student.studentId,
            student.fullName,
            score.subject,
            score.totalScore.toString(),
            score.grade || "",
            term,
            session,
            className,
          ]);
        });
      });

      // Create tab-separated values (TSV) as Excel can import this
      const tsvContent = [headers, ...rows]
        .map((row) => row.join("\t"))
        .join("\n");

      const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${className}_${term}_${session}_results.xls`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus({
        type: "Excel",
        status: "success",
        message: "Excel export completed successfully",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      setExportStatus({
        type: "Excel",
        status: "error",
        message: "Failed to export Excel file",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJSON = async () => {
    if (students.length === 0) return;

    setIsExporting("json");
    try {
      const exportData = {
        metadata: {
          className,
          session,
          term,
          exportDate: new Date().toISOString(),
          totalStudents: students.length,
        },
        students: students.map((student) => ({
          studentId: student.studentId,
          fullName: student.fullName,
          results: student.scores.map((score) => ({
            subject: score.subject,
            score: score.totalScore,
            grade: score.grade,
          })),
          comment: student.comment,
        })),
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${className}_${term}_${session}_results.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus({
        type: "JSON",
        status: "success",
        message: "JSON export completed successfully",
      });
    } catch (error) {
      console.error("JSON export error:", error);
      setExportStatus({
        type: "JSON",
        status: "error",
        message: "Failed to export JSON",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      id: "csv",
      label: "Export as CSV",
      description: "Comma-separated values for spreadsheet applications",
      icon: FileSpreadsheet,
      extension: ".csv",
      handler: handleExportCSV,
    },
    {
      id: "excel",
      label: "Export as Excel",
      description: "Tab-separated values compatible with Excel",
      icon: FileSpreadsheet,
      extension: ".xls",
      handler: handleExportExcel,
    },
    {
      id: "json",
      label: "Export as JSON",
      description: "Structured data format for developers",
      icon: FileText,
      extension: ".json",
      handler: handleExportJSON,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Options
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Download class results in various formats for analysis and reporting
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">
              {students.length} students • {session} • {term}
            </span>
          </div>
          <Badge variant="outline">{gradingScales.length} grade scales</Badge>
        </div>

        {/* Export Options */}
        <div className="grid gap-3">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = isExporting === option.id;

            return (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{option.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={option.handler}
                  disabled={isLoading || students.length === 0}
                  size="sm"
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export{option.extension}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              exportStatus.status === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {exportStatus.status === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">
              {exportStatus.type}: {exportStatus.message}
            </span>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p className="font-medium text-blue-900 mb-1">Export Information:</p>
          <ul className="space-y-1 text-blue-800">
            <li>
              • CSV files can be opened in Excel, Google Sheets, or any
              spreadsheet application
            </li>
            <li>
              • Excel files are exported as TSV format for maximum compatibility
            </li>
            <li>• JSON files contain structured data for programmatic use</li>
            <li>
              • All exports include student details, scores, grades, and
              metadata
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
