"use client";
import { useState, useEffect } from "react";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useUserQuery } from "@/hooks/useUsersQuery";
import { useAuthStore } from "@/store/authStore";
import { useUpdateTeacherMutation } from "@/hooks/useUpdateTeacherMutation";
import { toast } from "sonner";
import { useUserPassportUpload } from "@/hooks/useUserPassportUpload";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import SubjectTagsInput from "./SubjectTagsInput";
import { User, Database, Loader2, Upload, Edit, Terminal } from "lucide-react";

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
}

export default function EditTeacherModal({
  isOpen,
  onClose,
  teacherId,
}: EditTeacherModalProps) {
  const { data: classrooms } = useClassroomsQuery();
  const { data: userData, isLoading: isLoadingUser } = useUserQuery(
    teacherId || ""
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState("TEACHER");
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );

  // Photo upload hooks
  const {
    onUploadComplete: hookOnUploadComplete,
    onUploadError: hookOnUploadError,
    onUploadBegin: hookOnUploadBegin,
  } = useUserPassportUpload({ userId: teacherId });

  const { user: currentAuthUser } = useAuthStore();
  const updateTeacherMutation = useUpdateTeacherMutation();

  const teacher = userData?.data;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    photo: "",
    subjectSpecializations: [] as string[],
    assignedClasses: [] as string[],
    // Additional teacher information
    dateOfBirth: "",
    gender: "",
    nationality: "",
    stateOfOrigin: "",
    localGovernmentArea: "",
    address: "",
    alternativePhone: "",
    personalEmail: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phoneNumber: "",
    },
    qualification: "",
    yearsOfExperience: "",
    previousSchool: "",
    employmentStartDate: "",
    // Optional fields
    teachingLicenseNumber: "",
    employmentType: "",
    maritalStatus: "",
    nationalIdNumber: "",
    bankInformation: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
    bloodGroup: "",
    knownAllergies: "",
    medicalConditions: "",
  });

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
    if (teacher) {
      // Handle both old and new subject format
      const subjects =
        teacher.subjectSpecializations &&
        teacher.subjectSpecializations.length > 0
          ? teacher.subjectSpecializations
          : teacher.subjectSpecialization
          ? [teacher.subjectSpecialization]
          : [];

      // Handle classroom assignments - merge both old and new systems
      const assignedClasses = [];
      if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
        // New system: use assignedClasses array
        assignedClasses.push(...teacher.assignedClasses.map((c) => c._id));
      } else if (teacher.assignedClassId?._id) {
        // Old system: fallback to assignedClassId
        assignedClasses.push(teacher.assignedClassId._id);
      }

      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        status: teacher.status || "active",
        photo: teacher.passportPhoto || "",
        subjectSpecializations: subjects,
        assignedClasses,
        // Additional teacher information
        dateOfBirth: (teacher as any).dateOfBirth
          ? new Date((teacher as any).dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: (teacher as any).gender || "",
        nationality: (teacher as any).nationality || "",
        stateOfOrigin: (teacher as any).stateOfOrigin || "",
        localGovernmentArea: (teacher as any).localGovernmentArea || "",
        address: (teacher as any).address || "",
        alternativePhone: (teacher as any).alternativePhone || "",
        personalEmail: (teacher as any).personalEmail || "",
        emergencyContact: {
          name: (teacher as any).emergencyContact?.name || "",
          relationship: (teacher as any).emergencyContact?.relationship || "",
          phoneNumber: (teacher as any).emergencyContact?.phoneNumber || "",
        },
        qualification: (teacher as any).qualification || "",
        yearsOfExperience: (teacher as any).yearsOfExperience?.toString() || "",
        previousSchool: (teacher as any).previousSchool || "",
        employmentStartDate: (teacher as any).employmentStartDate
          ? new Date((teacher as any).employmentStartDate)
              .toISOString()
              .split("T")[0]
          : "",
        // Optional fields
        teachingLicenseNumber: (teacher as any).teachingLicenseNumber || "",
        employmentType: (teacher as any).employmentType || "",
        maritalStatus: (teacher as any).maritalStatus || "",
        nationalIdNumber: (teacher as any).nationalIdNumber || "",
        bankInformation: {
          bankName: (teacher as any).bankInformation?.bankName || "",
          accountNumber: (teacher as any).bankInformation?.accountNumber || "",
          accountName: (teacher as any).bankInformation?.accountName || "",
        },
        bloodGroup: (teacher as any).bloodGroup || "",
        knownAllergies: (teacher as any).knownAllergies || "",
        medicalConditions: (teacher as any).medicalConditions || "",
      });
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    // Validation for emergency contact

    if (
      (formData.emergencyContact.name ||
        formData.emergencyContact.relationship ||
        formData.emergencyContact.phoneNumber) &&
      !(
        formData.emergencyContact.name &&
        formData.emergencyContact.relationship &&
        formData.emergencyContact.phoneNumber
      )
    ) {
      showToastMessage(
        "Emergency contact information must be complete or all fields left empty.",
        "error"
      );

      return;
    }

    // Validation for bank information

    if (
      (formData.bankInformation.bankName ||
        formData.bankInformation.accountNumber ||
        formData.bankInformation.accountName) &&
      !(
        formData.bankInformation.bankName &&
        formData.bankInformation.accountNumber &&
        formData.bankInformation.accountName
      )
    ) {
      showToastMessage(
        "Bank information must be complete or all fields left empty.",
        "error"
      );

      return;
    }

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        passportPhoto: formData.photo,
        assignedClasses:
          formData.assignedClasses.length > 0
            ? formData.assignedClasses
            : undefined,
        subjectSpecializations:
          formData.subjectSpecializations.length > 0
            ? formData.subjectSpecializations
            : undefined,
        // Personal information
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        nationality: formData.nationality || undefined,
        stateOfOrigin: formData.stateOfOrigin || undefined,
        localGovernmentArea: formData.localGovernmentArea || undefined,
        address: formData.address || undefined,
        alternativePhone: formData.alternativePhone || undefined,
        personalEmail: formData.personalEmail || undefined,
        emergencyContact:
          formData.emergencyContact.name &&
          formData.emergencyContact.relationship &&
          formData.emergencyContact.phoneNumber
            ? formData.emergencyContact
            : undefined,
        // Professional information
        qualification: formData.qualification || undefined,
        yearsOfExperience: formData.yearsOfExperience
          ? parseInt(formData.yearsOfExperience)
          : undefined,
        previousSchool: formData.previousSchool || undefined,
        employmentStartDate: formData.employmentStartDate || undefined,
        employmentType: formData.employmentType || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        teachingLicenseNumber: formData.teachingLicenseNumber || undefined,
        nationalIdNumber: formData.nationalIdNumber || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        knownAllergies: formData.knownAllergies || undefined,
        medicalConditions: formData.medicalConditions || undefined,
        bankInformation:
          formData.bankInformation.bankName &&
          formData.bankInformation.accountNumber &&
          formData.bankInformation.accountName
            ? formData.bankInformation
            : undefined,
      };

      await updateTeacherMutation.mutateAsync({
        id: teacher._id,
        ...submitData,
      });

      showToastMessage("Teacher updated successfully!", "success");
      onClose();
    } catch (error: any) {
      console.error("Error updating teacher:", error);
      showToastMessage(
        error?.response?.data?.message || "Failed to update teacher",
        "error"
      );
    }
  };

  if (!isOpen || !teacherId) return null;

  if (isLoadingUser || !teacher) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
        <div className="w-full max-w-md bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl">
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-pulse text-xs mb-4">
              [LOADING TEACHER DATA...]
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
              <div className="text-xs">TEACHER EDIT SYSTEM v1.0.0</div>
            </div>
            <div className="flex items-center gap-2 md:gap-6 text-xs">
              <span>TIME: {currentTime}</span>
              <span>USER: {getDisplayRole(teacher?.role || "")}</span>
              <span>SECURITY: {getSecurityLevel(teacher?.role || "")}</span>
            </div>
          </div>
        </div>

        {/* Sub Header */}
        <div className="border-b border-gray-600 p-2 md:p-3 bg-gray-100/10 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
            <span>[EDITING TEACHER RECORD...]</span>
            <span>CONNECTION: SECURE | MODE: EDIT</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Photo and Basic Info */}
          <div className="w-full md:w-80 border-r-0 md:border-r-2 border-gray-600 p-3 md:p-6">
            {/* Photo Frame */}
            <div className="border-2 border-gray-600 p-2 mb-6 bg-gray-100/20 relative">
              <div className="text-xs mb-2 text-center">TEACHER PHOTOGRAPH</div>
              <div className="w-full h-48 border border-gray-600 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {formData.photo || teacher.passportPhoto ? (
                  <img
                    src={formData.photo || teacher.passportPhoto}
                    alt="TEACHER PHOTO"
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
                <div>NAME: {teacher.name}</div>
                <div>ID: {teacher._id.slice(-8)}</div>
                <div>ROLE: TEACHER</div>

                <div>
                  STATUS:
                  <span
                    className={`ml-2 ${
                      formData.status === "active"
                        ? "text-green-600 animate-pulse"
                        : "text-red-600"
                    }`}
                  >
                    ● {formData.status?.toUpperCase() || "INACTIVE"}
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
                {["TEACHER", "PERSONAL", "PROFESSIONAL", "SUBJECTS"].map(
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
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
              {activeTab === "TEACHER" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">TEACHER RECORD EDIT</div>
                    <div className="text-xs">MODIFY TEACHER DATA BELOW</div>
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
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
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
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
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
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter phone number"
                          />
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
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600 font-mono text-xs"
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

              {activeTab === "PERSONAL" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      PERSONAL INFORMATION EDIT
                    </div>
                    <div className="text-xs">MODIFY PERSONAL DETAILS BELOW</div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1 text-xs font-mono">
                      {/* Date of Birth and Gender */}
                      <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                        <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                          DATE OF BIRTH:
                        </div>
                        <div className="flex-1">
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dateOfBirth: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                          />
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
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600 font-mono text-xs"
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

                      {/* Nationality and State */}
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">NATIONALITY:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.nationality}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nationality: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter nationality"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">STATE OF ORIGIN:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.stateOfOrigin}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stateOfOrigin: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter state of origin"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">LOCAL GOVERNMENT:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.localGovernmentArea}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                localGovernmentArea: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter local government area"
                          />
                        </div>
                      </div>

                      {/* Address and Contact */}
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
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter full address"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">ALTERNATIVE PHONE:</div>
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={formData.alternativePhone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                alternativePhone: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter alternative phone"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">PERSONAL EMAIL:</div>
                        <div className="flex-1">
                          <input
                            type="email"
                            value={formData.personalEmail}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                personalEmail: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter personal email"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "PROFESSIONAL" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      PROFESSIONAL INFORMATION EDIT
                    </div>
                    <div className="text-xs">
                      MODIFY PROFESSIONAL DETAILS BELOW
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1 text-xs font-mono">
                      {/* Qualification and Experience */}
                      <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                        <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                          QUALIFICATION:
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.qualification}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                qualification: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter qualification"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">
                          YEARS OF EXPERIENCE:
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={formData.yearsOfExperience}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                yearsOfExperience: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter years of experience"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">PREVIOUS SCHOOL:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.previousSchool}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                previousSchool: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter previous school"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">
                          EMPLOYMENT START DATE:
                        </div>
                        <div className="flex-1">
                          <input
                            type="date"
                            value={formData.employmentStartDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                employmentStartDate: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Employment and License */}
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">EMPLOYMENT TYPE:</div>
                        <div className="flex-1">
                          <select
                            value={formData.employmentType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                employmentType: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600 font-mono text-xs"
                          >
                            <option value="" className="bg-white text-gray-800">
                              Select employment type
                            </option>
                            <option
                              value="Full-time"
                              className="bg-white text-gray-800"
                            >
                              Full-time
                            </option>
                            <option
                              value="Part-time"
                              className="bg-white text-gray-800"
                            >
                              Part-time
                            </option>
                            <option
                              value="Contract"
                              className="bg-white text-gray-800"
                            >
                              Contract
                              {/* Emergency Contact */}
                              <div className="border border-gray-600 p-4 bg-gray-100/20">
                                <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                                  EMERGENCY CONTACT INFORMATION
                                </div>
                                <div className="space-y-4 text-xs">
                                  <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                                      NAME:
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={formData.emergencyContact.name}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            emergencyContact: {
                                              ...formData.emergencyContact,
                                              name: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                                        placeholder="Enter emergency contact name"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                                      RELATIONSHIP:
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={
                                          formData.emergencyContact.relationship
                                        }
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            emergencyContact: {
                                              ...formData.emergencyContact,
                                              relationship: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                                        placeholder="Enter relationship"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                                      PHONE:
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="tel"
                                        value={
                                          formData.emergencyContact.phoneNumber
                                        }
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            emergencyContact: {
                                              ...formData.emergencyContact,
                                              phoneNumber: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                                        placeholder="Enter emergency contact phone"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </option>
                            <option
                              value="Temporary"
                              className="bg-white text-gray-800"
                            >
                              Temporary
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">MARITAL STATUS:</div>
                        <div className="flex-1">
                          <select
                            value={formData.maritalStatus}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maritalStatus: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600 font-mono text-xs"
                          >
                            <option value="" className="bg-white text-gray-800">
                              Select marital status
                            </option>
                            <option
                              value="Single"
                              className="bg-white text-gray-800"
                            >
                              Single
                            </option>
                            <option
                              value="Married"
                              className="bg-white text-gray-800"
                            >
                              Married
                            </option>
                            <option
                              value="Divorced"
                              className="bg-white text-gray-800"
                            >
                              Divorced
                            </option>
                            <option
                              value="Widowed"
                              className="bg-white text-gray-800"
                            >
                              Widowed
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">TEACHING LICENSE:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.teachingLicenseNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                teachingLicenseNumber: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter teaching license number"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">NATIONAL ID:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.nationalIdNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nationalIdNumber: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter national ID number"
                          />
                        </div>
                      </div>

                      {/* Health Information */}
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">BLOOD GROUP:</div>
                        <div className="flex-1">
                          <select
                            value={formData.bloodGroup}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bloodGroup: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600 font-mono text-xs"
                          >
                            <option value="" className="bg-white text-gray-800">
                              Select blood group
                            </option>
                            <option
                              value="A+"
                              className="bg-white text-gray-800"
                            >
                              A+
                            </option>
                            <option
                              value="A-"
                              className="bg-white text-gray-800"
                            >
                              A-
                            </option>
                            <option
                              value="B+"
                              className="bg-white text-gray-800"
                            >
                              B+
                            </option>
                            <option
                              value="B-"
                              className="bg-white text-gray-800"
                            >
                              B-
                            </option>
                            <option
                              value="AB+"
                              className="bg-white text-gray-800"
                            >
                              AB+
                            </option>
                            <option
                              value="AB-"
                              className="bg-white text-gray-800"
                            >
                              AB-
                            </option>
                            <option
                              value="O+"
                              className="bg-white text-gray-800"
                            >
                              O+
                            </option>
                            <option
                              value="O-"
                              className="bg-white text-gray-800"
                            >
                              O-
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">KNOWN ALLERGIES:</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.knownAllergies}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                knownAllergies: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter known allergies"
                          />
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">
                          MEDICAL CONDITIONS:
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.medicalConditions}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medicalConditions: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                            placeholder="Enter medical conditions"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bank Information */}
                    <div className="border border-gray-600 p-4 bg-gray-100/20">
                      <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1">
                        BANKING INFORMATION
                      </div>
                      <div className="space-y-4 text-xs">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            BANK NAME:
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.bankInformation.bankName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bankInformation: {
                                    ...formData.bankInformation,
                                    bankName: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                              placeholder="Enter bank name"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            ACCOUNT NUMBER:
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.bankInformation.accountNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bankInformation: {
                                    ...formData.bankInformation,
                                    accountNumber: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                              placeholder="Enter account number"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 font-bold mb-1 md:mb-0">
                            ACCOUNT NAME:
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.bankInformation.accountName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bankInformation: {
                                    ...formData.bankInformation,
                                    accountName: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-xs"
                              placeholder="Enter account name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "SUBJECTS" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      SUBJECT SPECIALIZATIONS EDIT
                    </div>
                    <div className="text-xs">
                      MODIFY TEACHING SUBJECTS BELOW
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Subject Specializations */}
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">SUBJECTS:</div>
                        <div className="flex-1">
                          <SubjectTagsInput
                            subjects={formData.subjectSpecializations}
                            onChange={(subjects) =>
                              setFormData({
                                ...formData,
                                subjectSpecializations: subjects,
                              })
                            }
                            placeholder="Add a subject specialization..."
                          />
                          <div className="text-xs text-gray-600 mt-1 font-mono">
                            Current subjects:{" "}
                            {formData.subjectSpecializations.length}
                          </div>
                        </div>
                      </div>

                      <div className="flex border-b border-gray-600/20 py-4">
                        <div className="w-48 font-bold">CLASS ASSIGNMENTS:</div>
                        <div className="flex-1 space-y-3">
                          {/* Selected Classes Display */}
                          {formData.assignedClasses.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-600 mb-2">
                                Currently Assigned (
                                {formData.assignedClasses.length}):
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {formData.assignedClasses.map((classId) => {
                                  const classroom = classrooms?.find(
                                    (c) => c._id === classId
                                  );
                                  return (
                                    <div
                                      key={classId}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                                    >
                                      <Database className="w-3 h-3" />
                                      <span>
                                        {classroom?.name || "Unknown"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            assignedClasses:
                                              formData.assignedClasses.filter(
                                                (id) => id !== classId
                                              ),
                                          });
                                        }}
                                        className="ml-1 text-green-600 hover:text-green-800"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Available Unassigned Classrooms */}
                          <div>
                            <div className="text-xs text-gray-600 mb-2">
                              Available Classes (No teacher assigned):
                            </div>
                            <div className="max-h-32 overflow-y-auto border border-gray-600/20 rounded bg-gray-50">
                              {classrooms?.filter(
                                (classroom) =>
                                  // Only show classrooms that are not assigned to any teacher
                                  !classroom.teacherId
                              ).length === 0 ? (
                                <div className="p-3 text-xs text-gray-500 bg-gray-100 rounded">
                                  No unassigned classrooms available
                                </div>
                              ) : (
                                <div className="p-2 space-y-1">
                                  {classrooms
                                    ?.filter(
                                      (classroom) =>
                                        // Only show classrooms that are not assigned to any teacher
                                        !classroom.teacherId
                                    )
                                    .map((classroom) => {
                                      const isSelected =
                                        formData.assignedClasses.includes(
                                          classroom._id
                                        );
                                      return (
                                        <label
                                          key={classroom._id}
                                          className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-xs"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setFormData({
                                                  ...formData,
                                                  assignedClasses: [
                                                    ...formData.assignedClasses,
                                                    classroom._id,
                                                  ],
                                                });
                                              } else {
                                                setFormData({
                                                  ...formData,
                                                  assignedClasses:
                                                    formData.assignedClasses.filter(
                                                      (id) =>
                                                        id !== classroom._id
                                                    ),
                                                });
                                              }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <Database className="w-3 h-3 text-gray-600" />
                                          <span>{classroom.name}</span>
                                        </label>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Note: Only classrooms without assigned teachers
                              are shown for new assignments. Use classroom
                              management to reassign existing teachers.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Command Bar */}
            <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs">
                  [EDIT SESSION ACTIVE] | [MODE: TEACHER-RECORD] | [STATUS:
                  READY]
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={updateTeacherMutation.isPending}
                    className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {updateTeacherMutation.isPending
                      ? "[UPDATING...]"
                      : "[SAVE CHANGES]"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onClose()}
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
