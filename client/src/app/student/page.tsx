"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useStudentStore } from "../../store/studentStore";
import { useAuthStore } from "../../store/authStore";
import { useGetStudentAttendance } from "../../hooks/useAttendance";
import TimetableTable from "../../components/ui/timetable-table";
import AttendanceHistory from "../../components/ui/attendance-history";
import ResultTable from "../../components/ui/result-table";
import FeeLock from "../../components/ui/fee-lock";
import ResultPdfExport from "../../components/ui/result-pdf-export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function StudentDashboard() {
  const profile = useStudentStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  // Only call the hook if user._id is truthy
  const { data: attendanceData, isLoading: attendanceLoading } = user?._id
    ? useGetStudentAttendance(user._id, { limit: 20 })
    : { data: null, isLoading: false };

  return (
    <RoleGuard allowed={["student"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Attendance History</h2>
          <Card>
            <CardHeader>
              <CardTitle>My Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="text-center py-4">Loading attendance...</div>
              ) : attendanceData?.attendance ? (
                <AttendanceHistory attendance={attendanceData.attendance} />
              ) : (
                <div className="text-center py-4 text-gray-600">
                  No attendance records found
                </div>
              )}
            </CardContent>
          </Card>
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
