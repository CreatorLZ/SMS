import { useAttendanceStore } from "../store/attendanceStore";
import api from "../lib/api";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent";
}

// For student/parent: returns { studentInfo, attendance }
// For teacher: returns array of students with attendance
export function useFetchAttendance(studentId?: string) {
  const setAttendance = useAttendanceStore((s) => s.setAttendance);
  return async () => {
    if (studentId) {
      // Student/parent view
      const res = await api.get(`/student/attendance`, {
        params: { studentId },
      });
      const data = res.data as { attendance: AttendanceRecord[] };
      setAttendance(data.attendance);
      return data.attendance;
    } else {
      // Teacher view: get all students in class
      const res = await api.get(`/teacher/attendance`);
      // res.data is array of students with attendance
      return res.data;
    }
  };
}
