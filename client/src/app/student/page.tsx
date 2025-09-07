"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useStudentStore } from "../../store/studentStore";
import TimetableTable from "../../components/ui/timetable-table";
import AttendanceHistory from "../../components/ui/attendance-history";
import ResultTable from "../../components/ui/result-table";
import FeeLock from "../../components/ui/fee-lock";
import ResultPdfExport from "../../components/ui/result-pdf-export";

export default function StudentDashboard() {
  const profile = useStudentStore((s) => s.profile);
  // Timetable is not part of student profile, so skip timetable for now or fetch via classroom if needed
  return (
    <RoleGuard allowed={["student"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Attendance</h2>
          <AttendanceHistory attendance={profile?.attendance || []} />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <FeeLock>
            <ResultTable results={profile?.results || []} />
            <ResultPdfExport results={profile?.results || []} />
          </FeeLock>
        </section>
      </DashboardLayout>
    </RoleGuard>
  );
}
