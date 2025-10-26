"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useAttendanceStore } from "@/store/attendanceStore";
import api from "@/lib/api";
import RoleGuard from "@/components/ui/role-guard";
import DashboardLayout from "@/components/ui/dashboard-layout";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late";
}

interface ChildAttendanceData {
  student: {
    id: string;
    name: string;
    currentClass: string;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    percentage: number;
    details: AttendanceRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

const ChildAttendancePage = () => {
  const { studentId } = useParams();
  const { user } = useAuthStore();
  const { currentPage, pageSize, setCurrentPage } = useAttendanceStore();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "parent",
      "child",
      studentId,
      "attendance",
      currentPage,
      pageSize,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      const response = await api.get(
        `/parent/children/${studentId}/attendance?${params}`
      );
      return response.data as ChildAttendanceData;
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <RoleGuard allowed={["parent"]}>
        <DashboardLayout>
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Child Attendance
                </h1>
                <p className="text-muted-foreground">
                  Loading attendance data...
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Parent Portal
              </Badge>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading attendance data...
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowed={["parent"]}>
        <DashboardLayout>
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Child Attendance
                </h1>
                <p className="text-muted-foreground">
                  Monitor your child's attendance patterns.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Parent Portal
              </Badge>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-4 text-red-600">
                    Failed to load attendance data
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please try refreshing the page
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (!data) {
    return (
      <RoleGuard allowed={["parent"]}>
        <DashboardLayout>
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Child Attendance
                </h1>
                <p className="text-muted-foreground">
                  Monitor your child's attendance patterns.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Parent Portal
              </Badge>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Attendance Data
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    Attendance records will appear here once your child is
                    enrolled and attendance is recorded.
                  </p>
                  <Button variant="outline">
                    Contact School Administration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <RoleGuard allowed={["parent"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link href="/parent">
                <Button variant="outline" size="sm" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                {data.student.name}'s Attendance
              </h1>
              <p className="text-muted-foreground">
                Monitor your child's attendance patterns.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {data.attendance.percentage}% Attendance
              </span>
              <Badge variant="secondary" className="text-sm">
                Parent Portal
              </Badge>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Present Days
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.attendance.presentDays}
                </div>
                <p className="text-xs text-muted-foreground">
                  Days present this term
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Absent Days
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.attendance.absentDays}
                </div>
                <p className="text-xs text-muted-foreground">
                  Days absent this term
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Days</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {data.attendance.lateDays}
                </div>
                <p className="text-xs text-muted-foreground">
                  Days late this term
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Days
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.attendance.totalDays}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total school days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Attendance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.attendance.details.map(
                  (record: AttendanceRecord, index: number) => (
                    <div
                      key={`${record.date}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <div className="font-medium">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {data.attendance.pagination &&
            data.attendance.pagination.pages > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(
                        currentPage * pageSize,
                        data.attendance.pagination.total
                      )}{" "}
                      of {data.attendance.pagination.total} attendance records
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          {
                            length: Math.min(
                              5,
                              data.attendance.pagination.pages
                            ),
                          },
                          (_, i) => {
                            let pageNum;
                            if (data.attendance.pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              currentPage >=
                              data.attendance.pagination.pages - 2
                            ) {
                              pageNum =
                                data.attendance.pagination.pages - 4 + i;
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
                                onClick={() => setCurrentPage(pageNum)}
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
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          currentPage >= data.attendance.pagination.pages ||
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
      </DashboardLayout>
    </RoleGuard>
  );
};

export default ChildAttendancePage;
