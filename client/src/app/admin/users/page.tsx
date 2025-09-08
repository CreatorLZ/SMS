"use client";
import { useState } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import UserTable from "../../../components/ui/UserTable";
import CreateUserModal from "../../../components/ui/CreateUserModal";
import EditUserModal from "../../../components/ui/EditUserModal";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import { useUserManagementStore } from "../../../store/userManagementStore";
import { useDeleteUserMutation } from "../../../hooks/useDeleteUserMutation";
import { useUsersQuery } from "../../../hooks/useUsersQuery";
import { Toast } from "../../../components/ui/toast";

export default function AdminUsersPage() {
  const {
    setCreateModalOpen,
    isDeleteModalOpen,
    selectedUserId,
    setDeleteModalOpen,
  } = useUserManagementStore();

  const deleteUserMutation = useDeleteUserMutation();
  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  }>({ message: "", type: "success" });

  // Get user data for delete confirmation
  const { data: usersData } = useUsersQuery({});
  const userToDelete = usersData?.data?.find(
    (user) => user._id === selectedUserId
  );

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUserId || !userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync(selectedUserId);
      showToastMessage(
        `User ${userToDelete.name} deactivated successfully`,
        "success"
      );
      setDeleteModalOpen(false);
    } catch (error: any) {
      showToastMessage(
        error?.response?.data?.message || "Failed to delete user",
        "error"
      );
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
  };

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">User Management</h1>
          <p className="text-gray-600">
            Manage users, roles, and permissions for the school management
            system.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create User
          </button>
        </div>

        <UserTable />

        {/* Modals */}
        <CreateUserModal />
        <EditUserModal />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Deactivate User"
          message={
            userToDelete
              ? `Are you sure you want to deactivate ${userToDelete.name}? This will set their status to inactive.`
              : "Are you sure you want to deactivate this user?"
          }
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
          isLoading={deleteUserMutation.isPending}
        />

        {/* Toast */}
        {showToast && toastProps && (
          <Toast
            message={toastProps.message}
            type={toastProps.type}
            onClose={() => setShowToast(false)}
          />
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}
