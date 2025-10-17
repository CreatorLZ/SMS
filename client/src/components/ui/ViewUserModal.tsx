"use client";
import { useState } from "react";
import { useUserQuery, User } from "@/hooks/useUsersQuery";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useAuthStore } from "@/store/authStore";
import { X, Download, Edit, Terminal, Database } from "lucide-react";

interface ViewUserModalProps {
  isOpen?: boolean;
  userId?: string | null;
  onClose?: () => void;
  onEdit?: (userId: string) => void;
  onTeacherEdit?: (teacherId: string) => void;
}

export default function ViewUserModal({
  isOpen,
  userId,
  onClose,
  onEdit,
}: ViewUserModalProps = {}) {
  const {
    isViewModalOpen,
    selectedUserId,
    setViewModalOpen,
    setEditModalOpen,
  } = useUserManagementStore();

  // Use props if provided, otherwise use store state
  const modalIsOpen = isOpen !== undefined ? isOpen : isViewModalOpen;
  const currentUserId = userId !== undefined ? userId : selectedUserId;
  const handleClose = onClose || (() => setViewModalOpen(false));
  const handleEdit =
    onEdit ||
    ((userId: string) => {
      setViewModalOpen(false);
      setEditModalOpen(true, userId);
    });
  const { data: userData, isLoading: isLoadingUser } = useUserQuery(
    currentUserId || ""
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
    if (currentUserId) {
      handleEdit(currentUserId);
    }
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

  if (!modalIsOpen || !currentUserId) return null;

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
  ];

  const teacherPersonalDetails = [
    {
      label: "DATE OF BIRTH",
      value: (user as any).dateOfBirth
        ? new Date((user as any).dateOfBirth).toLocaleDateString()
        : "Not specified",
    },
    {
      label: "GENDER",
      value: (user as any).gender || "Not specified",
    },
    {
      label: "NATIONALITY",
      value: (user as any).nationality || "Not specified",
    },
    {
      label: "STATE OF ORIGIN",
      value: (user as any).stateOfOrigin || "Not specified",
    },
    {
      label: "LOCAL GOVERNMENT AREA",
      value: (user as any).localGovernmentArea || "Not specified",
    },
    {
      label: "ADDRESS",
      value: (user as any).address || "Not specified",
    },
    {
      label: "ALTERNATIVE PHONE",
      value: (user as any).alternativePhone || "Not specified",
    },
    {
      label: "PERSONAL EMAIL",
      value: (user as any).personalEmail || "Not specified",
    },
  ];

  const teacherProfessionalDetails = [
    {
      label: "QUALIFICATION",
      value: (user as any).qualification || "Not specified",
    },
    {
      label: "YEARS OF EXPERIENCE",
      value: (user as any).yearsOfExperience
        ? `${(user as any).yearsOfExperience} years`
        : "Not specified",
    },
    {
      label: "PREVIOUS SCHOOL",
      value: (user as any).previousSchool || "Not specified",
    },
    {
      label: "EMPLOYMENT START DATE",
      value: (user as any).employmentStartDate
        ? new Date((user as any).employmentStartDate).toLocaleDateString()
        : "Not specified",
    },
    {
      label: "EMPLOYMENT TYPE",
      value: (user as any).employmentType || "Not specified",
    },
    {
      label: "MARITAL STATUS",
      value: (user as any).maritalStatus || "Not specified",
    },
    {
      label: "TEACHING LICENSE NUMBER",
      value: (user as any).teachingLicenseNumber || "Not specified",
    },
    {
      label: "NATIONAL ID NUMBER",
      value: (user as any).nationalIdNumber || "Not specified",
    },
    {
      label: "BLOOD GROUP",
      value: (user as any).bloodGroup || "Not specified",
    },
    {
      label: "KNOWN ALLERGIES",
      value: (user as any).knownAllergies || "None specified",
    },
    {
      label: "MEDICAL CONDITIONS",
      value: (user as any).medicalConditions || "None specified",
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
                {user.role === "teacher"
                  ? ["USER", "PERSONAL", "PROFESSIONAL", "SUBJECTS"].map(
                      (tab) => (
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
                      )
                    )
                  : ["USER", "DETAILS"].map((tab) => (
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

              {activeTab === "PERSONAL" && user.role === "teacher" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      PERSONAL INFORMATION
                    </div>
                    <div className="text-xs">TEACHER PERSONAL DETAILS</div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {teacherPersonalDetails.map((detail, index) => (
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

                  {/* Emergency Contact */}
                  {(user as any).emergencyContact && (
                    <div className="border border-gray-600 p-4 bg-gray-100/20 mt-4">
                      <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                        EMERGENCY CONTACT INFORMATION
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            NAME:
                          </div>
                          <div className="flex-1">
                            {(user as any).emergencyContact.name ||
                              "Not specified"}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            RELATIONSHIP:
                          </div>
                          <div className="flex-1">
                            {(user as any).emergencyContact.relationship ||
                              "Not specified"}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            PHONE:
                          </div>
                          <div className="flex-1">
                            {(user as any).emergencyContact.phoneNumber ||
                              "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "PROFESSIONAL" && user.role === "teacher" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      PROFESSIONAL INFORMATION
                    </div>
                    <div className="text-xs">TEACHER PROFESSIONAL DETAILS</div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {teacherProfessionalDetails.map((detail, index) => (
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

                  {/* Bank Information */}
                  {(user as any).bankInformation && (
                    <div className="border border-gray-600 p-4 bg-gray-100/20 mt-4">
                      <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                        BANKING INFORMATION
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            BANK NAME:
                          </div>
                          <div className="flex-1">
                            {(user as any).bankInformation.bankName ||
                              "Not specified"}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            ACCOUNT NUMBER:
                          </div>
                          <div className="flex-1">
                            {(user as any).bankInformation.accountNumber ||
                              "Not specified"}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            ACCOUNT NAME:
                          </div>
                          <div className="flex-1">
                            {(user as any).bankInformation.accountName ||
                              "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "SUBJECTS" && user.role === "teacher" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      SUBJECT SPECIALIZATIONS
                    </div>
                    <div className="text-xs">
                      TEACHING SUBJECTS AND CLASSROOM ASSIGNMENTS
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Basic teacher details */}
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

                    {/* Assigned Classrooms - Full Display */}
                    <div>
                      <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                        ASSIGNED CLASSROOMS
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.assignedClasses &&
                        user.assignedClasses.length > 0 ? (
                          user.assignedClasses.map(
                            (classroom: any, index: number) => (
                              <div
                                key={`classroom-${
                                  classroom._id || `fallback-${index}`
                                }`}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                              >
                                <Database className="w-3 h-3" />
                                <span className="font-medium">
                                  {classroom.name}
                                </span>
                              </div>
                            )
                          )
                        ) : user.assignedClasses &&
                          user.assignedClasses.length > 0 ? (
                          <div
                            key={`single-classroom-${
                              user.assignedClasses[0]._id || "single"
                            }`}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                          >
                            <Database className="w-3 h-3" />
                            <span className="font-medium">
                              {user.assignedClasses[0].name}
                            </span>
                          </div>
                        ) : (
                          <div
                            key="no-classrooms"
                            className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                          >
                            No classrooms assigned
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "DETAILS" && user.role !== "teacher" && (
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
                    onClick={() => handleClose()}
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
