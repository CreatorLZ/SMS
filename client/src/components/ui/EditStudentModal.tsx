"use client";
import { useState, useEffect } from "react";
import { useUpdateStudentMutation } from "@/hooks/useUpdateStudentMutation";
import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useStudent } from "@/hooks/useStudents";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { Toast } from "./Toast";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";

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
} from "lucide-react";

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
    fullName: "",
    studentId: "",
    currentClass: "",
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

  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
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
    if (completeStudentData && isEditModalOpen) {
      const parentId = findParentId(completeStudentData._id);
      setFormData({
        fullName: completeStudentData.fullName || "",
        studentId: completeStudentData.studentId || "",
        currentClass: "", // Will be populated from classroom data if needed
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
        photo: "", // Photo not available in this interface
      });
    }
  }, [completeStudentData, isEditModalOpen, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      await updateStudentMutation.mutateAsync({
        id: selectedStudentId,
        data: formData,
      });
      showToastMessage("Student updated successfully!", "success");
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading student data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="w-6 h-6" />
            Edit Student
          </h2>
          <button
            onClick={() => setEditModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData({ ...formData, studentId: e.target.value })
                    }
                    placeholder="Enter student ID"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Admission Date *</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        admissionDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentClass">Class *</Label>
                <select
                  id="currentClass"
                  value={formData.currentClass}
                  onChange={(e) =>
                    setFormData({ ...formData, currentClass: e.target.value })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a class</option>
                  {STUDENT_CLASSES.map((classOption) => (
                    <option key={classOption.value} value={classOption.value}>
                      {classOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter student's address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Enter location/area"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Parent/Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Parent/Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input
                    id="parentName"
                    type="text"
                    value={formData.parentName}
                    onChange={(e) =>
                      setFormData({ ...formData, parentName: e.target.value })
                    }
                    placeholder="Enter parent's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationshipToStudent">
                    Relationship to Student *
                  </Label>
                  <select
                    id="relationshipToStudent"
                    value={formData.relationshipToStudent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relationshipToStudent: e.target.value,
                      })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">Parent Phone *</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, parentPhone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    pattern="[0-9]*"
                    title="Please enter only digits"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, parentEmail: e.target.value })
                    }
                    placeholder="Enter parent's email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentId">
                    Link to Parent Account (Optional)
                  </Label>
                  <select
                    id="parentId"
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a parent account</option>
                    {parentUsers.map((parent) => (
                      <option key={parent._id} value={parent._id}>
                        {parent.name} ({parent.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Profile Photo URL (Optional)</Label>
                  <Input
                    id="photo"
                    type="url"
                    value={formData.photo}
                    onChange={(e) =>
                      setFormData({ ...formData, photo: e.target.value })
                    }
                    placeholder="Enter photo URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateStudentMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateStudentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating Student...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Student
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="p-6">
          {showToast && toastProps && (
            <Toast
              message={toastProps.message}
              type={toastProps.type}
              onClose={() => setShowToast(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
