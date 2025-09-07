"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import ChildSwitcher from "../../components/ui/child-switcher";
import { useParentStore } from "../../store/parentStore";
import { useState } from "react";
import { useFetchAttendance } from "../../hooks/useAttendance";
import AttendanceHistory from "../../components/ui/attendance-history";
import PinResultForm from "../../components/ui/pin-result-form";
import ResultTable from "../../components/ui/result-table";

export default function ParentDashboard() {
  const children = useParentStore((s) => s.children);
  const [selected, setSelected] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const fetchAttendance = useFetchAttendance(selected);

  const handleSelect = (studentId: string) => {
    setSelected(studentId);
    fetchAttendance().then((data) => setAttendance(data as any[]));
  };

  return (
    <RoleGuard allowed={["parent"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Parent Dashboard</h1>
        <section className="mb-8">
          <ChildSwitcher onSelect={handleSelect} />
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Attendance</h2>
          <AttendanceHistory attendance={attendance} />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <PinResultForm onSuccess={setResults} />
          <ResultTable results={results} />
        </section>
      </DashboardLayout>
    </RoleGuard>
  );
}
