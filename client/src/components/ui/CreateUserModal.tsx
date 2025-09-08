import { useState } from "react";
import { useCreateUserMutation } from "@/hooks/useCreateUserMutation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { Toast } from "./Toast";
import { STUDENT_CLASSES } from "@/constants/classes";

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
    role: "student",
    studentId: "",
    currentClass: "",
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
      };

      let submitData: typeof baseData & Record<string, any>;

      switch (formData.role) {
        case "student":
          submitData = {
            ...baseData,
            studentId: formData.studentId,
            currentClass: formData.currentClass,
          };
          break;
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
        role: "student",
        studentId: "",
        currentClass: "",
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
      studentId: "",
      currentClass: "",
      linkedStudentIds: [],
      subjectSpecialization: "",
      assignedClassId: "",
    });
  };

  if (!isCreateModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Create New User</h2>
          <form onSubmit={handleSubmit}>
            {/* Common Fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Student-specific fields */}
            {formData.role === "student" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData({ ...formData, studentId: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Current Class
                  </label>
                  <select
                    value={formData.currentClass}
                    onChange={(e) =>
                      setFormData({ ...formData, currentClass: e.target.value })
                    }
                    className="w-full p-2 border rounded"
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
              </>
            )}

            {/* Teacher-specific fields */}
            {formData.role === "teacher" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Subject Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.subjectSpecialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subjectSpecialization: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Mathematics, English"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Assigned Class ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.assignedClassId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedClassId: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="Classroom ID to assign"
                  />
                </div>
              </>
            )}

            {/* Parent-specific fields */}
            {formData.role === "parent" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Linked Student IDs (Optional)
                </label>
                <input
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
                  className="w-full p-2 border rounded"
                  placeholder="Comma-separated student IDs"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {showToast && toastProps && (
        <Toast
          message={toastProps.message}
          type={toastProps.type}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
