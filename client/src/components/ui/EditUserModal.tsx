import { useState, useEffect } from "react";
import { useUpdateUserMutation } from "@/hooks/useUpdateUserMutation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useUsersQuery, useUserQuery } from "@/hooks/useUsersQuery";
import { Toast } from "./toast";
import { STUDENT_CLASSES } from "@/constants/classes";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import {
  User,
  Mail,
  Lock,
  Shield,
  BookOpen,
  Users as UsersIcon,
  Edit,
  X,
} from "lucide-react";

export default function EditUserModal() {
  const {
    isEditModalOpen,
    selectedUserId,
    setEditModalOpen,
    setSelectedUserId,
  } = useUserManagementStore();

  const updateUserMutation = useUpdateUserMutation();
  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  }>({ message: "", type: "success" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    studentId: "",
    currentClass: "",
    linkedStudentIds: [] as string[],
    subjectSpecialization: "",
    assignedClassId: "",
  });

  // Get user data for editing - use single user query with fallback to users list
  const {
    data: singleUserData,
    isLoading: isSingleUserLoading,
    error: singleUserError,
  } = useUserQuery(selectedUserId);
  const { data: usersData } = useUsersQuery({});
  const currentUser =
    singleUserData?.data ||
    usersData?.data?.find((user) => user._id === selectedUserId);

  useEffect(() => {
    if (currentUser && isEditModalOpen) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        studentId: (currentUser as any).studentId || "",
        currentClass: (currentUser as any).currentClass || "",
        linkedStudentIds: currentUser.linkedStudentIds?.map((s) => s._id) || [],
        subjectSpecialization: currentUser.subjectSpecialization || "",
        assignedClassId: currentUser.assignedClassId?._id || "",
      });
    }
  }, [currentUser, isEditModalOpen]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      const submitData = { ...formData };

      // Clean up role-specific fields
      if (formData.role !== "student") {
        delete (submitData as any).studentId;
        delete (submitData as any).currentClass;
      }
      if (formData.role !== "parent") {
        delete (submitData as any).linkedStudentIds;
      }
      if (formData.role !== "teacher") {
        delete (submitData as any).subjectSpecialization;
        delete (submitData as any).assignedClassId;
      }

      await updateUserMutation.mutateAsync({
        id: selectedUserId,
        data: submitData,
      });

      showToastMessage("User updated successfully", "success");
      setEditModalOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
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

  // Show loading state while fetching single user data
  if (!isEditModalOpen) return null;
  if (selectedUserId && isSingleUserLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading user data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="w-6 h-6" />
            Edit User
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
                  <label
                    htmlFor="name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter user's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    User Role *
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Status *
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Information */}
          {formData.role === "student" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="studentId"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Student ID *
                    </label>
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

                  <div className="space-y-2">
                    <label
                      htmlFor="currentClass"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Current Class *
                    </label>
                    <select
                      id="currentClass"
                      value={formData.currentClass}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentClass: e.target.value,
                        })
                      }
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a class</option>
                      {STUDENT_CLASSES.map((classOption) => (
                        <option
                          key={classOption.value}
                          value={classOption.value}
                        >
                          {classOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {formData.role === "teacher" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Teacher Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="subjectSpecialization"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Subject Specialization
                    </label>
                    <Input
                      id="subjectSpecialization"
                      type="text"
                      value={formData.subjectSpecialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subjectSpecialization: e.target.value,
                        })
                      }
                      placeholder="e.g., Mathematics, English"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="assignedClassId"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Assigned Class ID
                    </label>
                    <Input
                      id="assignedClassId"
                      type="text"
                      value={formData.assignedClassId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assignedClassId: e.target.value,
                        })
                      }
                      placeholder="Classroom ID"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {formData.role === "parent" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Parent Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="linkedStudentIds"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Linked Student IDs
                  </label>
                  <Input
                    id="linkedStudentIds"
                    type="text"
                    value={formData.linkedStudentIds.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        linkedStudentIds: e.target.value
                          .split(",")
                          .map((id) => id.trim())
                          .filter((id) => id),
                      })
                    }
                    placeholder="Comma-separated student IDs"
                  />
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={updateUserMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateUserMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating User...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update User
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
