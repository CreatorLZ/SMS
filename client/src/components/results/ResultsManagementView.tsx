import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Upload,
  Eye,
  Download,
  Table,
  Edit,
} from "lucide-react";
import ViewResultsModal from "./ViewResultsModal";
import { useResultsManagementStore } from "../../store/resultsManagementStore";
import { useTeacherClassroomsQuery } from "../../hooks/useTeacherClassroomsQuery";
import { useTermsQuery } from "../../hooks/useTermsQuery";
import { useSessionsQuery } from "../../hooks/useSessionsQuery";
import { useStudentResults } from "../../hooks/useResults";
import ResultsStudentTable from "./ResultsStudentTable";
import ExcelBulkUpload from "./ExcelBulkUpload";
import {
  useTeacherResultsStudentsQuery,
  useTeacherResultsStudentsWithResultsQuery,
  useTeacherResultsStudentsWithoutResultsQuery,
} from "../../hooks/useTeacherResultsStudentsQuery";

interface ResultsManagementViewProps {
  onBack: () => void;
}

const ResultsManagementView: React.FC<ResultsManagementViewProps> = ({
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("enter-results");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState<{
    id: string;
    name: string;
    results: any[];
  } | null>(null);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const router = useRouter();
  const { selectedClass, selectedSession, selectedTerm } =
    useResultsManagementStore();

  // Extract year from session (e.g., "2024/2025" -> 2024)
  const sessionYear = selectedSession
    ? parseInt(selectedSession.split("/")[0])
    : new Date().getFullYear();

  const { data: studentResults } = useStudentResults(viewingStudentId || "");

  // Update the selected student results when they load
  React.useEffect(() => {
    if (studentResults && selectedStudentForView && viewingStudentId) {
      setSelectedStudentForView((prev) =>
        prev
          ? {
              ...prev,
              results: Array.isArray(studentResults)
                ? studentResults
                : [studentResults],
            }
          : null
      );
    }
  }, [studentResults, viewingStudentId]); // Removed selectedStudentForView from dependencies

  const { data: classrooms } = useTeacherClassroomsQuery();
  const { data: terms } = useTermsQuery();
  const { data: sessions } = useSessionsQuery();

  // Get students for the selected class who don't have results yet
  const { data: studentsResponse, isLoading: studentsLoading } =
    useTeacherResultsStudentsWithoutResultsQuery(
      selectedSession,
      selectedTerm,
      selectedClass,
      "",
      1,
      sessionYear,
      { enabled: !!selectedClass && !!selectedSession && !!selectedTerm }
    );

  // Get students with results for the selected class/session/term
  const {
    data: studentsWithResultsResponse,
    isLoading: studentsWithResultsLoading,
  } = useTeacherResultsStudentsWithResultsQuery(
    selectedSession,
    selectedTerm,
    selectedClass,
    "",
    1,
    sessionYear,
    { enabled: !!selectedClass && !!selectedSession && !!selectedTerm }
  );

  // Debug logging for selectedClass
  console.log(
    "ResultsManagementView - selectedClass:",
    selectedClass,
    typeof selectedClass
  );
  console.log("ResultsManagementView - selectedSession:", selectedSession);
  console.log("ResultsManagementView - selectedTerm:", selectedTerm);

  const selectedClassroom = classrooms?.find((c) => c._id === selectedClass);
  const selectedTermData = terms?.find((t) => t.name === selectedTerm);
  const selectedSessionData = sessions?.find((s) => s.name === selectedSession);

  const handleViewResults = (studentId: string) => {
    // Find the student details
    const student = studentsWithResultsResponse?.students.find(
      (s) => s._id === studentId
    );

    if (student) {
      setViewingStudentId(studentId);
      setSelectedStudentForView({
        id: student.studentId,
        name: student.fullName || `${student.firstName} ${student.lastName}`,
        results: [], // Will be updated when studentResults loads
      });
      setViewModalOpen(true);
    }
  };

  const tabs = [
    { value: "enter-results", label: "Enter Results", icon: FileText },
    { value: "upload-results", label: "Upload Results", icon: Upload },
    { value: "view-results", label: "View Results", icon: Eye },
    { value: "download-results", label: "Download Results", icon: Download },
    { value: "download-broadsheet", label: "Download Broadsheet", icon: Table },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      {/* <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Generator</span>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Results Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage academic results for your assigned classes
            </p>
          </div>
        </div>
      </div> */}

      {/* Selected Context Display */}
      <Card>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {selectedClassroom?.name || "Unknown Class"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Academic Session
              </p>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {selectedSession}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Term</p>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {selectedTerm} Term
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="w-full">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "enter-results" && (
            <Card>
              <CardHeader>
                <CardTitle>Enter Student Results</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter results for students who haven't had their results
                  recorded yet
                </p>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      Loading students...
                    </div>
                  </div>
                ) : studentsResponse?.students ? (
                  <ResultsStudentTable
                    students={studentsResponse.students}
                    pagination={studentsResponse.pagination}
                    onEnterResults={(studentId) => {
                      // Navigate to the enter results page
                      router.push(
                        `/teacher/results/enter/${studentId}?classId=${selectedClass}&session=${selectedSession}&term=${selectedTerm}`
                      );
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No students found for the selected criteria
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "upload-results" && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Results from Excel</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Bulk upload student results using an Excel template
                </p>
              </CardHeader>
              <CardContent>
                {selectedClassroom && (
                  <ExcelBulkUpload
                    classroomId={selectedClass}
                    classroomName={selectedClassroom.name}
                    onUploadSuccess={() => {
                      // Handle successful upload
                      console.log("Results uploaded successfully");
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "view-results" && (
            <Card>
              <CardHeader>
                <CardTitle>View Entered Results</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View and edit results that have already been entered
                </p>
              </CardHeader>
              <CardContent>
                {studentsWithResultsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      Loading students with results...
                    </div>
                  </div>
                ) : studentsWithResultsResponse?.students ? (
                  <ResultsStudentTable
                    students={studentsWithResultsResponse.students}
                    pagination={studentsWithResultsResponse.pagination}
                    actions={[
                      {
                        text: "View Results",
                        icon: Eye,
                        onClick: handleViewResults,
                        variant: "outline",
                      },
                      {
                        text: "Edit Results",
                        icon: Edit,
                        onClick: (studentId) => {
                          // Navigate to the enter results page for editing
                          router.push(
                            `/teacher/results/enter/${studentId}?classId=${selectedClass}&session=${selectedSession}&term=${selectedTerm}`
                          );
                        },
                        variant: "default",
                      },
                    ]}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>
                      No students with entered results found for the selected
                      criteria
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "download-results" && (
            <Card>
              <CardHeader>
                <CardTitle>Download Class Results</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download individual student result sheets
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Download functionality will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "download-broadsheet" && (
            <Card>
              <CardHeader>
                <CardTitle>Download Broadsheet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download comprehensive class broadsheet with all results
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Table className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>
                    Broadsheet download functionality will be implemented here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* View Results Modal */}
      {selectedStudentForView && (
        <ViewResultsModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedStudentForView(null);
            setViewingStudentId(null);
          }}
          studentName={selectedStudentForView.name}
          studentId={selectedStudentForView.id}
          results={selectedStudentForView.results}
          session={selectedSession}
          term={selectedTerm}
          className={selectedClassroom?.name || ""}
        />
      )}
    </div>
  );
};

export default ResultsManagementView;
