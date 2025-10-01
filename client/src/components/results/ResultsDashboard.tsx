"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  GraduationCap,
  FileSpreadsheet,
  Download,
  Upload,
  Eye,
  EyeOff,
  ChevronRight,
  Home,
  BookOpen,
  RefreshCw,
  Users,
  Loader2,
} from "lucide-react";
import { useTermsQuery } from "@/hooks/useTermsQuery";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useTeacherClassroomsQuery } from "@/hooks/useTeacherClassroomsQuery";
import { useResultsStudentsQuery } from "@/hooks/useResultsStudentsQuery";
import { useResultsManagementStore } from "@/store/resultsManagementStore";
import {
  generateClassResultsPDF,
  generateClassBroadsheetPDF,
  generateStudentResultPDF,
  StudentResult,
} from "@/lib/utils";
import {
  usePublishResults,
  useResultsPublicationStatus,
} from "@/hooks/useResults";
import { Student } from "@/hooks/useResultsStudentsQuery";
import { useTeacherResultsStudentsQuery } from "@/hooks/useTeacherResultsStudentsQuery";
import { useQueryClient } from "@tanstack/react-query";
import ResultsStudentTable from "./ResultsStudentTable";
import StudentResultModal from "./StudentResultModal";
import ExcelBulkUpload from "./ExcelBulkUpload";

interface ResultsDashboardProps {
  mode?: "admin" | "teacher";
}

