import { useState } from "react";
import { useUsersQuery, User } from "@/hooks/useUsersQuery";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useDeleteUserMutation } from "@/hooks/useDeleteUserMutation";
import { useUpdateUserMutation } from "@/hooks/useUpdateUserMutation";
import { Toast } from "./Toast";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";
import { Input } from "./input";
import {
  Edit,
  UserCheck,
  UserX,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  Shield,
  BookOpen,
  Users as UsersIcon,
  Search,
} from "lucide-react";

export default function UserTable() {
  const {
    roleFilter,
    statusFilter,
    searchQuery,
    setRoleFilter,
    setStatusFilter,
    setSearchQuery,
    setEditModalOpen,
    setDeleteModalOpen,
  } = useUserManagementStore();

  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sanitize inputs before calling useUsersQuery
  const queryParams: any = {};
  if (searchQuery.trim()) {
    queryParams.search = searchQuery.trim();
  }
  if (roleFilter && roleFilter !== "all") {
    queryParams.role = roleFilter;
  }
  if (statusFilter && statusFilter !== "all") {
    queryParams.status = statusFilter;
  }

  const { data, isLoading, error } = useUsersQuery(queryParams);

  // Mutations
  const deleteUserMutation = useDeleteUserMutation();
  const updateUserMutation = useUpdateUserMutation();

  const handleDeleteClick = (userId: string) => {
    setDeleteModalOpen(true, userId);
  };

  const handleActivateClick = async (userId: string, userName: string) => {
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: { status: "active" },
      });
      showToastMessage(`User ${userName} activated successfully`, "success");
    } catch (error: any) {
      console.error("Activate user error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to activate user";
      showToastMessage(message, "error");
    }
  };

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
      case "admin":
        return <Shield className="w-3 h-3" />;
      case "teacher":
        return <BookOpen className="w-3 h-3" />;
      case "parent":
        return <UsersIcon className="w-3 h-3" />;
      default:
        return <UserCheck className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "admin":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "teacher":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "parent":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Error loading users</div>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const users = data?.data || [];
  const pagination = data?.pagination || null;

  // Empty state
  if (!users || users.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Get started by adding your first user."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
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
              className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
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
                }}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
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
                <Badge variant="secondary" className="flex items-center gap-1">
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
                <Badge variant="secondary" className="flex items-center gap-1">
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

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Linked Students
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user: User) => (
                  <tr key={user._id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {user.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`capitalize ${getRoleBadgeVariant(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className={
                          user.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {user.status === "active" ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {user.role === "parent" && user.linkedStudentIds ? (
                          <div className="flex flex-wrap gap-1">
                            {user.linkedStudentIds
                              .slice(0, 2)
                              .map((student) => (
                                <Badge
                                  key={student._id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {student.fullName}
                                </Badge>
                              ))}
                            {user.linkedStudentIds.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.linkedStudentIds.length - 2} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditModalOpen(true, user._id)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant={
                            user.status === "active" ? "destructive" : "default"
                          }
                          className={
                            user.status === "inactive"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : ""
                          }
                          size="sm"
                          onClick={() =>
                            user.status === "active"
                              ? handleDeleteClick(user._id)
                              : handleActivateClick(user._id, user.name)
                          }
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user: User) => (
          <Card key={user._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${getRoleBadgeVariant(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role}</span>
                      </Badge>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className={`text-xs ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(true, user._id)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant={
                      user.status === "active" ? "destructive" : "default"
                    }
                    className={`w-full ${
                      user.status === "inactive"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : ""
                    }`}
                    size="sm"
                    onClick={() =>
                      user.status === "active"
                        ? handleDeleteClick(user._id)
                        : handleActivateClick(user._id, user.name)
                    }
                  >
                    {user.status === "active" ? (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {user.role === "parent" &&
                user.linkedStudentIds &&
                user.linkedStudentIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Linked Students:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.linkedStudentIds.slice(0, 3).map((student) => (
                        <Badge
                          key={student._id}
                          variant="outline"
                          className="text-xs"
                        >
                          {student.fullName}
                        </Badge>
                      ))}
                      {user.linkedStudentIds.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.linkedStudentIds.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * (pagination.limit || 10) + 1}{" "}
                to{" "}
                {Math.min(
                  pagination.page * (pagination.limit || 10),
                  pagination.total
                )}{" "}
                of {pagination.total} users
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement pagination
                  }}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    {
                      length: Math.min(5, pagination.pages),
                    },
                    (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === pagination.page ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            // TODO: Implement pagination
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement pagination
                  }}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showToast && toastProps && (
        <Toast
          message={toastProps.message}
          type={toastProps.type}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
