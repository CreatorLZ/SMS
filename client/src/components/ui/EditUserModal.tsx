"use client";
import { useState, useEffect } from "react";
import { useUpdateUserMutation } from "@/hooks/useUpdateUserMutation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useUserQuery, useUsersQuery } from "@/hooks/useUsersQuery";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useUserPassportUpload } from "@/hooks/useUserPassportUpload";
import { User, Terminal, Database, Loader2, Upload } from "lucide-react";

export default function EditUserModal() {
  const {
    isEditModalOpen,
    selectedUserId,
    setEditModalOpen,
    setSelectedUserId,
  } = useUserManagementStore();

  const updateUserMutation = useUpdateUserMutation();
  const [activeTab, setActiveTab] = useState("USER");
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Photo upload hooks
  const {
    onUploadComplete: hookOnUploadComplete,
    onUploadError: hookOnUploadError,
    onUploadBegin: hookOnUploadBegin,
  } = useUserPassportUpload({ userId: selectedUserId || "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    phone: "",
    photo: "",
    studentId: "",
    currentClass: "",
    linkedStudentIds: [] as string[],
    subjectSpecialization: "",
    assignedClassId: "",
    roleDescription: "",
  });

  // Get user data for editing
  const { data: userData, isLoading: isLoadingUser } = useUserQuery(
    selectedUserId || ""
  );
  const currentUser = userData?.data;
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

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    if (currentUser && isEditModalOpen) {
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        role: currentUser.role || "student",
        status: currentUser.status || "active",
        phone: currentUser.phone || "",
        photo: currentUser.passportPhoto || "",
        studentId: (currentUser as any).studentId || "",
        currentClass: (currentUser as any).currentClass || "",
        linkedStudentIds: currentUser.linkedStudentIds?.map((s) => s._id) || [],
        subjectSpecialization: currentUser.subjectSpecialization || "",
        assignedClassId: currentUser.assignedClasses?.[0]?._id || "",
        roleDescription: "",
      });
    }
  }, [currentUser, isEditModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        passportPhoto: formData.photo,
      };

      // Add role-specific fields
      if (formData.role === "student") {
        (submitData as any).studentId = formData.studentId;
        (submitData as any).currentClass = formData.currentClass;
      }
      if (formData.role === "parent") {
        (submitData as any).linkedStudentIds = formData.linkedStudentIds;
      }
      if (formData.role === "teacher") {
        (submitData as any).subjectSpecialization =
          formData.subjectSpecialization;
        (submitData as any).assignedClassId = formData.assignedClassId;
      }

      await updateUserMutation.mutateAsync({
        id: selectedUserId,
        data: submitData,
      });

      showToastMessage("User updated successfully!", "success");
      setEditModalOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      showToastMessage(
        error?.response?.data?.message || "Failed to update user",
        "error"
      );
    }
  };

  const handleClose = () => {
    setEditModalOpen(false);
    setSelectedUserId(null);
  };

  if (!isEditModalOpen || !selectedUserId) return null;

  if (isLoadingUser || !currentUser) {
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
              <div className="text-xs">USER EDIT SYSTEM v1.0.0</div>
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
            <span>[EDITING USER RECORD...]</span>
            <span>CONNECTION: SECURE | MODE: EDIT</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Photo and Basic Info */}
          <div className="w-full md:w-80 border-r-0 md:border-r-2 border-gray-600 p-3 md:p-6">
            {/* Photo Frame */}
            <div className="border-2 border-gray-600 p-2 mb-6 bg-gray-100/20 relative">
              <div className="text-xs mb-2 text-center">USER PHOTOGRAPH</div>
              <div className="w-full h-48 border border-gray-600 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {formData.photo || currentUser.passportPhoto ? (
                  <img
                    src={formData.photo || currentUser.passportPhoto}
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
                {/* Simple hover overlay and upload button */}
                <div
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer hover:opacity-0"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <UploadButton<OurFileRouter, "passportUploader">
                    endpoint="passportUploader"
                    onClientUploadComplete={async (res: any) => {
                      if (res && res[0]) {
                        const url = res[0].url;
                        setFormData((prev) => ({ ...prev, photo: url }));
                        setIsUploadingPhoto(false);
                        showToastMessage(
                          "Photo updated successfully!",
                          "success"
                        );

                        // Trigger backend update
                        await hookOnUploadComplete(res);
                      }
                    }}
                    onUploadError={(error: any) => {
                      setIsUploadingPhoto(false);
                      showToastMessage("Upload failed!", "error");
                      hookOnUploadError(error);
                    }}
                    onUploadBegin={() => {
                      setIsUploadingPhoto(true);
                      hookOnUploadBegin();
                    }}
                    content={{
                      button: ({ ready, isUploading: uploadButtonUploading }) =>
                        null,
                      allowedContent: () => null,
                    }}
                    className="absolute inset-0 w-full h-full"
                  />
                </div>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-none pointer-events-none transition-opacity duration-200 ${
                    isHovered || isUploadingPhoto ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-gray-600 mr-2" />
                      <div className="text-sm text-gray-300 font-mono">
                        uploading photo...
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-600 mr-2" />
                      <div className="text-sm text-gray-300 font-mono">
                        click to change
                      </div>
                    </>
                  )}
                </div>
                {/* Photo overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-100/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Quick Info Panel */}
            <div className="border border-gray-600 p-3 bg-gray-100/10">
              <div className="text-xs mb-3 border-b border-gray-600 pb-1">
                CURRENT RECORD
              </div>
              <div className="space-y-2 text-xs">
                <div>NAME: {currentUser.name}</div>
                <div>ID: {currentUser._id.slice(-8)}</div>
                <div>ROLE: {currentUser.role?.toUpperCase()}</div>
                <div>
                  STATUS:
                  <span
                    className={`ml-2 ${
                      currentUser.status === "active"
                        ? "text-green-600 animate-pulse"
                        : "text-red-600"
                    }`}
                  >
                    ● {currentUser.status?.toUpperCase() || "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
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
                    {tab} EDIT
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
              {activeTab === "USER" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">USER RECORD EDIT</div>
                    <div className="text-xs">MODIFY USER DATA BELOW</div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1 text-xs font-mono">
                      {/* Full Name and Email */}
                      <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                        <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                          FULL NAME:
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">EMAIL:</div>
                        <div className="flex-1">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">PHONE:</div>
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">ROLE:</div>
                        <div className="flex-1">
                          <select
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                role: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                            required
                          >
                            <option value="" className="bg-white text-gray-800">
                              Select a role
                            </option>
                            <option
                              value="student"
                              className="bg-white text-gray-800"
                            >
                              STUDENT
                            </option>
                            <option
                              value="parent"
                              className="bg-white text-gray-800"
                            >
                              PARENT
                            </option>
                            <option
                              value="teacher"
                              className="bg-white text-gray-800"
                            >
                              TEACHER
                            </option>
                            <option
                              value="admin"
                              className="bg-white text-gray-800"
                            >
                              ADMIN
                            </option>
                            <option
                              value="superadmin"
                              className="bg-white text-gray-800"
                            >
                              SUPER ADMIN
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">STATUS:</div>
                        <div className="flex-1">
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                            required
                          >
                            <option
                              value="active"
                              className="bg-white text-gray-800"
                            >
                              ACTIVE
                            </option>
                            <option
                              value="inactive"
                              className="bg-white text-gray-800"
                            >
                              INACTIVE
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "DETAILS" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      {formData.role.toUpperCase()} DETAILS EDIT
                    </div>
                    <div className="text-xs">
                      MODIFY ROLE-SPECIFIC DATA BELOW
                    </div>
                  </div>

                  <form className="space-y-6">
                    {/* Role-specific content */}
                    {formData.role === "student" && (
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex border-b border-gray-600/20 py-2">
                          <div className="w-48 font-bold">STUDENT ID:</div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.studentId}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  studentId: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="Enter student ID"
                            />
                          </div>
                        </div>

                        <div className="flex border-b border-gray-600/20 py-2">
                          <div className="w-48 font-bold">CURRENT CLASS:</div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.currentClass}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  currentClass: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="e.g., Grade 10A"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.role === "teacher" && (
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex border-b border-gray-600/20 py-2">
                          <div className="w-48 font-bold">
                            SUBJECT SPECIALIZATION:
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.subjectSpecialization}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  subjectSpecialization: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="e.g., Mathematics, English"
                            />
                          </div>
                        </div>

                        <div className="flex border-b border-gray-600/20 py-2">
                          <div className="w-48 font-bold">
                            ASSIGNED CLASSROOM:
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.assignedClassId}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  assignedClassId: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="Classroom ID"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.role === "parent" && (
                      <div className="space-y-6">
                        <div className="text-xs font-mono">
                          <div className="flex border-b border-gray-600/20 py-2">
                            <div className="w-48 font-bold">
                              LINKED STUDENTS:
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-600">
                                {formData.linkedStudentIds.length > 0
                                  ? `${formData.linkedStudentIds.length} student(s) linked`
                                  : "No linked students"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {currentUser?.linkedStudentIds &&
                          currentUser.linkedStudentIds.length > 0 && (
                            <div className="mt-6">
                              <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                                LINKED STUDENTS
                              </div>
                              <div className="space-y-2">
                                {currentUser.linkedStudentIds.map(
                                  (student: any) => (
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
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {(formData.role === "admin" ||
                      formData.role === "superadmin") && (
                      <div className="text-center py-12 border border-gray-600 bg-gray-100/10">
                        <div className="text-xs">
                          <div>ADMINISTRATIVE ACCESS</div>
                          <div>FULL SYSTEM PRIVILEGES</div>
                          <div>NO ADDITIONAL CONFIGURATION</div>
                          <div>REQUIRED</div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Command Bar */}
            <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs">
                  [EDIT SESSION ACTIVE] | [MODE: USER-RECORD] | [STATUS: READY]
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={updateUserMutation.isPending}
                    className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {updateUserMutation.isPending
                      ? "[UPDATING...]"
                      : "[SAVE CHANGES]"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClose()}
                    className="px-4 py-2 border border-red-500 bg-gray-50 hover:bg-red-500 transition-colors text-xs font-bold"
                  >
                    [CANCEL]
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
