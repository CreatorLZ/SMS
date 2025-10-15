import { useState } from "react";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import SubjectTagsInput from "./SubjectTagsInput";
import {
  User,
  Mail,
  Lock,
  BookOpen,
  GraduationCap,
  X,
  Terminal,
  Database,
  Loader2,
  Upload,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function CreateTeacherModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateTeacherModalProps) {
  const { data: classrooms } = useClassroomsQuery();
  const [activeTab, setActiveTab] = useState("TEACHER");
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );

  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    subjectSpecializations: [] as string[],
    assignedClassId: "",
    // Additional teacher information
    dateOfBirth: "",
    gender: "",
    nationality: "Nigerian",
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
    employmentType: "Full-time",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        assignedClassId: formData.assignedClassId || undefined,
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
          formData.emergencyContact.name ||
          formData.emergencyContact.relationship ||
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
          formData.bankInformation.bankName ||
          formData.bankInformation.accountNumber ||
          formData.bankInformation.accountName
            ? formData.bankInformation
            : undefined,
      };
      await onSubmit(submitData);
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        subjectSpecializations: [],
        assignedClassId: "",
        // Additional teacher information
        dateOfBirth: "",
        gender: "",
        nationality: "Nigerian",
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
        employmentType: "Full-time",
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
    } catch (error) {
      console.error("Error creating teacher:", error);
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

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  if (!isOpen) return null;

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
              <div className="text-xs">TEACHER CREATION SYSTEM v0.0.1</div>
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
            <span>[CREATING NEW TEACHER ACCOUNT...]</span>
            <span>CONNECTION: SECURE | MODE: CREATE</span>
          </div>
        </div>

        <div className="flex flex-col h-[calc(95vh-120px)]">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "TEACHER" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      TEACHER ACCOUNT CREATION
                    </div>
                    <div className="text-xs">
                      ENTER BASIC TEACHER DATA BELOW
                    </div>
                  </div>

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
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter teacher's full name"
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
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">PASSWORD:</div>
                      <div className="flex-1">
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter password"
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
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "PERSONAL" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      PERSONAL INFORMATION
                    </div>
                    <div className="text-xs">ENTER PERSONAL DETAILS BELOW</div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">GENDER:</div>
                      <div className="flex-1">
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter state of origin"
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">LGA:</div>
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter local government area"
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter personal email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "PROFESSIONAL" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      PROFESSIONAL INFORMATION
                    </div>
                    <div className="text-xs">
                      ENTER PROFESSIONAL DETAILS BELOW
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="e.g., B.Ed, M.Ed, B.Sc Education"
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">YEARS OF EXPERIENCE:</div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          value={formData.yearsOfExperience}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              yearsOfExperience: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter years of teaching experience"
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter previous school/workplace"
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
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="border border-gray-600 p-4 bg-gray-100/20 mt-4">
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
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
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
                              value={formData.emergencyContact.relationship}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  emergencyContact: {
                                    ...formData.emergencyContact,
                                    relationship: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="e.g., Spouse, Parent, Sibling"
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
                              value={formData.emergencyContact.phoneNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  emergencyContact: {
                                    ...formData.emergencyContact,
                                    phoneNumber: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                              placeholder="Enter emergency contact phone"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                                  .map((classroom) => (
                                    <label
                                      key={classroom._id}
                                      className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-xs"
                                    >
                                      <input
                                        type="radio"
                                        name="assignedClassId"
                                        checked={
                                          formData.assignedClassId ===
                                          classroom._id
                                        }
                                        onChange={(e) => {
                                          setFormData({
                                            ...formData,
                                            assignedClassId: e.target.checked
                                              ? classroom._id
                                              : "",
                                          });
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <Database className="w-3 h-3 text-gray-600" />
                                      <span>{classroom.name}</span>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Note: Only classrooms without assigned teachers are
                            shown for new assignments. Use classroom management
                            to reassign existing teachers.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Command Bar */}
          <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs">
                [CREATION SESSION ACTIVE] | [MODE: TEACHER-CREATE] | [STATUS:
                READY]
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                >
                  {isLoading ? "[CREATING...]" : "[CREATE TEACHER]"}
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
  );
}
