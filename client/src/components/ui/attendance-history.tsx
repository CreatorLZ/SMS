import { AttendanceEntry } from "../../store/attendanceStore";
import { StudentAttendanceRecord } from "../../hooks/useAttendance";

export default function AttendanceHistory({
  attendance,
}: {
  attendance: AttendanceEntry[] | StudentAttendanceRecord[];
}) {
  // Handle both old and new data formats
  const isNewFormat = attendance.length > 0 && "_id" in attendance[0];

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Date</th>
            {isNewFormat && <th>Classroom</th>}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a, i) => {
            if (isNewFormat) {
              const record = a as StudentAttendanceRecord;
              return (
                <tr key={record._id || i}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.classroomName || "N/A"}</td>
                  <td
                    className={
                      record.status === "present"
                        ? "text-green-600"
                        : record.status === "late"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }
                  >
                    {record.status.charAt(0).toUpperCase() +
                      record.status.slice(1)}
                  </td>
                </tr>
              );
            } else {
              const record = a as AttendanceEntry;
              return (
                <tr key={i}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td
                    className={
                      record.status === "present"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {record.status}
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
      {attendance.length === 0 && (
        <div className="text-center py-4 text-gray-600">
          No attendance records found
        </div>
      )}
    </div>
  );
}
