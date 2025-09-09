"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import UserTable from "../../../components/ui/UserTable";
import CreateUserModal from "../../../components/ui/CreateUserModal";
import EditUserModal from "../../../components/ui/EditUserModal";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import { useUserManagementStore } from "../../../store/userManagementStore";
import { useDeleteUserMutation } from "../../../hooks/useDeleteUserMutation";
import { useUsersQuery } from "../../../hooks/useUsersQuery";
import { Toast } from "../../../components/ui/Toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Shield,
  BookOpen,
  Plus,
} from "lucide-react";

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
      console.error("Delete user error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        String(error) ||
        "Failed to delete user";
      showToastMessage(message, "error");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!usersData?.data)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0,
        teachers: 0,
        parents: 0,
      };

    const users = usersData.data;
    return {
      total: usersData.pagination?.total || 0,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      admins: users.filter((u) => u.role === "admin" || u.role === "superadmin")
        .length,
      teachers: users.filter((u) => u.role === "teacher").length,
      parents: users.filter((u) => u.role === "parent").length,
    };
  }, [usersData]);

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage users, roles, and permissions for the school management
                system.
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Administrators
                </CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.admins}
                </div>
                <p className="text-xs text-muted-foreground">
                  Admin & Super Admin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.teachers}
                </div>
                <p className="text-xs text-muted-foreground">Teaching staff</p>
              </CardContent>
            </Card>
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
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
