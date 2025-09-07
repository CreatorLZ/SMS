"use client";
import { useState } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { useTeachersQuery } from "../../../hooks/useTeachersQuery";
import { useUpdateTeacherMutation } from "../../../hooks/useUpdateTeacherMutation";
import { Toast } from "../../../components/ui/toast";
import { useCreateTeacherMutation } from "@/hooks/useCreateTeacherMutation";
import { useDeleteTeacherMutation } from "@/hooks/useDeleteTeacherMutation";
import TeacherTable from "@/components/ui/TeacherTable";
import CreateTeacherModal from "@/components/ui/CreateTeacherModal";
import EditTeacherModal from "@/components/ui/EditTeacherModal";
import { useTeacherManagementStore } from "@/store/teacherManagementStore";

export default function TeacherManagement() {
  const { data: teachers, isLoading, refetch } = useTeachersQuery();
  const createTeacherMutation = useCreateTeacherMutation();
  const updateTeacherMutation = useUpdateTeacherMutation();
  const deleteTeacherMutation = useDeleteTeacherMutation();

  const {
    isCreateModalOpen,
    isEditModalOpen,
    selectedTeacher,
    setCreateModalOpen,
    setEditModalOpen,
    setSelectedTeacher,
  } = useTeacherManagementStore();

  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleCreateTeacher = async (teacherData: any) => {
    try {
      await createTeacherMutation.mutateAsync(teacherData);
      showToastMessage("Teacher created successfully", "success");
      setCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      showToastMessage(
        error.response?.data?.message || "Failed to create teacher",
        "error"
      );
    }
  };

  const handleUpdateTeacher = async (teacherData: any) => {
    if (!selectedTeacher) return;

    try {
      await updateTeacherMutation.mutateAsync({
        id: selectedTeacher._id,
        ...teacherData,
      });
      showToastMessage("Teacher updated successfully", "success");
      setEditModalOpen(false);
      setSelectedTeacher(null);
      refetch();
    } catch (error: any) {
      showToastMessage(
        error.response?.data?.message || "Failed to update teacher",
        "error"
      );
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    // Show confirmation toast instead of browser confirm dialog
    showToastMessage(
      "Are you sure you want to delete this teacher? This action cannot be undone.",
      "error"
    );

    // For immediate deletion, we'll proceed after a short delay to allow user to see the message
    // In a real app, you'd want a proper confirmation modal
    setTimeout(async () => {
      try {
        await deleteTeacherMutation.mutateAsync(teacherId);
        showToastMessage("Teacher deleted successfully", "success");
        refetch();
      } catch (error: any) {
        showToastMessage(
          error.response?.data?.message || "Failed to delete teacher",
          "error"
        );
      }
    }, 2000); // 2 second delay
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setEditModalOpen(true);
  };

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Teacher Management</h1>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Teacher
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading teachers...</div>
          ) : (
            <TeacherTable
              teachers={teachers || []}
              onEdit={handleEditTeacher}
              onDelete={handleDeleteTeacher}
            />
          )}

          <CreateTeacherModal
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateTeacher}
            isLoading={createTeacherMutation.isPending}
          />

          <EditTeacherModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedTeacher(null);
            }}
            onSubmit={handleUpdateTeacher}
            teacher={selectedTeacher}
            isLoading={updateTeacherMutation.isPending}
          />

          {showToast && toastProps && (
            <Toast
              message={toastProps.message}
              type={toastProps.type}
              onClose={() => setShowToast(false)}
            />
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