export default function ResultsDashboard({
  mode = "admin",
}: ResultsDashboardProps) {
  const {
    selectedSession,
    selectedTerm,
    selectedClass,
    setSelectedSession,
    setSelectedTerm,
    setSelectedClass,
    setEntryModalOpen,
    searchQuery,
    currentPage,
  } = useResultsManagementStore();

  const [showExcelUpload, setShowExcelUpload] = useState(false);

  // Publish results hooks
  const publishResultsMutation = usePublishResults();
  const [isPublishing, setIsPublishing] = useState(false);
  const { data: publicationStatus, isLoading: publicationStatusLoading } =
    useResultsPublicationStatus(
      selectedClass,
      selectedTerm,
      parseInt(selectedSession?.split("/")[0] || "0")
    );

  const isPublished = (publicationStatus as any)?.published ?? false;

  const { data: terms, isLoading: termsLoading } = useTermsQuery();

  // Use different classroom logic based on mode
  const { data: teacherClassrooms, isLoading: teacherClassroomsLoading } =
    useTeacherClassroomsQuery();
  const { data: adminClassrooms, isLoading: adminClassroomsLoading } =
    useClassroomsQuery();

  // Filter data based on mode
  const classrooms = mode === "teacher" ? teacherClassrooms : adminClassrooms;
  const classroomsLoading =
    mode === "teacher" ? teacherClassroomsLoading : adminClassroomsLoading;

  // Generate session options (current year and next year)
  const currentYear = new Date().getFullYear();
  const sessions = [
    {
      value: `${currentYear}/${currentYear + 1}`,
      label: `${currentYear}/${currentYear + 1}`,
    },
    {
      value: `${currentYear - 1}/${currentYear}`,
      label: `${currentYear - 1}/${currentYear}`,
    },
  ];

  const handleEnterResults = (studentId: string) => {
    setEntryModalOpen(true, studentId);
  };

  // PDF Export handlers
  const handleExportClassPDF = () => {
    if (!studentsResponse?.students || !selectedClassroom) return;

    // Mock result data for PDF generation
    const studentsWithResults: StudentResult[] = studentsResponse.students.map(
      (student) => ({
        studentId: student.studentId,
        fullName: `${student.firstName} ${student.lastName}`,
        scores: [], // In real implementation, this would be fetched with actual results
        comment: "",
      })
    );

    generateClassResultsPDF(
      studentsWithResults,
      selectedTerm,
      selectedSession,
      selectedClassroom.name
    );
  };

  const handleExportBroadsheetPDF = () => {
    if (!studentsResponse?.students || !selectedClassroom) return;

    // Mock result data for PDF generation
    const studentsWithResults: StudentResult[] = studentsResponse.students.map(
      (student) => ({
        studentId: student.studentId,
        fullName: `${student.firstName} ${student.lastName}`,
        scores: [], // In real implementation, this would be fetched with actual results
        comment: "",
      })
    );

    generateClassBroadsheetPDF(
      studentsWithResults,
      selectedTerm,
      selectedSession,
      selectedClassroom.name
    );
  };

  // Publish/Unpublish handler
  const handlePublishResults = async () => {
    if (!selectedClass || !selectedTerm || !selectedSession) return;

    setIsPublishing(true);
    try {
      const shouldPublish = !isPublished;
      await publishResultsMutation(
        selectedClass,
        selectedTerm,
        parseInt(selectedSession.split("/")[0]),
        shouldPublish
      );
      // FIXME: The publication status query should invalidate here
      // Real implementation would show toast notifications
      const message = `Results ${
        shouldPublish ? "published" : "unpublished"
      } successfully for ${
        selectedClassroom?.name
      } - ${selectedTerm} ${selectedSession}!`;
      console.log(message); // In production, use toast notifications
    } catch (error) {
      console.error("Error publishing results:", error);
      alert("Failed to publish results. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  // All classrooms are available (can be filtered by term later if needed)
  const availableClassrooms = classrooms || [];

  // Query students for results when all selections are made
  const shouldFetchStudents = selectedSession && selectedTerm && selectedClass;
  const adminStudentsQuery = useResultsStudentsQuery(
    selectedSession,
    selectedTerm,
    selectedClass,
    searchQuery,
    currentPage,
    { enabled: !!shouldFetchStudents && mode === "admin" }
  );

  const teacherStudentsQuery = useTeacherResultsStudentsQuery(
    selectedSession,
    selectedTerm,
    selectedClass,
    searchQuery,
    currentPage,
    { enabled: !!shouldFetchStudents && mode === "teacher" }
  );

  const {
    data: studentsResponse,
    isLoading: studentsLoading,
    error: studentsError,
  } = mode === "teacher" ? teacherStudentsQuery : adminStudentsQuery;

  // Reset selections when terms/classrooms load
  useEffect(() => {
    if (terms && terms.length > 0 && !selectedTerm) {
      const activeTerm = terms.find((term) => term.isActive);
      if (activeTerm) {
        setSelectedTerm(activeTerm.name);
      }
    }
  }, [terms, selectedTerm, setSelectedTerm]);

  const handleOpenResults = () => {
    if (!selectedSession || !selectedTerm || !selectedClass) {
      return;
    }
    // The student table will automatically load when selections are complete
  };

  const isSelectionComplete = selectedSession && selectedTerm && selectedClass;

  // Get selected classroom data
  const selectedClassroom = availableClassrooms.find(
    (c) => c._id === selectedClass
  );

  // Breadcrumb items based on selections
  interface BreadcrumbItem {
    label: string;
    icon?: React.ReactElement;
    href?: string;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Results", icon: <Home className="h-4 w-4" />, href: "#" },
  ];

  if (isSelectionComplete) {
    breadcrumbs.push(
      {
        label: selectedClassroom?.name || "Class",
        icon: <BookOpen className="h-4 w-4" />,
        href: "#",
      },
      {
        label: `${selectedSession} ${selectedTerm} Term`,
        href: "#",
      }
    );
  }

  return (
    <div className="space-y-6" role="main" aria-labelledby="page-title">
      <header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Quick Stats */}
          {/* <div className="flex items-center gap-4 text-sm">
            {isSelectionComplete && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  aria-hidden="true"
                ></div>
                <span className="text-green-700 font-medium">Live Session</span>
              </div>
            )}
          </div> */}
        </div>
      </header>

      {/* Simplified Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Academic Period</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select term and academic session to manage class results
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Selection */}
            <div className="space-y-2">
              <Label htmlFor="session">Academic Session</Label>
              <select
                id="session"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Session</option>
                {sessions.map((session) => (
                  <option key={session.value} value={session.value}>
                    {session.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Selection */}
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <select
                id="term"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={termsLoading}
              >
                <option value="">
                  {termsLoading ? "Loading..." : "Select Term"}
                </option>
                {terms?.map((term) => (
                  <option key={term._id} value={term.name}>
                    {term.name} Term
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-set class selection to first available when in classroom context */}
          {!selectedClass && availableClassrooms.length > 0 && selectedTerm && (
            <div className="space-y-2">
              <Label htmlFor="class">Working Class Context</Label>
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Class Context: {availableClassrooms[0].name}
                  </p>
                  <p className="text-xs text-green-600">
                    Working within classroom results management
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSelectedClass(availableClassrooms[0]._id)}
                  className="ml-auto bg-green-600 hover:bg-green-700"
                >
                  Use This Class
                </Button>
              </div>
            </div>
          )}

          {/* Selection Status */}
          {isSelectionComplete && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">Context:</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-300"
                  >
                    {selectedSession}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-300"
                  >
                    {selectedTerm} Term
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    {selectedClassroom?.name}
                  </Badge>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  View Results
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Column Layout: Table + Actions */}
      {isSelectionComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Results Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle>Student Results</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {studentsResponse?.pagination?.total || 0} students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : studentsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2">
                      Error Loading Students
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Please try refreshing the page or contact support.
                    </p>
                  </div>
                ) : (
                  <ResultsStudentTable
                    students={studentsResponse?.students || []}
                    pagination={studentsResponse?.pagination}
                    onEnterResults={handleEnterResults}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Action Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject Summary */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Subject Allocation Summary
                  </Label>
                  <div className="text-sm text-gray-600">
                    <p>• Mathematics: Completed</p>
                    <p>• English: In Progress</p>
                    <p>• Science: Not Started</p>
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowExcelUpload(!showExcelUpload)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {showExcelUpload ? "Hide" : "Show"} Excel Tools
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleExportClassPDF}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Class PDF
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleExportBroadsheetPDF}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Broadsheet PDF
                  </Button>

                  <Button
                    className="w-full"
                    variant={isPublished ? "destructive" : "default"}
                    onClick={handlePublishResults}
                    disabled={isPublishing || publicationStatusLoading}
                  >
                    {publicationStatusLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : isPublished ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {isPublishing
                      ? "Publishing..."
                      : isPublished
                      ? "Unpublish Results"
                      : "Publish Results"}
                  </Button>
                </div>

                <Separator />

                {/* Status Indicators */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Result Status
                  </Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>12 students pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>8 partially complete</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>15 completed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Excel Bulk Upload (when expanded) */}
            {showExcelUpload && (
              <ExcelBulkUpload
                classroomId={selectedClass}
                classroomName={
                  availableClassrooms.find((c) => c._id === selectedClass)
                    ?.name || "Unknown Class"
                }
                onUploadSuccess={() => {
                  // Refresh the students list after successful upload
                  // This will be handled by the query invalidation in the hook
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Instructions when no selection */}
      {!isSelectionComplete && (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              Select Session, Term, and Class
            </h3>
            <p className="text-muted-foreground">
              Choose an academic session, term, and class above to start
              managing student results.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Result Entry Modal */}
      {isSelectionComplete && studentsResponse?.students && (
        <StudentResultModal
          students={studentsResponse.students}
          selectedSession={selectedSession}
          selectedTerm={selectedTerm}
          selectedClass={selectedClass}
        />
      )}
    </div>
  );
}
