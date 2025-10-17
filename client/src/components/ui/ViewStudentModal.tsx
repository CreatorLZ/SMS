"use client";
import { useState } from "react";
import { useStudent } from "@/hooks/useStudents";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { useAuthStore } from "@/store/authStore";
import { useStudentResults } from "@/hooks/useResults";
import {
  X,
  Download,
  Edit,
  Users,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  User,
  ChevronRight,
  Terminal,
  Database,
} from "lucide-react";
import jsPDF from "jspdf";

export default function ViewStudentModal() {
  const {
    isViewModalOpen,
    selectedStudentId,
    setViewModalOpen,
    setEditModalOpen,
  } = useStudentManagementStore();

  const { data: completeStudentData, isLoading: isLoadingStudent } = useStudent(
    selectedStudentId || ""
  );
  // These hooks are kept for potential use in other parts of the app, like the PDF generation.
  const { data: users } = useUsersQuery();
  const { data: classroomsResponse } = useClassroomsQuery();

  // Results data - only query when we have a valid studentId
  const { data: studentResults, isLoading: resultsLoading } = useStudentResults(
    selectedStudentId || ""
  );

  // Memoize whether results should be shown (only when studentId is valid)
  const shouldLoadResults =
    selectedStudentId && /^[0-9a-fA-F]{24}$/.test(selectedStudentId);

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("STUDENT");
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );

  const { user } = useAuthStore();

  const getSecurityLevel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "LEVEL-10";
      case "admin":
        return "LEVEL-7";
      case "teacher":
        return "LEVEL-5";
      case "parent":
        return "LEVEL-3";
      case "student":
        return "LEVEL-2";
      default:
        return "LEVEL-1";
    }
  };

  const getDisplayRole = (role: string) => {
    return role?.toUpperCase() || "UNKNOWN";
  };

  const handleEditStudent = () => {
    setViewModalOpen(false);
    setEditModalOpen(true, selectedStudentId);
  };

  const handleDownloadPDF = async () => {
    if (!completeStudentData) return;
    setIsDownloadingPDF(true);
    // PDF generation logic remains unchanged as it's a background process.
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("MY SCHOOL Int'l Schools", pageWidth / 2, 20, {
        align: "center",
      });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.text("Education made easy", pageWidth / 2, 30, { align: "center" });
      pdf.line(20, 35, pageWidth - 20, 35);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      const studentName = completeStudentData.fullName || "N/A";
      const studentId = completeStudentData.studentId || "N/A";
      pdf.text(`${studentName} (${studentId})`, pageWidth / 2, 45, {
        align: "center",
      });

      let yPos = 60;
      // Find the linked parent user for PDF
      const linkedParent = users?.data?.find(
        (user) =>
          user.role === "parent" &&
          user.linkedStudentIds?.some(
            (student) => student._id === completeStudentData._id
          )
      );

      const studentDetails = [
        {
          label: "Firstname",
          value: completeStudentData.fullName?.split(" ")[0] || "N/A",
        },
        {
          label: "Surname",
          value:
            completeStudentData.fullName?.split(" ").slice(1).join(" ") ||
            "N/A",
        },
        { label: "Student Id", value: studentId },
        { label: "Address", value: completeStudentData.address || "N/A" },
        { label: "Class", value: completeStudentData.currentClass || "N/A" },
        { label: "Gender", value: completeStudentData.gender || "N/A" },
        {
          label: "Year Of Admission",
          value: new Date(completeStudentData.admissionDate || Date.now())
            .getFullYear()
            .toString(),
        },
        { label: "State", value: completeStudentData.location || "N/A" },
        { label: "Country", value: "Nigeria" },
        { label: "Email", value: completeStudentData.email || "N/A" },
        {
          label: "Student Phone",
          value: completeStudentData.phoneNumber || "N/A",
        },
        { label: "Student Type", value: "Boarding Student" },
        // Parent Information
        {
          label: "Parent Name",
          value: linkedParent?.name || completeStudentData.parentName || "N/A",
        },
        {
          label: "Parent Phone",
          value:
            linkedParent?.phone || completeStudentData.parentPhone || "N/A",
        },
        {
          label: "Parent Email",
          value:
            linkedParent?.email || completeStudentData.parentEmail || "N/A",
        },
        {
          label: "Relationship",
          value: completeStudentData.relationshipToStudent || "N/A",
        },
        {
          label: "Emergency Contact",
          value: completeStudentData.emergencyContact?.name || "N/A",
        },
        {
          label: "Emergency Phone",
          value:
            completeStudentData.emergencyContact?.phoneNumber ||
            completeStudentData.parentPhone ||
            "N/A",
        },
        {
          label: "Emergency Relationship",
          value: completeStudentData.emergencyContact?.relationship || "N/A",
        },
      ];

      studentDetails.forEach((info) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${info.label}:`, 20, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(info.value, 70, yPos);
        yPos += 10;
      });

      pdf.save(`${studentName.replace(/\s+/g, "_")}_details.pdf`);
    } catch (error) {
      console.error("PDF download error:", error);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (!isViewModalOpen || !selectedStudentId) return null;

  if (isLoadingStudent || !completeStudentData) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
        <div className="w-full max-w-md bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl">
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-pulse text-xs mb-4">
              [LOADING STUDENT DATA...]
            </div>
            <Database className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  // Use new firstName and lastName fields if available, fallback to splitting fullName
  const firstName =
    (completeStudentData as any).firstName ||
    (completeStudentData.fullName
      ? completeStudentData.fullName.split(" ")[0]
      : "N/A");
  const lastName =
    (completeStudentData as any).lastName ||
    (completeStudentData.fullName
      ? completeStudentData.fullName.split(" ").slice(1).join(" ")
      : "N/A");
  const admissionDate =
    completeStudentData.enrollmentDate || completeStudentData.admissionDate;

  const studentDetails = [
    { label: "FIRST NAME", value: firstName || "N/A" },
    { label: "STUDENT ID", value: completeStudentData.studentId || "N/A" },
    { label: "SURNAME", value: lastName || "N/A" },
    { label: "ADDRESS", value: completeStudentData.address || "N/A" },
    { label: "CLASS", value: completeStudentData.currentClass || "N/A" },
    { label: "GENDER", value: completeStudentData.gender || "N/A" },
    {
      label: "YEAR OF ADMISSION",
      value: admissionDate
        ? new Date(admissionDate).getFullYear().toString()
        : "N/A",
    },
    { label: "STATE", value: completeStudentData.location || "N/A" },
    { label: "COUNTRY", value: "NIGERIA" },
    { label: "EMAIL", value: completeStudentData.email || "N/A" },
    { label: "PHONE", value: completeStudentData.phoneNumber || "N/A" },
    { label: "STUDENT TYPE", value: "BOARDING STUDENT" },
  ];

  const linkedParent = users?.data?.find(
    (user) =>
      user.role === "parent" &&
      user.linkedStudentIds?.some(
        (student) => student._id === completeStudentData._id
      )
  );

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      {/* Retro CRT scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(75, 85, 99, 0.1) 2px,
            rgba(75, 85, 99, 0.1) 4px
          )`,
        }}
      />

      {/* Main Terminal Container */}
      <div className="w-full max-w-6xl max-h-[95vh] bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl relative">
        {/* Terminal Header */}
        <div className="border-b-2 border-gray-600 p-2 md:p-4 bg-gray-100/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                <span className="text-xs md:text-sm font-bold">
                  MY SCHOOL INTERNATIONAL SCHOOLS
                </span>
              </div>
              <div className="text-xs">STUDENT RECORD SYSTEM</div>
            </div>
            <div className="flex items-center gap-2 md:gap-6 text-xs">
              <span>TIME: {currentTime}</span>
              <span>USER: {getDisplayRole(user?.role || "")}</span>
              <span>SECURITY: {getSecurityLevel(user?.role || "")}</span>
            </div>
          </div>
        </div>

        {/* Sub Header */}
        <div className="border-b border-gray-600 p-2 md:p-3 bg-gray-100/10 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
            <span>[ACCESSING STUDENT DATABASE...]</span>
            <span>CONNECTION: SECURE | MODE: VIEW</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Photo and Basic Info */}
          <div className="w-full md:w-80 border-r-0 md:border-r-2 border-gray-600 p-4 md:p-6">
            {/* Photo Frame */}
            <div className="border-2 border-gray-600 p-2 mb-6 bg-gray-100/20">
              <div className="text-xs mb-2 text-center">STUDENT PHOTOGRAPH</div>
              <div className="w-full h-48 border border-gray-600 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {completeStudentData.passportPhoto ? (
                  <img
                    src={completeStudentData.passportPhoto}
                    alt="STUDENT PHOTO"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "50% 0%" }}
                  />
                ) : (
                  <div className="text-center text-xs">
                    <div>NO PHOTO</div>
                    <div>AVAILABLE</div>
                  </div>
                )}
                {/* Photo overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-100/20 to-transparent" />
              </div>
            </div>

            {/* Quick Info Panel */}
            <div className="border border-gray-600 p-3 bg-gray-100/10">
              <div className="text-xs mb-3 border-b border-gray-600 pb-1">
                QUICK ACCESS
              </div>
              <div className="space-y-2 text-xs">
                <div>NAME: {completeStudentData.fullName}</div>
                <div>ID: {completeStudentData.studentId}</div>
                <div>CLASS: {completeStudentData.currentClass}</div>
                <div>
                  STATUS:
                  <span
                    className={`ml-2 ${
                      completeStudentData.status === "active"
                        ? "text-green-600 animate-pulse"
                        : "text-red-600"
                    }`}
                  >
                    ● {completeStudentData.status?.toUpperCase() || "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-gray-600 p-2 md:p-4 bg-gray-100/10">
              <div className="flex gap-2 text-xs">
                {["STUDENT", "GUARDIAN", "RESULTS"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 md:px-4 py-2 border border-gray-600 transition-all duration-200 text-xs md:text-sm ${
                      activeTab === tab
                        ? "bg-gray-600 text-white font-bold"
                        : "bg-gray-50 hover:bg-gray-100/20"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
              {activeTab === "STUDENT" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">STUDENT RECORD DATA</div>
                    <div className="text-xs">CLASSIFICATION: CONFIDENTIAL</div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {studentDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row border-b border-gray-600/20 py-2"
                      >
                        <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                          {detail.label}:
                        </div>
                        <div className="flex-1">{detail.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "GUARDIAN" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      GUARDIAN/PARENT RECORDS
                    </div>
                    <div className="text-xs">EMERGENCY CONTACT INFORMATION</div>
                  </div>

                  {linkedParent || completeStudentData.parentName ? (
                    <div className="space-y-6">
                      {/* Primary Guardian */}
                      <div className="border border-gray-600 p-4 bg-gray-100/20">
                        <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                          PRIMARY GUARDIAN
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                              NAME:
                            </div>
                            <div>
                              {linkedParent?.name ||
                                completeStudentData.parentName}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                              RELATIONSHIP:
                            </div>
                            <div>
                              {completeStudentData.relationshipToStudent ||
                                "PARENT"}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                              PHONE:
                            </div>
                            <div>
                              {linkedParent?.phone ||
                                completeStudentData.parentPhone ||
                                "N/A"}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                              EMAIL:
                            </div>
                            <div>
                              {linkedParent?.email ||
                                completeStudentData.parentEmail ||
                                "N/A"}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                              ACCOUNT STATUS:
                            </div>
                            <div
                              className={
                                linkedParent?.status === "active"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {linkedParent?.status?.toUpperCase() ||
                                "INACTIVE"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      {completeStudentData.emergencyContact?.name && (
                        <div className="border border-gray-600 p-4 bg-gray-100/20">
                          <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                            EMERGENCY CONTACT
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                                NAME:
                              </div>
                              <div>
                                {completeStudentData.emergencyContact.name}
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                                RELATIONSHIP:
                              </div>
                              <div>
                                {completeStudentData.emergencyContact.relationship?.toUpperCase()}
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                                PHONE:
                              </div>
                              <div>
                                {
                                  completeStudentData.emergencyContact
                                    .phoneNumber
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-gray-600 bg-gray-100/10">
                      <div className="text-xs">
                        <div>NO GUARDIAN RECORDS</div>
                        <div>FOUND IN DATABASE</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "RESULTS" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      STUDENT RESULTS DATABASE
                    </div>
                    <div className="text-xs">
                      VIEW ACADEMIC PERFORMANCE RECORDS
                    </div>
                  </div>

                  {resultsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-xs">
                        <Database className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
                        <div>[LOADING RESULTS...]</div>
                      </div>
                    </div>
                  ) : studentResults && studentResults.length > 0 ? (
                    <div className="space-y-6">
                      {studentResults.map((result, index) => (
                        <div
                          key={index}
                          className="border border-gray-600 p-4 bg-gray-100/10"
                        >
                          <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                            TERM: {result.term.toUpperCase()} {result.year} |
                            UPDATED:{" "}
                            {result.updatedAt
                              ? new Date(result.updatedAt).toLocaleDateString()
                              : "UNKNOWN"}
                          </div>
                          <div className="space-y-3 text-xs">
                            {/* Subject Scores */}
                            <div className="space-y-2">
                              <div className="font-bold border-b border-gray-600 pb-1">
                                SCORES:
                              </div>
                              {result.scores.map((score, scoreIndex) => (
                                <div
                                  key={scoreIndex}
                                  className="flex flex-col md:flex-row border-b border-gray-600/20 py-1"
                                >
                                  <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                                    {score.subject.toUpperCase()}:
                                  </div>
                                  <div className="flex-1">
                                    <span
                                      className={`font-bold ${
                                        score.totalScore >= 70
                                          ? "text-green-600"
                                          : score.totalScore >= 50
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {score.totalScore}/100
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Average Score */}
                            <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-1">
                              <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                                AVERAGE SCORE:
                              </div>
                              <div className="flex-1">
                                <span className="font-bold text-lg">
                                  {Math.round(
                                    result.scores.reduce(
                                      (sum, s) => sum + s.totalScore,
                                      0
                                    ) / result.scores.length
                                  )}
                                  /100
                                </span>
                              </div>
                            </div>

                            {/* Comments */}
                            {result.comment && (
                              <div className="border-b border-gray-600/20 py-2">
                                <div className="font-bold mb-1">COMMENT:</div>
                                <div className="text-gray-700 italic">
                                  {result.comment}
                                </div>
                              </div>
                            )}

                            {/* Grade Calculation */}
                            <div className="flex flex-col md:flex-row py-1">
                              <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                                GRADE:
                              </div>
                              <div className="flex-1">
                                <span
                                  className={`font-bold text-lg ${
                                    Math.round(
                                      result.scores.reduce(
                                        (sum, s) => sum + s.totalScore,
                                        0
                                      ) / result.scores.length
                                    ) >= 70
                                      ? "text-green-600"
                                      : Math.round(
                                          result.scores.reduce(
                                            (sum, s) => sum + s.totalScore,
                                            0
                                          ) / result.scores.length
                                        ) >= 50
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {Math.round(
                                    result.scores.reduce(
                                      (sum, s) => sum + s.totalScore,
                                      0
                                    ) / result.scores.length
                                  ) >= 70
                                    ? "A"
                                    : Math.round(
                                        result.scores.reduce(
                                          (sum, s) => sum + s.totalScore,
                                          0
                                        ) / result.scores.length
                                      ) >= 60
                                    ? "B"
                                    : Math.round(
                                        result.scores.reduce(
                                          (sum, s) => sum + s.totalScore,
                                          0
                                        ) / result.scores.length
                                      ) >= 50
                                    ? "C"
                                    : Math.round(
                                        result.scores.reduce(
                                          (sum, s) => sum + s.totalScore,
                                          0
                                        ) / result.scores.length
                                      ) >= 40
                                    ? "D"
                                    : "F"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-gray-600 bg-gray-100/10">
                      <div className="text-xs">
                        <Database className="w-12  text-gray-400 mx-auto mb-4" />
                        <div className="font-bold mb-2">[NO RESULTS FOUND]</div>
                        <div>STUDENT HAS NO ACADEMIC RECORDS</div>
                        <div>IN THE DATABASE</div>
                      </div>
                    </div>
                  )}

                  {/* Permission Notice */}
                  {user?.role === "teacher" && (
                    <div className="mt-6 border border-yellow-500 bg-yellow-50 p-4">
                      <div className="text-xs text-yellow-800">
                        <div className="font-bold mb-1">
                          [PERMISSION NOTICE]
                        </div>
                        <div>
                          TEACHERS CAN ONLY VIEW RESULTS FOR STUDENTS IN THEIR
                          ASSIGNED CLASSROOMS.
                        </div>
                        <div>
                          TO SUBMIT OR UPDATE RESULTS, USE THE CLASSROOM
                          MANAGEMENT INTERFACE.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Command Bar */}
            <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs">
                  [RECORD ACCESSED] | [CLASSIFICATION: STUDENT-DATA] | [SESSION:
                  ACTIVE]
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPDF}
                    className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {isDownloadingPDF ? "GENERATING..." : "[DOWNLOAD]"}
                  </button>

                  <button
                    onClick={handleEditStudent}
                    className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold"
                  >
                    [EDIT]
                  </button>

                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-red-500 hover:border-red-500 transition-colors text-xs font-bold"
                  >
                    [CLOSE]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Terminal Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
          border: 1px solid #6b7280;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
          border: 1px solid #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}
