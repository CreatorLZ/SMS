"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useFetchTimetable } from "../../hooks/useTimetable";
import TimetableTable from "../../components/ui/timetable-table";
import { useFetchAttendance } from "../../hooks/useAttendance";
import AttendanceHistory from "../../components/ui/attendance-history";

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const fetchTimetable = useFetchTimetable(user?.assignedClassId || "");
  const fetchAttendance = useFetchAttendance();

  useEffect(() => {
    if (user?.assignedClassId) {
      fetchTimetable().then(setTimetable);
      fetchAttendance().then((data) => setAttendance(data as any[]));
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
