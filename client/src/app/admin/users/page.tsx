"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard, { useRoleCheck } from "../../../components/ui/role-guard";
import UserTable from "../../../components/ui/UserTable";
import CreateUserModal from "../../../components/ui/CreateUserModal";
import EditUserModal from "../../../components/ui/EditUserModal";
import ViewUserModal from "../../../components/ui/ViewUserModal";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import { useUserManagementStore } from "../../../store/userManagementStore";
import { useDeleteUserMutation } from "../../../hooks/useDeleteUserMutation";
import { useUsersQuery } from "../../../hooks/useUsersQuery";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Shield,
  BookOpen,
  Plus,
  Search,
} from "lucide-react";

export default function AdminUsersPage() {
  const { isSuperAdmin, isAdmin } = useRoleCheck();

  const {
    searchQuery,
    roleFilter,
    statusFilter,
    currentPage,
    setCreateModalOpen,
    setSearchQuery,
    setRoleFilter,
    setStatusFilter,
    setCurrentPage,
    isDeleteModalOpen,
    selectedUserId,
    setDeleteModalOpen,
  } = useUserManagementStore();

  const deleteUserMutation = useDeleteUserMutation();

  // Get user data for delete confirmation
  const { data: usersData } = useUsersQuery({});
  const userToDelete = usersData?.data?.find(
    (user) => user._id === selectedUserId
  );

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
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
        parents: 0,
      };

    const users = usersData.data;
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      admins: users.filter((u) => u.role === "admin" || u.role === "superadmin")
        .length,
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
                Staff & Parent Management
              </h1>
              <p className="text-muted-foreground">
                Manage administrators, non-teaching staff, and parents for the
                school management system.
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
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={cn(
                    "flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
                  )}
                >
                  <option value="all">All Roles</option>
                  {isSuperAdmin() && (
                    <option value="superadmin">Super Admin</option>
                  )}
                  <option value="admin">Admin</option>
                  <option value="staff">Non-Teaching Staff</option>
                  <option value="parent">Parent</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={cn(
                    "flex h-10 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
                  )}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {(searchQuery ||
                  roleFilter !== "all" ||
                  statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("all");
                      setStatusFilter("all");
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(searchQuery ||
                roleFilter !== "all" ||
                statusFilter !== "all") && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {searchQuery && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Search: {searchQuery}
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {roleFilter !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Role: {roleFilter}
                      <button
                        onClick={() => setRoleFilter("all")}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <UserTable />

          {/* Modals */}
          <CreateUserModal />
          <EditUserModal />
          <ViewUserModal />

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
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
