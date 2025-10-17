"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import StudentTable from "../../../components/ui/StudentTable";
import CreateStudentModal from "../../../components/ui/CreateStudentModal";
import EditStudentModal from "../../../components/ui/EditStudentModal";
import ViewStudentModal from "../../../components/ui/ViewStudentModal";
import DataLoading from "../../../components/ui/data-loading";
import { useStudentManagementStore } from "../../../store/studentManagementStore";
import { useStudentsQuery } from "../../../hooks/useStudentsQuery";
import { STUDENT_CLASSES } from "../../../constants/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
} from "lucide-react";

export default function AdminStudentsPage() {
  const {
    searchQuery,
    classFilter,
    currentPage,
    setCreateModalOpen,
    setSearchQuery,
    setClassFilter,
    setCurrentPage,
  } = useStudentManagementStore();

  const { data: studentsResponse, isLoading } = useStudentsQuery(
    searchQuery,
    classFilter,
    currentPage
  );

  // Calculate statistics - use server-provided stats if available, otherwise fallback to client-side calculation
  const stats = useMemo(() => {
    if (!studentsResponse?.students)
      return { total: 0, active: 0, inactive: 0 };

    const students = studentsResponse.students;
    const total = studentsResponse.pagination?.total || 0;

    // Use server-provided stats if available (for accurate totals across all pages)
    if (studentsResponse.stats) {
      return {
        total,
        active: studentsResponse.stats?.active ?? 0,
        inactive: studentsResponse.stats?.inactive ?? 0,
      };
    }

    // Fallback to client-side calculation (only for current page)
    return {
      total,
      active: students.filter((s) => s.status === "active").length,
      inactive: students.filter((s) => s.status === "inactive").length,
    };
  }, [studentsResponse]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClassFilterChange = (value: string) => {
    setClassFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Student Management
              </h1>
              <p className="text-muted-foreground">
                Manage student records, enrollment, and academic information
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Registered students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Students
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Students
                </CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </div>
                <p className="text-xs text-muted-foreground">
                  Temporarily inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {STUDENT_CLASSES.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available classes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name or student ID..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={classFilter}
                  onChange={(e) => handleClassFilterChange(e.target.value)}
                  className={cn(
                    "flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
                  )}
                >
                  <option value="">All Classes</option>
                  {STUDENT_CLASSES.map((classOption) => (
                    <option key={classOption.value} value={classOption.value}>
                      {classOption.label}
                    </option>
                  ))}
                </select>

                {(searchQuery || classFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setClassFilter("");
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(searchQuery || classFilter) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {searchQuery && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Search: {searchQuery}
                      <button
                        onClick={() => handleSearchChange("")}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {classFilter && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Class:{" "}
                      {
                        STUDENT_CLASSES.find((c) => c.value === classFilter)
                          ?.label
                      }
                      <button
                        onClick={() => handleClassFilterChange("")}
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

          {/* Student Table */}
          {isLoading ? (
            <DataLoading message="Loading students..." />
          ) : (
            <StudentTable />
          )}

          {/* Enhanced Pagination */}
          {studentsResponse?.pagination &&
            studentsResponse.pagination.pages > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      {(currentPage - 1) *
                        (studentsResponse.pagination.limit || 10) +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        currentPage * (studentsResponse.pagination.limit || 10),
                        studentsResponse.pagination.total
                      )}{" "}
                      of {studentsResponse.pagination.total} students
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          {
                            length: Math.min(
                              5,
                              studentsResponse.pagination.pages
                            ),
                          },
                          (_, i) => {
                            let pageNum;
                            if (studentsResponse.pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              currentPage >=
                              studentsResponse.pagination.pages - 2
                            ) {
                              pageNum =
                                studentsResponse.pagination.pages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  pageNum === currentPage
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={
                          currentPage >= studentsResponse.pagination.pages ||
                          isLoading
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Modals */}
        <CreateStudentModal />
        <EditStudentModal />
        <ViewStudentModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
