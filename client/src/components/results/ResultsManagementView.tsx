import React, { useState } from "react";
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
} from "lucide-react";
import { useResultsManagementStore } from "../../store/resultsManagementStore";
import { useTeacherClassroomsQuery } from "../../hooks/useTeacherClassroomsQuery";
import { useTermsQuery } from "../../hooks/useTermsQuery";
import { useSessionsQuery } from "../../hooks/useSessionsQuery";
import ResultsStudentTable from "./ResultsStudentTable";
import ExcelBulkUpload from "./ExcelBulkUpload";
import { useTeacherResultsStudentsQuery } from "../../hooks/useTeacherResultsStudentsQuery";

interface ResultsManagementViewProps {
  onBack: () => void;
}

const ResultsManagementView: React.FC<ResultsManagementViewProps> = ({
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("enter-results");
  const { selectedClass, selectedSession, selectedTerm } =
    useResultsManagementStore();

  const { data: classrooms } = useTeacherClassroomsQuery();
  const { data: terms } = useTermsQuery();
  const { data: sessions } = useSessionsQuery();

  // Get students for the selected class
  const { data: studentsResponse, isLoading: studentsLoading } =
    useTeacherResultsStudentsQuery(
      selectedSession,
      selectedTerm,
      selectedClass,
      "",
      1,
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
                      // Handle entering results for individual student
                      console.log("Enter results for student:", studentId);
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
                  View and review results that have already been entered
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Results viewing functionality will be implemented here</p>
                </div>
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
    </div>
  );
};

export default ResultsManagementView;
