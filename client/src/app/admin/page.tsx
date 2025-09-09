"use client";
import { useState } from "react";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useAuditLogsQuery } from "../../hooks/useAuditLogs";
import AuditLogTable from "../../components/ui/audit-log-table";
import { useAuditLogsStore } from "../../store/auditLogsStore";
import { useUsersQuery } from "../../hooks/useUsersQuery";
import { useClassroomsQuery } from "../../hooks/useClassroomsQuery";
import { useGetClassAttendance } from "../../hooks/useAttendance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { Classroom } from "../../types/classroom";

export default function AdminDashboard() {
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

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Audit Logs</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  const csv = generateCSV(logsResponse?.logs || []);
                  downloadCSV(csv, "audit-logs.csv");
                }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Statistics */}
          {logsResponse && (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h3 className="text-sm font-medium text-emerald-800">
                  Total Logs
                </h3>
                <p className="text-2xl font-bold text-emerald-900">
                  {logsResponse.pagination.total}
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <h3 className="text-sm font-medium text-teal-800">
                  Current Page
                </h3>
                <p className="text-2xl font-bold text-teal-900">
                  {logsResponse.pagination.page} /{" "}
                  {logsResponse.pagination.pages}
                </p>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                <h3 className="text-sm font-medium text-cyan-800">
                  Unique Users
                </h3>
                <p className="text-2xl font-bold text-cyan-900">
                  {logsResponse.logs
                    ? new Set(
                        logsResponse.logs.map((log) =>
                          typeof log.userId === "object"
                            ? log.userId._id
                            : log.userId
                        )
                      ).size
                    : 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-medium text-green-800">
                  Action Types
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  {actionTypes.length}
                </p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full max-w-md p-2 border rounded"
            />
          </div>

          {/* Advanced Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <select
                value={userId || ""}
                onChange={handleUserChange}
                className="w-full p-2 border rounded"
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={handleActionTypeChange}
                className="w-full p-2 border rounded"
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
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && <div>Loading audit logs...</div>}
          {error && <div>Error loading audit logs.</div>}

          {/* Audit Log Table */}
          {!isLoading && !error && (
            <AuditLogTable
              logsResponse={logsResponse}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
          )}
        </section>

        {/* Attendance Viewing Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">View Attendance</h2>

          <Card>
            <CardHeader>
              <CardTitle>Check Class Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Classroom
                  </label>
                  <select
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Display */}
          {selectedClassroom && selectedDate && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>
                  Attendance for{" "}
                  {
                    (classrooms as Classroom[] | undefined)?.find(
                      (c: Classroom) => c._id === selectedClassroom
                    )?.name
                  }{" "}
                  - {new Date(selectedDate).toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="text-center py-4">Loading attendance...</div>
                ) : attendanceData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h3 className="text-sm font-medium text-green-800">
                          Present
                        </h3>
                        <p className="text-2xl font-bold text-green-900">
                          {
                            attendanceData.records.filter(
                              (r) => r.status === "present"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Late
                        </h3>
                        <p className="text-2xl font-bold text-yellow-900">
                          {
                            attendanceData.records.filter(
                              (r) => r.status === "late"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h3 className="text-sm font-medium text-red-800">
                          Absent
                        </h3>
                        <p className="text-2xl font-bold text-red-900">
                          {
                            attendanceData.records.filter(
                              (r) => r.status === "absent"
                            ).length
                          }
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Student ID</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.records.map((record, index) => (
                            <tr key={index}>
                              <td>{record.studentId.fullName}</td>
                              <td>{record.studentId.studentId}</td>
                              <td
                                className={`font-medium ${
                                  record.status === "present"
                                    ? "text-green-600"
                                    : record.status === "late"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {record.status.charAt(0).toUpperCase() +
                                  record.status.slice(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-600">
                    No attendance data found for this date
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </DashboardLayout>
    </RoleGuard>
  );
}
