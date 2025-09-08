import { AuditLog, AuditLogsResponse } from "@/hooks/useAuditLogs";
import {
  User,
  Activity,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AuditLogTableProps {
  logsResponse?: AuditLogsResponse;
  onPageChange?: (page: number) => void;
  currentPage?: number;
}

export default function AuditLogTable({
  logsResponse,
  onPageChange,
  currentPage = 1,
}: AuditLogTableProps) {
  const logs = logsResponse?.logs || [];
  const pagination = logsResponse?.pagination;

  if (!logs.length) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No audit logs found
        </h3>
        <p className="text-gray-500">
          Try adjusting your search criteria or filters
        </p>
      </div>
    );
  }

  const getActionTypeColor = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      LOGIN: "bg-emerald-100 text-emerald-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      default: "bg-purple-100 text-purple-800",
    };
    return colors[actionType.toUpperCase()] || colors.default;
  };

  const formatTimeAgo = (timestamp: string | number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User
                  </div>
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Action
                  </div>
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Target
                  </div>
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log: AuditLog, index: number) => (
                <tr
                  key={log._id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white text-xs font-semibold">
                        {typeof log.userId === "object" && log.userId
                          ? log.userId.name?.charAt(0).toUpperCase()
                          : String(log.userId || "?")
                              .charAt(0)
                              .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {typeof log.userId === "object" && log.userId
                            ? log.userId.name
                            : log.userId || "Unknown User"}
                        </div>
                        {typeof log.userId === "object" && log.userId && (
                          <div className="text-xs text-gray-500 truncate">
                            {log.userId.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionTypeColor(
                        log.actionType
                      )}`}
                    >
                      {log.actionType}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-xs">
                      <p
                        className="text-sm text-gray-900 truncate"
                        title={log.description || ""}
                      >
                        {log.description || "-"}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      {log.targetId ? (
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {log.targetId}
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">
                        {formatTimeAgo(log.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {pagination && onPageChange && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing{" "}
            {(currentPage - 1) * (pagination.total / pagination.pages) + 1} to{" "}
            {Math.min(
              currentPage * (pagination.total / pagination.pages),
              pagination.total
            )}{" "}
            of {pagination.total} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                let page;
                if (pagination.pages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= pagination.pages - 2) {
                  page = pagination.pages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                const isActive = page === currentPage;

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {pagination.pages > 5 && currentPage < pagination.pages - 2 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => onPageChange(pagination.pages)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {pagination.pages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pagination.pages}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
