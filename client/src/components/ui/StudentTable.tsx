import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useToggleStudentStatusMutation } from "@/hooks/useToggleStudentStatusMutation";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { toast } from "sonner";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";
import DataLoading from "./data-loading";
import { useState, useRef, useEffect } from "react";
import {
  Edit,
  UserCheck,
  UserX,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
} from "lucide-react";

export default function StudentTable() {
  const { searchQuery, classFilter, currentPage, setViewModalOpen } =
    useStudentManagementStore();

  const {
    data: studentsResponse,
    isLoading,
    error,
  } = useStudentsQuery(searchQuery, classFilter, currentPage);

  const toggleStatusMutation = useToggleStudentStatusMutation();

  const tableRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when page changes
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPage]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleToggleStatus = async (
    studentId: string,
    currentStatus: string
  ) => {
    const isActive = currentStatus === "inactive";
    try {
      await toggleStatusMutation.mutateAsync({
        id: studentId,
        data: { isActive },
      });
      showToastMessage(
        `Student ${isActive ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (error: any) {
      console.error("Error toggling student status:", error);
      // Only show toast for actual business errors
      if (error?.response?.status === 404) {
        showToastMessage("Student not found", "error");
      } else if (error?.response?.status >= 500) {
        showToastMessage("Server error occurred. Please try again.", "error");
      }
    }
  };

  // Loading state
  if (isLoading) {
    return <DataLoading message="Loading student data..." />;
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Error loading students</div>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!studentsResponse?.students || studentsResponse.students.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No students found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || classFilter
                ? "Try adjusting your search criteria or filters."
                : "Get started by adding your first student."}
            </p>
            {!searchQuery && !classFilter && (
              <Button onClick={() => setViewModalOpen(true)}>
                Add Student
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={tableRef} className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentsResponse.students.map((student: Student) => (
                  <tr key={student._id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              (student as any).isOptimistic
                                ? "bg-orange-100 animate-pulse"
                                : "bg-primary/10"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium ${
                                (student as any).isOptimistic
                                  ? "text-orange-600"
                                  : "text-primary"
                              }`}
                            >
                              {(student.fullName || "").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div
                            className={`text-sm font-medium text-foreground ${
                              (student as any).isOptimistic
                                ? "text-orange-600"
                                : ""
                            }`}
                          >
                            {student.fullName}{" "}
                            {(student as any).isOptimistic && "(Saving...)"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{student.currentClass}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          student.status === "active" ? "default" : "secondary"
                        }
                        className={
                          student.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {student.status === "active" ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewModalOpen(true, student._id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant={
                            student.status === "active"
                              ? "destructive"
                              : "default"
                          }
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(student._id, student.status)
                          }
                          disabled={toggleStatusMutation.isPending}
                        >
                          {student.status === "active" ? (
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
        {studentsResponse.students.map((student: Student) => (
          <Card key={student._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      (student as any).isOptimistic
                        ? "bg-orange-100 animate-pulse"
                        : "bg-primary/10"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        (student as any).isOptimistic
                          ? "text-orange-600"
                          : "text-primary"
                      }`}
                    >
                      {(student.fullName || "").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-medium text-foreground ${
                        (student as any).isOptimistic ? "text-orange-600" : ""
                      }`}
                    >
                      {student.fullName}{" "}
                      {(student as any).isOptimistic && "(Saving...)"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {student.studentId}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{student.currentClass}</Badge>
                      <Badge
                        variant={
                          student.status === "active" ? "default" : "secondary"
                        }
                        className={
                          student.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewModalOpen(true, student._id)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant={
                      student.status === "active" ? "destructive" : "default"
                    }
                    size="sm"
                    onClick={() =>
                      handleToggleStatus(student._id, student.status)
                    }
                    disabled={toggleStatusMutation.isPending}
                    className="w-full"
                  >
                    {student.status === "active" ? (
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

              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                Created {new Date(student.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
