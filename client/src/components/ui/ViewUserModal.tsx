"use client";
import { useState } from "react";
import { useUserQuery, User } from "@/hooks/useUsersQuery";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useAuthStore } from "@/store/authStore";
import { X, Download, Edit, Terminal, Database } from "lucide-react";

export default function ViewUserModal() {
  const {
    isViewModalOpen,
    selectedUserId,
    setViewModalOpen,
    setEditModalOpen,
  } = useUserManagementStore();
  const { data: userData, isLoading: isLoadingUser } = useUserQuery(
    selectedUserId || ""
  );
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("USER");
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );

  const { user: currentAuthUser } = useAuthStore();

  const user = userData?.data;

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

  const handleDownloadPDF = async () => {
    if (!user) return;
    setIsDownloadingPDF(true);
    // TODO: Implement PDF generation for users
    try {
      // PDF generation logic will be added later
      console.log("PDF download for user:", user.name);
      setTimeout(() => setIsDownloadingPDF(false), 2000); // Simulate download
    } catch (error) {
      console.error("PDF download error:", error);
      setIsDownloadingPDF(false);
    }
  };

  const handleEditUser = () => {
    setViewModalOpen(false);
    setEditModalOpen(true, selectedUserId);
  };

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return "SUPER ADMIN";
      case "admin":
        return "SYSTEM ADMIN";
      case "teacher":
        return "EDUCATOR";
      case "parent":
        return "GUARDIAN";
      case "student":
        return "LEARNER";
      default:
        return role.toUpperCase();
    }
  };

  const getUserRoleDescription = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Full system access and control";
      case "admin":
        return "Administrative privileges";
      case "teacher":
        return "Educational content management";
      case "parent":
        return "Student information access";
      case "student":
        return "Learning platform access";
      default:
        return "Standard user access";
    }
  };

  if (!isViewModalOpen || !selectedUserId) return null;

  if (isLoadingUser || !user) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
        <div className="w-full max-w-md bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl">
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-pulse text-xs mb-4">
              [LOADING USER DATA...]
            </div>
            <Database className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  const userDetails = [
    { label: "FULL NAME", value: user.name || "N/A" },
    { label: "EMAIL ADDRESS", value: user.email || "N/A" },
    { label: "PHONE NUMBER", value: user.phone || "N/A" },
    { label: "USER ROLE", value: getUserRoleIcon(user.role) || "N/A" },
    {
      label: "ACCOUNT STATUS",
      value: (user.status || "inactive").toUpperCase(),
    },
    {
      label: "CREATED",
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "N/A",
    },
    {
      label: "LAST UPDATED",
      value: user.updatedAt
        ? new Date(user.updatedAt).toLocaleDateString()
        : "N/A",
    },
  ];

  const teacherDetails = [
    {
      label: "SUBJECT SPECIALIZATIONS",
      value:
        user.subjectSpecializations?.join(", ") ||
        user.subjectSpecialization ||
        "Not specified",
    },
    {
      label: "ASSIGNED CLASSROOM",
      value: user.assignedClassId?.name
        ? `Class ${user.assignedClassId.name}`
        : "None assigned",
    },
  ];

  const parentDetails = [
    {
      label: "LINKED STUDENTS",
      value: user.linkedStudentIds?.length
        ? `${user.linkedStudentIds.length} student(s)`
        : "None linked",
    },
  ];

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
              <div className="text-xs">USER MANAGEMENT SYSTEM v1.0.0</div>
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
            <span>[ACCESSING USER PROFILE...]</span>
            <span>CONNECTION: SECURE | MODE: VIEW</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Photo and Basic Info */}
          <div className="w-full md:w-80 border-r-0 md:border-r-2 border-gray-600 p-4 md:p-6">
            {/* Photo Frame */}
            <div className="border-2 border-gray-600 p-2 mb-6 bg-gray-100/20">
              <div className="text-xs mb-2 text-center">USER PHOTOGRAPH</div>
              <div className="w-full h-48 border border-gray-600 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {user.passportPhoto ? (
                  <img
                    src={user.passportPhoto}
                    alt="USER PHOTO"
                    className="w-full h-full object-cover"
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
                CURRENT PROFILE
              </div>
              <div className="space-y-2 text-xs">
                <div>NAME: {user.name}</div>
                <div>ID: {user._id.slice(-8)}</div>
                <div>ROLE: {user.role?.toUpperCase()}</div>
                <div>
                  STATUS:
                  <span
                    className={`ml-2 ${
                      user.status === "active"
                        ? "text-green-600 animate-pulse"
                        : "text-red-600"
                    }`}
                  >
                    ● {user.status?.toUpperCase() || "INACTIVE"}
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
                {["USER", "DETAILS"].map((tab) => (
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
              {activeTab === "USER" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">USER PROFILE DATA</div>
                    <div className="text-xs">
                      CLASSIFICATION: USER-INFORMATION
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {userDetails.map((detail, index) => (
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

              {activeTab === "DETAILS" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      {getUserRoleIcon(user.role)} DETAILS
                    </div>
                    <div className="text-xs">
                      {getUserRoleDescription(user.role)}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Role-specific details */}
                    {user.role === "teacher" && teacherDetails.length > 0 && (
                      <div className="space-y-1 text-xs font-mono">
                        {teacherDetails.map((detail, index) => (
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
                    )}

                    {user.role === "parent" && parentDetails.length > 0 && (
                      <div className="space-y-1 text-xs font-mono">
                        {parentDetails.map((detail, index) => (
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

                        {/* Show linked students */}
                        {user.linkedStudentIds &&
                          user.linkedStudentIds.length > 0 && (
                            <div className="mt-6">
                              <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                                LINKED STUDENTS
                              </div>
                              <div className="space-y-2">
                                {user.linkedStudentIds.map((student: any) => (
                                  <div
                                    key={student._id}
                                    className="flex items-center gap-3 p-2 border border-gray-600/20 bg-gray-50"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-xs font-medium text-primary">
                                        {student.fullName
                                          ?.charAt(0)
                                          ?.toUpperCase() || "S"}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">
                                        {student.fullName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ID: {student.studentId}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {user.role === "admin" || user.role === "superadmin" ? (
                      <div className="text-center py-12 border border-gray-600 bg-gray-100/10">
                        <div className="text-xs">
                          <div>ADMINISTRATIVE ACCESS</div>
                          <div>FULL SYSTEM PRIVILEGES</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Command Bar */}
            <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs">
                  [RECORD ACCESSED] | [CLASSIFICATION: USER-DATA] | [SESSION:
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
                    onClick={handleEditUser}
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
