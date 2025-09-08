import { useState, useEffect } from "react";
import { useUpdateUserMutation } from "@/hooks/useUpdateUserMutation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useUsersQuery, useUserQuery } from "@/hooks/useUsersQuery";
import { Toast } from "./Toast";
import { STUDENT_CLASSES } from "@/constants/classes";

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <div className="text-center">Loading user data...</div>
        </div>
      </div>
    );
  }
  if (!currentUser) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Edit User</h2>
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
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                    required
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
                    Assigned Class ID
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
                    placeholder="Classroom ID"
                  />
                </div>
              </>
            )}

            {/* Parent-specific fields */}
            {formData.role === "parent" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Linked Student IDs
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
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Updating..." : "Update"}
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
