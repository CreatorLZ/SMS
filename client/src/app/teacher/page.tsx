"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useGetTimetable } from "../../hooks/useTimetable";
import TimetableTable from "../../components/ui/timetable-table";
import { useGetAttendanceHistory } from "../../hooks/useAttendance";
import AttendanceHistory from "../../components/ui/attendance-history";

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const { mutateAsync: fetchTimetable } = useGetTimetable();
  const fetchAttendance = useGetAttendanceHistory();

  useEffect(() => {
    if (user?.assignedClassId) {
      fetchTimetable(user?.assignedClassId || "").then((data) =>
        setTimetable(data as any[])
      );
      fetchAttendance({}).then((data: any) => setAttendance(data as any[]));
    }
  }, [user?.assignedClassId]);

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Class Timetable</h2>
          <TimetableTable timetable={timetable} />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Attendance</h2>
          <AttendanceHistory attendance={attendance} />
        </section>
        {/* Add more teacher features here */}
      </DashboardLayout>
    </RoleGuard>
  );
}
