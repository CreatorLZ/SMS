"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { useToast } from "./use-toast";
import {
  GraduationCap,
  X,
  Save,
  AlertCircle,
  Edit3,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { useSubmitResult } from "../../hooks/useResults";
import { useClassroomSubjectsQuery } from "../../hooks/useClassroomSubjectsQuery";
import { useGradingScales, GradingScale } from "../../hooks/useGradingScales";

interface Student {
  _id: string;
  fullName: string;
  studentId: string;
}

interface ResultsMarkerProps {
  classroomId: string;
  students: Student[];
  selectedTerm?: string;
  selectedYear?: number;
  onSave?: () => void;
  onCancel?: () => void;
}

interface SubjectScore {
  subject: string;
  assessments: {
    ca1: number;
    ca2: number;
    exam: number;
  };
  totalScore: number;
}

interface StudentResults {
  [studentId: string]: {
    scores: SubjectScore[];
    comment: string;
  };
}

export default function ResultsMarker({
  classroomId,
  students,
  selectedTerm: propSelectedTerm,
  selectedYear: propSelectedYear,
  onSave,
  onCancel,
}: ResultsMarkerProps) {
  const { toast } = useToast();
  const submitResult = useSubmitResult();

  const { data: classroomSubjects, isLoading: subjectsLoading } =
    useClassroomSubjectsQuery(classroomId);

  const { data: gradingScales } = useGradingScales();

  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [results, setResults] = useState<StudentResults>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [studentId: string]: {
      [subjectName: string]: {
        ca1?: string;
        ca2?: string;
        exam?: string;
        total?: string;
      };
    };
  }>({});
  const [originalResults, setOriginalResults] = useState<StudentResults>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  // Terms options
  const terms = [
    { value: "First Term", label: "First Term" },
    { value: "Second Term", label: "Second Term" },
    { value: "Third Term", label: "Third Term" },
  ];

  // Memoize available subjects to create stable dependency
  const availableSubjects = useMemo(() => {
    return classroomSubjects?.subjects || [];
  }, [classroomSubjects?.subjects]);

  // Create stable initial results structure
  const initialResults = useMemo(() => {
    const results: StudentResults = {};
    students.forEach((student) => {
      results[student._id] = {
        scores: availableSubjects.map((subject) => ({
          subject: subject.name,
          assessments: {
            ca1: 0,
            ca2: 0,
            exam: 0,
          },
          totalScore: 0,
        })),
        comment: "",
      };
    });
    return results;
  }, [students, availableSubjects]);

  useEffect(() => {
    setResults(initialResults);
    setOriginalResults(JSON.parse(JSON.stringify(initialResults))); // Deep copy
    // Clear validation errors when results are reset
    setValidationErrors({});
    setHasUnsavedChanges(false);
  }, [initialResults]);

  // Grade conversion function using grading scales
  const convertScoreToGrade = (score: number): GradingScale | null => {
    if (!gradingScales) return null;

    return (
      gradingScales.find((scale) => score >= scale.min && score <= scale.max) ||
      null
    );
  };

  // Get color class for grade display
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800 border-green-200";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "D":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "E":
        return "bg-red-100 text-red-800 border-red-200";
      case "F":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const updateStudentAssessment = (
    studentId: string,
    subjectName: string,
    assessmentType: "ca1" | "ca2" | "exam",
    value: number
  ) => {
    setResults((prev) => {
      const newResults = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          scores: prev[studentId].scores.map((s) =>
            s.subject === subjectName
              ? (() => {
                  const newAssessments = {
                    ...s.assessments,
                    [assessmentType]: value,
                  };
                  const totalScore =
                    newAssessments.ca1 +
                    newAssessments.ca2 +
                    newAssessments.exam;
                  return { ...s, assessments: newAssessments, totalScore };
                })()
              : s
          ),
        },
      };

      // Check for unsaved changes
      const hasChanges = checkForUnsavedChanges(newResults);
      setHasUnsavedChanges(hasChanges);

      return newResults;
    });
  };

  // Check if there are unsaved changes
  const checkForUnsavedChanges = (currentResults: StudentResults): boolean => {
    return Object.keys(currentResults).some((studentId) => {
      const currentStudent = currentResults[studentId];
      const originalStudent = originalResults[studentId];

      if (!originalStudent) return true; // New student

      // Check scores
      return (
        currentStudent.scores.some((currentScore) => {
          const originalScore = originalStudent.scores.find(
            (s) => s.subject === currentScore.subject
          );
          if (!originalScore) return true; // New subject

          return (
            currentScore.assessments.ca1 !== originalScore.assessments.ca1 ||
            currentScore.assessments.ca2 !== originalScore.assessments.ca2 ||
            currentScore.assessments.exam !== originalScore.assessments.exam
          );
        }) || currentStudent.comment !== originalStudent.comment
      );
    });
  };

  // Reset changes to original state
  const resetChanges = () => {
    setResults(JSON.parse(JSON.stringify(originalResults)));
    setValidationErrors({});
    setHasUnsavedChanges(false);
  };

  // Toggle batch mode
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
  };

  // Handle assessment input change with validation
  const handleAssessmentInputChange = (
    studentId: string,
    subjectName: string,
    assessmentType: "ca1" | "ca2" | "exam",
    inputValue: string,
    maxValue: number
  ) => {
    // Remove any non-numeric characters
    const numericOnly = inputValue.replace(/[^0-9]/g, "");

    // Limit digits based on max value (1-2 digits)
    const maxDigits = maxValue >= 10 ? 2 : 1;
    const limited = numericOnly.slice(0, maxDigits);

    // Convert to number, default to 0 if empty
    const score = limited === "" ? 0 : parseInt(limited, 10);

    // Validate score is within valid range
    let errorMessage = "";
    if (score > maxValue) {
      errorMessage = `Maximum ${maxValue} marks`;
    }

    // Update validation errors
    setValidationErrors((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectName]: {
          ...prev[studentId]?.[subjectName],
          [assessmentType]: errorMessage,
        },
      },
    }));

    // Update the score (clamp to valid range for storage, but show error for UI feedback)
    const validScore = Math.max(0, Math.min(maxValue, score));
    updateStudentAssessment(studentId, subjectName, assessmentType, validScore);

    // Validate total score after update
    validateTotalScore(studentId, subjectName);
  };

  // Validate total score for a subject
  const validateTotalScore = (studentId: string, subjectName: string) => {
    const studentResult = results[studentId];
    if (!studentResult) return;

    const subjectScore = studentResult.scores.find(
      (s) => s.subject === subjectName
    );
    if (!subjectScore) return;

    const totalScore = subjectScore.totalScore;
    const errorMessage =
      totalScore > 100 ? "Total cannot exceed 100 marks" : "";

    setValidationErrors((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectName]: {
          ...prev[studentId]?.[subjectName],
          total: errorMessage,
        },
      },
    }));
  };

  const updateStudentComment = (studentId: string, comment: string) => {
    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  const validateResults = (): boolean => {
    if (!selectedTerm || !selectedYear) {
      toast({
        title: "Validation Error",
        description: "Please select a term and year",
        variant: "destructive",
      });
      return false;
    }

    // Check for validation errors
    const hasValidationErrors = Object.values(validationErrors).some(
      (studentErrors) =>
        Object.values(studentErrors).some((subjectErrors) =>
          Object.values(subjectErrors).some(
            (error) => error && error.trim() !== ""
          )
        )
    );

    if (hasValidationErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before saving",
        variant: "destructive",
      });
      return false;
    }

    // Check if at least one student has results
    const hasValidResults = Object.values(results).some(
      (studentResult) =>
        studentResult.scores.some((score) => score.totalScore > 0) ||
        studentResult.comment.trim() !== ""
    );

    if (!hasValidResults) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one score or comment",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateResults()) return;

    setIsSubmitting(true);
    try {
      // Submit results for each student who has data
      const promises = Object.entries(results)
        .filter(([_, studentResult]) => {
          return (
            studentResult.scores.some((score) => score.totalScore > 0) ||
            studentResult.comment.trim() !== ""
          );
        })
        .map(async ([studentId, studentResult]) => {
          return await submitResult(studentId, {
            term: selectedTerm,
            year: selectedYear,
            scores: studentResult.scores,
            comment: studentResult.comment,
          });
        });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: "Results saved successfully",
      });

      // Update original results to reflect saved state
      setOriginalResults(JSON.parse(JSON.stringify(results)));
      setHasUnsavedChanges(false);

      onSave?.();
    } catch (error: any) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save results",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Submit Student Results</span>
              </CardTitle>
              {/* Change Tracking Indicator */}
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Unsaved Changes</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Batch Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBatchMode}
                className={batchMode ? "bg-blue-50 border-blue-200" : ""}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {batchMode ? "Exit Batch Mode" : "Batch Edit"}
              </Button>
              {/* Reset Changes Button */}
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetChanges}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Term and Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Academic Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="term">Select Term</Label>
              <select
                id="term"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Term</option>
                {terms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="year">Academic Year</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Entry */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter assessment scores for each student and subject. CA1 and CA2
              are each worth 20 marks, while the Exam is worth 60 marks. Total
              scores (0-100) and letter grades are calculated automatically
              based on school grading scales. Students with no scores will be
              skipped.
            </p>
            {/* Grading Scale Legend */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Grade Scale Legend:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded font-semibold">
                  A (70-100: Excellent)
                </span>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded font-semibold">
                  B (60-69: Very Good)
                </span>
                <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 rounded font-semibold">
                  C (50-59: Good)
                </span>
                <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2 py-1 rounded font-semibold">
                  D (45-49: Pass)
                </span>
                <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded font-semibold">
                  E (40-44: Weak Pass)
                </span>
                <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-1 rounded font-semibold">
                  F (0-39: Fail)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subjectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-center">
                  <GraduationCap className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p>Loading subjects...</p>
                </div>
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="text-center py-8 text-yellow-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-semibold">No Subjects Assigned</p>
                <p>Please assign subjects to this classroom first.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {students.map((student) => (
                  <div
                    key={student._id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">
                        {student.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {student.studentId}
                      </p>
                    </div>

                    {/* Subject Scores */}
                    <div className="space-y-4 mb-4">
                      {results[student._id]?.scores.map((score) => {
                        const grade = convertScoreToGrade(score.totalScore);
                        // Check if this subject has changes
                        const originalScore = originalResults[
                          student._id
                        ]?.scores.find((s) => s.subject === score.subject);
                        const hasSubjectChanges =
                          !originalScore ||
                          score.assessments.ca1 !==
                            originalScore.assessments.ca1 ||
                          score.assessments.ca2 !==
                            originalScore.assessments.ca2 ||
                          score.assessments.exam !==
                            originalScore.assessments.exam;

                        return (
                          <div
                            key={score.subject}
                            className={`border rounded-lg p-3 pb-8 ${
                              hasSubjectChanges && hasUnsavedChanges
                                ? "bg-orange-50 border-orange-200"
                                : "bg-white"
                            }`}
                          >
                            <Label className="font-semibold text-base mb-3 flex items-center">
                              {score.subject}
                              {hasSubjectChanges && hasUnsavedChanges && (
                                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                                  Modified
                                </span>
                              )}
                            </Label>

                            {/* Assessment Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              {/* CA1 Input */}
                              <div className="space-y-1">
                                <Label className="text-sm text-gray-600">
                                  CA1 (20)
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    value={
                                      score.assessments.ca1 === 0
                                        ? ""
                                        : score.assessments.ca1.toString()
                                    }
                                    onChange={(e) =>
                                      handleAssessmentInputChange(
                                        student._id,
                                        score.subject,
                                        "ca1",
                                        e.target.value,
                                        20
                                      )
                                    }
                                    placeholder="0"
                                    className={`w-full ${
                                      validationErrors[student._id]?.[
                                        score.subject
                                      ]?.ca1
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : ""
                                    }`}
                                  />
                                  {validationErrors[student._id]?.[
                                    score.subject
                                  ]?.ca1 && (
                                    <div className="absolute -bottom-5 left-0 text-xs text-red-600 font-medium">
                                      {
                                        validationErrors[student._id][
                                          score.subject
                                        ].ca1
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* CA2 Input */}
                              <div className="space-y-1">
                                <Label className="text-sm text-gray-600">
                                  CA2 (20)
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    value={
                                      score.assessments.ca2 === 0
                                        ? ""
                                        : score.assessments.ca2.toString()
                                    }
                                    onChange={(e) =>
                                      handleAssessmentInputChange(
                                        student._id,
                                        score.subject,
                                        "ca2",
                                        e.target.value,
                                        20
                                      )
                                    }
                                    placeholder="0"
                                    className={`w-full ${
                                      validationErrors[student._id]?.[
                                        score.subject
                                      ]?.ca2
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : ""
                                    }`}
                                  />
                                  {validationErrors[student._id]?.[
                                    score.subject
                                  ]?.ca2 && (
                                    <div className="absolute -bottom-5 left-0 text-xs text-red-600 font-medium">
                                      {
                                        validationErrors[student._id][
                                          score.subject
                                        ].ca2
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Exam Input */}
                              <div className="space-y-1">
                                <Label className="text-sm text-gray-600">
                                  Exam (60)
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    value={
                                      score.assessments.exam === 0
                                        ? ""
                                        : score.assessments.exam.toString()
                                    }
                                    onChange={(e) =>
                                      handleAssessmentInputChange(
                                        student._id,
                                        score.subject,
                                        "exam",
                                        e.target.value,
                                        60
                                      )
                                    }
                                    placeholder="0"
                                    className={`w-full ${
                                      validationErrors[student._id]?.[
                                        score.subject
                                      ]?.exam
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : ""
                                    }`}
                                  />
                                  {validationErrors[student._id]?.[
                                    score.subject
                                  ]?.exam && (
                                    <div className="absolute -bottom-5 left-0 text-xs text-red-600 font-medium">
                                      {
                                        validationErrors[student._id][
                                          score.subject
                                        ].exam
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Total and Grade Display */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  Total:
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    validationErrors[student._id]?.[
                                      score.subject
                                    ]?.total
                                      ? "text-red-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {score.totalScore}/100
                                </span>
                                {validationErrors[student._id]?.[score.subject]
                                  ?.total && (
                                  <span className="text-xs text-red-600 font-medium ml-2">
                                    {
                                      validationErrors[student._id][
                                        score.subject
                                      ].total
                                    }
                                  </span>
                                )}
                              </div>

                              {/* Grade Badge */}
                              <div className="flex items-center space-x-2">
                                {grade ? (
                                  <span
                                    className={`px-3 py-1 text-sm font-semibold rounded border ${getGradeColor(
                                      grade.grade
                                    )}`}
                                  >
                                    {grade.grade} ({grade.remark})
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 text-sm text-gray-400 border border-gray-200 rounded">
                                    No grade scaling loaded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <Label htmlFor={`comment-${student._id}`}>
                        Comment (Optional)
                      </Label>
                      <textarea
                        id={`comment-${student._id}`}
                        value={results[student._id]?.comment || ""}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateStudentComment(student._id, e.target.value)
                        }
                        placeholder="Add any comments about this student's performance..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            {/* Batch Mode Indicator */}
            {batchMode && (
              <div className="flex items-center space-x-2 text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Batch Editing Mode</span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-600">
                    (
                    {
                      Object.keys(results).filter((studentId) =>
                        checkForUnsavedChanges({
                          [studentId]: results[studentId],
                        })
                      ).length
                    }{" "}
                    students modified)
                  </span>
                )}
              </div>
            )}
            {!batchMode && hasUnsavedChanges && (
              <div className="flex items-center space-x-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You have unsaved changes
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting || (!batchMode && !hasUnsavedChanges)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <GraduationCap className="h-4 w-4 mr-2 animate-spin" />
                    Saving Results...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {batchMode
                      ? "Save All Changes"
                      : hasUnsavedChanges
                      ? "Save Changes"
                      : "Save Results"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
