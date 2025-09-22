import { useState } from "react";
import { useCreateUserMutation } from "@/hooks/useCreateUserMutation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { Toast } from "./toast";
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
  X,
} from "lucide-react";

export default function CreateUserModal() {
  const { isCreateModalOpen, setCreateModalOpen } = useUserManagementStore();
  const createUserMutation = useCreateUserMutation();
  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  }>({ message: "", type: "success" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "parent",
    phone: "",
    linkedStudentIds: [] as string[],
    subjectSpecialization: "",
    assignedClassId: "",
  });

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Type-safe object construction based on role
      const baseData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
      };

      let submitData: typeof baseData & Record<string, any>;

      switch (formData.role) {
        case "parent":
          submitData = {
            ...baseData,
            linkedStudentIds: formData.linkedStudentIds,
          };
          break;
        case "teacher":
          submitData = {
            ...baseData,
            subjectSpecialization: formData.subjectSpecialization,
            assignedClassId: formData.assignedClassId,
          };
          break;
        default:
          submitData = baseData;
      }

      await createUserMutation.mutateAsync(submitData);
      showToastMessage("User created successfully", "success");
      setCreateModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "parent",
        phone: "",
        linkedStudentIds: [],
        subjectSpecialization: "",
        assignedClassId: "",
      });
    } catch (error: any) {
      showToastMessage(
        error?.response?.data?.message || "Failed to create user",
        "error"
      );
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role,
      // Reset role-specific fields when role changes
      phone: "",
      linkedStudentIds: [],
      subjectSpecialization: "",
      assignedClassId: "",
    });
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Create New User
          </h2>
          <button
            onClick={() => setCreateModalOpen(false)}
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
                    htmlFor="password"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Password *
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
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
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Information */}
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
                      Assigned Class ID (Optional)
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
                      placeholder="Classroom ID to assign"
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
                    Linked Student IDs (Optional)
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
              onClick={() => setCreateModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createUserMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating User...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Create User
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
