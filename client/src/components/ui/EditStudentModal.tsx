"use client";
import { useState, useEffect } from "react";
import { useUpdateStudentMutation } from "@/hooks/useUpdateStudentMutation";
import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useStudent } from "@/hooks/useStudents";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { useAuthStore } from "@/store/authStore";
import { useStudentResults } from "@/hooks/useResults";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Upload, Loader2 } from "lucide-react";

import {
  STUDENT_CLASSES,
  STUDENT_CLASS_VALUES,
  isValidStudentClass,
} from "@/constants/classes";
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Users,
  GraduationCap,
  Edit,
  X,
  Terminal,
  Database,
} from "lucide-react";
import { usePassportUpload } from "@/hooks/usePassportUpload";

const toDateInputValue = (date: string | Date | undefined | null) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000; // offset in milliseconds
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().slice(0, 10);
};

export default function EditStudentModal() {
  const { isEditModalOpen, selectedStudentId, setEditModalOpen } =
    useStudentManagementStore();
  const updateStudentMutation = useUpdateStudentMutation();
  const { data: users } = useUsersQuery();
  const { data: classroomsResponse } = useClassroomsQuery();

  // Get all students to find the selected one
  const { data: studentsResponse } = useStudentsQuery();
  const students = studentsResponse?.students || [];
  const selectedStudent = students.find(
    (student: Student) => student._id === selectedStudentId
  );

  // Fetch complete student data for editing
  const { data: completeStudentData, isLoading: isLoadingStudent } = useStudent(
    selectedStudentId || ""
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    currentClass: "",
    classroomId: "",
    parentId: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    location: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    relationshipToStudent: "",
    admissionDate: "",
    status: "",
    photo: "",
  });

  const [assignedClassroomName, setAssignedClassroomName] =
    useState<string>("");

  const [activeTab, setActiveTab] = useState("STUDENT");
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
  } = usePassportUpload({ studentId: selectedStudentId || "" });

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Results data - only query when we have a valid studentId
  const { data: studentResults, isLoading: resultsLoading } = useStudentResults(
    selectedStudentId || ""
  );

  // Memoize whether results should be shown (only when studentId is valid)
  const shouldLoadResults =
    selectedStudentId && /^[0-9a-fA-F]{24}$/.test(selectedStudentId);

  // Debug logging for selectedStudentId
  console.log(
    "EditStudentModal - selectedStudentId:",
    selectedStudentId,
    typeof selectedStudentId
  );

  const [formInitialized, setFormInitialized] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

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

  // Find parent of selected student by checking linkedStudentIds
  const findParentId = (studentId: string) => {
    return (
      users?.data?.find(
        (user) =>
          user.role === "parent" &&
          user.linkedStudentIds?.some((student) => student._id === studentId)
      )?._id || ""
    );
  };

  useEffect(() => {
    if (
      completeStudentData &&
      isEditModalOpen &&
      classroomsResponse &&
      !formInitialized
    ) {
      const parentId = findParentId(completeStudentData._id);

      // Find the current classroom assignment
      let currentClassroomId = (completeStudentData as any).classroomId || "";
      let currentClassName = (completeStudentData as any).currentClass || "";

      // Get classroom name for display
      if (currentClassroomId && classroomsResponse) {
        const classroom = classroomsResponse.find(
          (c: any) => c._id === currentClassroomId
        );
        if (classroom) {
          setAssignedClassroomName(classroom.name);
        }
      }

      // Split fullName into firstName and lastName for initialization
      const nameParts = (completeStudentData.fullName || "")
        .trim()
        .split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData({
        firstName: firstName,
        lastName: lastName,
        studentId: completeStudentData.studentId || "",
        currentClass: currentClassName,
        classroomId: currentClassroomId,
        parentId: parentId,
        gender: completeStudentData.gender || "",
        dateOfBirth: toDateInputValue(completeStudentData.dateOfBirth),
        address: completeStudentData.address || "",
        location: completeStudentData.location || "",
        parentName:
          completeStudentData.emergencyContact?.name ||
          completeStudentData.parentName ||
          "",
        parentPhone:
          completeStudentData.phoneNumber ||
          completeStudentData.parentPhone ||
          "",
        parentEmail: completeStudentData.email || "",
        relationshipToStudent:
          completeStudentData.emergencyContact?.relationship ||
          completeStudentData.relationshipToStudent ||
          "",
        admissionDate: toDateInputValue(
          completeStudentData.enrollmentDate ||
            completeStudentData.admissionDate
        ),
        status: completeStudentData.status || "active",
        photo: completeStudentData.passportPhoto || "", // Use the actual photo field
      });

      setFormInitialized(true);
    }
  }, [
    completeStudentData,
    isEditModalOpen,
    classroomsResponse,
    formInitialized,
    users,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      await updateStudentMutation.mutateAsync({
        id: selectedStudentId,
        data: formData,
      });
      showToastMessage("Student updated successfully!", "success");

      // Invalidate classroom queries to refresh classroom views with updated student data
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-classrooms"] });

      setEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating student:", error);
      showToastMessage(
        error?.response?.data?.message || "Failed to update student",
        "error"
      );
    }
  };

  // Filter only parent users
  const parentUsers =
    users?.data?.filter((user) => user.role === "parent") || [];

  if (!isEditModalOpen || !selectedStudentId) return null;

  // Show loading state while fetching student data
  if (isLoadingStudent || !completeStudentData) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

  const [firstName, ...lastNameParts] = completeStudentData.fullName.split(" ");
  const lastName = lastNameParts.join(" ");
  const admissionDate =
    completeStudentData.enrollmentDate || completeStudentData.admissionDate;

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
      <div className="w-full max-w-6xl max-h-[95vh] bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl relative overflow-hidden">
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
              <div className="text-xs">STUDENT EDIT SYSTEM v0.0.1</div>
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
            <span>[EDITING STUDENT RECORD...]</span>
            <span>CONNECTION: SECURE | MODE: EDIT</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Photo and Basic Info */}
          <div className="w-full md:w-80 border-r-0 md:border-r-2 border-gray-600 p-3 md:p-6">
            {/* Photo Frame */}
            <div className="border-2 border-gray-600 p-2 mb-6 bg-gray-100/20 relative">
              <div className="text-xs mb-2 text-center">STUDENT PHOTOGRAPH</div>
              <div className="w-full h-48 border border-gray-600 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {formData.photo || completeStudentData.passportPhoto ? (
                  <img
                    src={formData.photo || completeStudentData.passportPhoto}
                    alt="STUDENT PHOTO"
                    className="w-full h-full object-cover"
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
          <div className="flex-1 flex flex-col min-h-0">
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
                    {tab === "RESULTS" ? `${tab} VIEW` : `${tab} EDIT`}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
              {activeTab === "STUDENT" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">STUDENT RECORD EDIT</div>
                    <div className="text-xs">MODIFY STUDENT DATA BELOW</div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1 text-xs font-mono">
                      {/* First Name and Student ID */}
                      <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                        <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                          FIRST NAME:
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                firstName: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter first name"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                        <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                          SURNAME:
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                lastName: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter surname"
                            required
                          />
                        </div>
                      </div>

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
                            required
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">ADDRESS:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter address"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">CLASS:</div>
                        <div className="flex-1">
                          <select
                            value={formData.currentClass}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentClass: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                            required
                          >
                            <option value="" className="bg-white text-gray-800">
                              Select a class
                            </option>
                            {STUDENT_CLASSES.map((classOption) => (
                              <option
                                key={classOption.value}
                                value={classOption.value}
                                className="bg-white text-gray-800"
                              >
                                {classOption.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">GENDER:</div>
                        <div className="flex-1">
                          <select
                            value={formData.gender}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                gender: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                            required
                          >
                            <option value="" className="bg-white text-gray-800">
                              Select gender
                            </option>
                            <option
                              value="Male"
                              className="bg-white text-gray-800"
                            >
                              Male
                            </option>
                            <option
                              value="Female"
                              className="bg-white text-gray-800"
                            >
                              Female
                            </option>
                            <option
                              value="Other"
                              className="bg-white text-gray-800"
                            >
                              Other
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">YEAR OF ADMISSION:</div>
                        <div className="flex-1">
                          <input
                            type="date"
                            value={formData.admissionDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                admissionDate: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">STATE:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter state"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">COUNTRY:</div>
                        <div>NIGERIA</div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">EMAIL:</div>
                        <div className="flex-1">
                          <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                parentEmail: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter email"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">PHONE:</div>
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={formData.parentPhone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                parentPhone: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Enter phone"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "GUARDIAN" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      GUARDIAN/PARENT RECORD EDIT
                    </div>
                    <div className="text-xs">MODIFY PARENT DATA BELOW</div>
                  </div>

                  <form className="space-y-6">
                    {/* Primary Guardian */}
                    <div className="border border-gray-600 p-4 bg-gray-100/20">
                      <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                        PRIMARY GUARDIAN EDIT
                      </div>
                      <div className="space-y-4 text-xs">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            NAME:
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.parentName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  parentName: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="Enter parent name"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            RELATIONSHIP:
                          </div>
                          <div className="flex-1">
                            <select
                              value={formData.relationshipToStudent}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  relationshipToStudent: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                              required
                            >
                              <option
                                value=""
                                className="bg-white text-gray-800"
                              >
                                Select relationship
                              </option>
                              <option
                                value="Father"
                                className="bg-white text-gray-800"
                              >
                                Father
                              </option>
                              <option
                                value="Mother"
                                className="bg-white text-gray-800"
                              >
                                Mother
                              </option>
                              <option
                                value="Guardian"
                                className="bg-white text-gray-800"
                              >
                                Guardian
                              </option>
                              <option
                                value="Uncle"
                                className="bg-white text-gray-800"
                              >
                                Uncle
                              </option>
                              <option
                                value="Aunt"
                                className="bg-white text-gray-800"
                              >
                                Aunt
                              </option>
                              <option
                                value="Grandparent"
                                className="bg-white text-gray-800"
                              >
                                Grandparent
                              </option>
                              <option
                                value="Other"
                                className="bg-white text-gray-800"
                              >
                                Other
                              </option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            PHONE:
                          </div>
                          <div className="flex-1">
                            <input
                              type="tel"
                              value={formData.parentPhone}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  parentPhone: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="Enter parent phone"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            EMAIL:
                          </div>
                          <div className="flex-1">
                            <input
                              type="email"
                              value={formData.parentEmail}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  parentEmail: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="Enter parent email"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
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
                  [EDIT SESSION ACTIVE] | [MODE: STUDENT-RECORD] | [STATUS:
                  READY]
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={updateStudentMutation.isPending}
                    className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {updateStudentMutation.isPending
                      ? "[UPDATING...]"
                      : "[SAVE CHANGES]"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
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

      <div className="p-6"></div>
    </div>
  );
}
