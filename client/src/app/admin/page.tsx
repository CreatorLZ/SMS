"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useAuditLogsQuery } from "../../hooks/useAuditLogs";
import AuditLogTable from "../../components/ui/audit-log-table";
import { useAuditLogsStore } from "../../store/auditLogsStore";
import { useUsersQuery } from "../../hooks/useUsersQuery";
import { useClassroomsQuery } from "../../hooks/useClassroomsQuery";
import { useGetClassAttendance } from "../../hooks/useAttendance";
import { useStudentsQuery } from "../../hooks/useStudentsQuery";
import { useTermsQuery } from "../../hooks/useTermsQuery";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Link from "next/link";
import { Classroom } from "../../types/classroom";
import {
  FileText,
  Users,
  Activity,
  Download,
  Search,
  Filter,
  Calendar,
  GraduationCap,
  Eye,
  TrendingUp,
  UserCheck,
  BookOpen,
  ClipboardList,
  BarChart3,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const {
    searchQuery,
    userId,
    actionType,
    startDate,
    endDate,
    currentPage,
    setSearchQuery,
    setUserId,
    setActionType,
    setStartDate,
    setEndDate,
    setCurrentPage,
    clearFilters,
  } = useAuditLogsStore();

  const {
    data: logsResponse,
    isLoading,
    error,
  } = useAuditLogsQuery(
    searchQuery,
    userId || "",
    actionType,
    startDate,
    endDate,
    currentPage
  );

  const { data: users } = useUsersQuery();
  const { data: classrooms } = useClassroomsQuery();
  const { data: studentsResponse } = useStudentsQuery("", "", 1);
  const { data: terms } = useTermsQuery();
  const { data: attendanceData, isLoading: attendanceLoading } =
    useGetClassAttendance(selectedClassroom, selectedDate);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserId(e.target.value === "" ? null : e.target.value);
  };

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionType(e.target.value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get unique action types from current logs for dropdown
  const actionTypes = logsResponse?.logs
    ? [...new Set(logsResponse.logs.map((log) => log.actionType))]
    : [];

  // Define Log interface for type safety
  interface Log {
    userId: string | { name: string; email: string };
    actionType: string;
    description?: string | null;
    targetId?: string | null;
    timestamp: string | number;
  }

  // CSV generation and download functions
  const generateCSV = (logs: Log[]) => {
    const headers = [
      "User",
      "Action Type",
      "Description",
      "Target",
      "Timestamp",
    ];

    const rows = logs.map((log) => {
      // Safely handle userId - normalize to string
      const user =
        typeof log.userId === "object"
          ? log.userId.name
          : String(log.userId || "");

      // Safely handle other fields - normalize null/undefined to empty string
      const actionType = String(log.actionType || "");
      const description = String(log.description || "");
      const targetId = String(log.targetId || "");

      // Safely parse timestamp
      let timestamp = "";
      try {
        const date = new Date(log.timestamp);
        if (!isNaN(date.getTime())) {
          timestamp = date.toLocaleString();
        }
      } catch {
        timestamp = "";
      }

      return [user, actionType, description, targetId, timestamp];
    });

    // Escape quotes by replacing " with "" and wrap in quotes
    const escapeCSVField = (field: string) => `"${field.replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSVField).join(","))
      .join("\n");

    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the blob URL to free up memory
    URL.revokeObjectURL(url);
  };

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    const logStats = logsResponse
      ? {
          total: logsResponse.pagination.total,
          page: logsResponse.pagination.page,
          pages: logsResponse.pagination.pages,
          users: logsResponse.logs
            ? new Set(
                logsResponse.logs.map((log) =>
                  typeof log.userId === "object" ? log.userId._id : log.userId
                )
              ).size
            : 0,
          actions: actionTypes.length,
        }
      : { total: 0, page: 0, pages: 0, users: 0, actions: 0 };

    const studentStats = studentsResponse?.pagination
      ? {
          total: studentsResponse.pagination.total,
          active:
            studentsResponse.students?.filter((s) => s.status === "active")
              .length || 0,
          inactive:
            studentsResponse.students?.filter((s) => s.status === "inactive")
              .length || 0,
        }
      : { total: 0, active: 0, inactive: 0 };

    return {
      ...logStats,
      ...studentStats,
      classrooms: classrooms?.length || 0,
      terms: terms?.length || 0,
      users_total: users?.data?.length || 0,
    };
  }, [logsResponse, studentsResponse, classrooms, terms, users, actionTypes]);

  // Define tabs
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      description: "Key metrics and system overview",
      content: (
        <div className="space-y-6">
          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewStats.users_total}
                </div>
                <p className="text-xs text-muted-foreground">
                  registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {overviewStats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  enrolled students
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
                  {overviewStats.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Classrooms
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {overviewStats.classrooms}
                </div>
                <p className="text-xs text-muted-foreground">
                  total classrooms
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Audit Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.total}</div>
                <p className="text-sm text-muted-foreground">
                  logged activities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Active Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.terms}</div>
                <p className="text-sm text-muted-foreground">academic terms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-green-600">
                  Healthy
                </div>
                <p className="text-sm text-muted-foreground">
                  all systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  asChild
                >
                  <Link href="/admin/students">
                    <Users className="h-6 w-6" />
                    <span>Manage Students</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  asChild
                >
                  <Link href="/admin/fees">
                    <Activity className="h-6 w-6" />
                    <span>Fee Management</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  asChild
                >
                  <Link href="/admin/classrooms">
                    <GraduationCap className="h-6 w-6" />
                    <span>Classrooms</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  asChild
                >
                  <Link href="/admin/users">
                    <UserCheck className="h-6 w-6" />
                    <span>User Management</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      icon: FileText,
      description: "Monitor system activity and user actions",
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              System Audit Logs
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => {
                  const csv = generateCSV(logsResponse?.logs || []);
                  downloadCSV(csv, "audit-logs.csv");
                }}
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search audit logs..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 max-w-md"
              />
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* User Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  User
                </label>
                <select
                  value={userId || ""}
                  onChange={handleUserChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Users</option>
                  {users?.data?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={handleActionTypeChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  From Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  To Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                />
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Loading and Error States */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-red-600">
                Error loading audit logs. Please try again.
              </div>
            )}

            {/* Audit Log Table */}
            {!isLoading && !error && (
              <AuditLogTable
                logsResponse={logsResponse}
                onPageChange={handlePageChange}
                currentPage={currentPage}
              />
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "attendance",
      label: "Attendance Monitoring",
      icon: Calendar,
      description: "Monitor student attendance and class participation",
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Viewer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Classroom
                </label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a classroom</option>
                  {(classrooms as Classroom[] | undefined)?.map(
                    (classroom: Classroom) => (
                      <option key={classroom._id} value={classroom._id}>
                        {classroom.name}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Attendance Display */}
            {selectedClassroom && selectedDate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Attendance for{" "}
                    {
                      (classrooms as Classroom[] | undefined)?.find(
                        (c: Classroom) => c._id === selectedClassroom
                      )?.name
                    }{" "}
                    - {new Date(selectedDate).toLocaleDateString()}
                  </h3>
                </div>

                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : attendanceData ? (
                  <div className="space-y-4">
                    {/* Attendance Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Present
                          </CardTitle>
                          <Users className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {
                              attendanceData.records.filter(
                                (r) => r.status === "present"
                              ).length
                            }
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Students present
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Late
                          </CardTitle>
                          <Activity className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-yellow-600">
                            {
                              attendanceData.records.filter(
                                (r) => r.status === "late"
                              ).length
                            }
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Students late
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Absent
                          </CardTitle>
                          <Users className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {
                              attendanceData.records.filter(
                                (r) => r.status === "absent"
                              ).length
                            }
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Students absent
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Attendance Table */}
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              Student Name
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              Student ID
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.records.map((record, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-4 align-middle font-medium">
                                {record.studentId.fullName}
                              </td>
                              <td className="p-4 align-middle text-muted-foreground">
                                {record.studentId.studentId}
                              </td>
                              <td className="p-4 align-middle">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    record.status === "present"
                                      ? "bg-green-100 text-green-800"
                                      : record.status === "late"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {record.status.charAt(0).toUpperCase() +
                                    record.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data found for this date
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Comprehensive system overview and monitoring tools
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 space-y-4">
              {tabs.map((tab) => {
                if (activeTab !== tab.id) return null;

                return (
                  <div key={tab.id} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <tab.icon className="w-5 h-5" />
                          {tab.label}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {tab.description}
                        </p>
                      </CardHeader>
                    </Card>

                    <div className="space-y-4">{tab.content}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
