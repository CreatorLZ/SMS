import { AttendanceEntry } from "../../store/attendanceStore";

export default function AttendanceHistory({
  attendance,
}: {
  attendance: AttendanceEntry[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a, i) => (
            <tr key={i}>
              <td>{new Date(a.date).toLocaleDateString()}</td>
              <td
                className={
                  a.status === "present" ? "text-green-600" : "text-red-600"
                }
              >
                {a.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
