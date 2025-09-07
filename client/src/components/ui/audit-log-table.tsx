import { AuditLog, AuditLogsResponse } from "@/hooks/useAuditLogs";

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

  if (!logs.length) return <div>No audit logs found.</div>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>Target</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: AuditLog) => (
              <tr key={log._id}>
                <td>
                  {typeof log.userId === "object" && log.userId
                    ? log.userId.name
                    : log.userId}
                </td>
                <td>{log.actionType}</td>
                <td>{log.description}</td>
                <td>{log.targetId || "-"}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 border rounded ${
                  page === currentPage ? "bg-blue-500 text-white" : ""
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pagination.pages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
