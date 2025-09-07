interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuditLog {
  _id: string;
  userId: User | string;
  actionType: string;
  description: string;
  targetId?: string;
  timestamp: string;
}

export default function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  if (!logs.length) return <div>No audit logs found.</div>;
  return (
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
          {logs.map((log, i) => (
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
  );
}
