"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useAuditLogsQuery } from "../../hooks/useAuditLogs";
import AuditLogTable from "../../components/ui/audit-log-table";
import { useAuditLogsStore } from "../../store/auditLogsStore";
import { useUsersQuery } from "../../hooks/useUsersQuery";
import Link from "next/link";

export default function AdminDashboard() {
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
    userId,
    actionType,
    startDate,
    endDate,
    currentPage
  );

  const { data: users } = useUsersQuery();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserId(e.target.value);
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
                value={userId}
                onChange={handleUserChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Users</option>
                {users?.map((user) => (
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
        {/* Add more admin features here */}
      </DashboardLayout>
    </RoleGuard>
  );
}
