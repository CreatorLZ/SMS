import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useStudentResults } from "@/hooks/useResults";
import { generateStudentResultPDF } from "@/lib/utils";
import { useGradingScales } from "@/hooks/useGradingScales";

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
}

interface BulkPDFGeneratorProps {
  students: Student[];
  session: string;
  term: string;
  className: string;
  onSuccess?: () => void;
}

export default function BulkPDFGenerator({
  students,
  session,
  term,
  className,
  onSuccess,
}: BulkPDFGeneratorProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    studentName: string;
  } | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: gradingScales = [] } = useGradingScales();

  // We'll fetch results individually when generating PDFs

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s._id)));
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleGeneratePDFs = async () => {
    if (selectedStudents.size === 0) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: selectedStudents.size, studentName: "" });
    setCompleted([]);
    setErrors([]);

    const selectedStudentsList = students.filter((s) =>
      selectedStudents.has(s._id)
    );

    for (let i = 0; i < selectedStudentsList.length; i++) {
      const student = selectedStudentsList[i];
      setProgress({
        current: i + 1,
        total: selectedStudentsList.length,
        studentName:
          student.fullName || `${student.firstName} ${student.lastName}`,
      });

      try {
        // Fetch student's results dynamically
        const { data: studentResultsData } = useStudentResults(student._id);

        if (studentResultsData && studentResultsData.length > 0) {
          // Find the result for the current session and term
          const currentResult = studentResultsData.find(
            (result: any) =>
              result.term === term &&
              result.year === parseInt(session.split("/")[0])
          );

          if (currentResult) {
            // Generate PDF for this student - adapt the result format
            const adaptedResult = {
              studentId: student.studentId,
              fullName:
                student.fullName || `${student.firstName} ${student.lastName}`,
              scores: currentResult.scores || [],
              comment: currentResult.comment || "",
            };
            generateStudentResultPDF(
              adaptedResult,
              term,
              session,
              className,
              gradingScales
            );
            setCompleted((prev) => [
              ...prev,
              student.fullName || `${student.firstName} ${student.lastName}`,
            ]);
          } else {
            setErrors((prev) => [
              ...prev,
              `${
                student.fullName || `${student.firstName} ${student.lastName}`
              }: No results found for ${term} ${session}`,
            ]);
          }
        } else {
          setErrors((prev) => [
            ...prev,
            `${
              student.fullName || `${student.firstName} ${student.lastName}`
            }: No results data available`,
          ]);
        }

        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error generating PDF for ${student.fullName}:`, error);
        setErrors((prev) => [
          ...prev,
          `${
            student.fullName || `${student.firstName} ${student.lastName}`
          }: Failed to generate PDF`,
        ]);
      }
    }

    setProgress(null);
    setIsGenerating(false);
    onSuccess?.();
  };

  const totalSelected = selectedStudents.size;
  const hasResults = true; // We'll check this dynamically

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bulk PDF Generation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate individual result PDFs for multiple students at once
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {totalSelected} of {students.length} students selected
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={students.length === 0}
          >
            {selectedStudents.size === students.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>

        {/* Student Selection */}
        <div className="max-h-60 overflow-y-auto border rounded-lg">
          {students.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No students available
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    id={`student-${student._id}`}
                    checked={selectedStudents.has(student._id)}
                    onChange={() => handleStudentToggle(student._id)}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor={`student-${student._id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {student.fullName ||
                            `${student.firstName} ${student.lastName}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {student.studentId}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {hasResults ? "Has Results" : "No Results"}
                      </Badge>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating PDFs...</span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Processing: {progress.studentName}
            </p>
          </div>
        )}

        {/* Results Summary */}
        {(completed.length > 0 || errors.length > 0) && (
          <div className="space-y-2">
            {completed.length > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  {completed.length} PDFs generated successfully
                </span>
              </div>
            )}
            {errors.length > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.length} errors occurred</span>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGeneratePDFs}
          disabled={isGenerating || totalSelected === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating PDFs...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate {totalSelected} PDF{totalSelected !== 1 ? "s" : ""}
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p className="font-medium text-blue-900 mb-1">Instructions:</p>
          <ul className="space-y-1 text-blue-800">
            <li>• Select the students you want to generate PDFs for</li>
            <li>• Each student will get their own PDF file</li>
            <li>• PDFs will download automatically to your browser</li>
            <li>• Only students with results will generate valid PDFs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
