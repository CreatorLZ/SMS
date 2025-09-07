"use client";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useFetchAuditLogs } from "../../hooks/useAuditLogs";
import AuditLogTable from "../../components/ui/audit-log-table";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const fetchLogs = useFetchAuditLogs();

  useEffect(() => {
    fetchLogs().then((data) => setLogs(data as any[]));
  }, []);

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="mb-4">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          >
            User Management
          </Link>
          <Link
            href="/admin/students"
            className="px-4 py-2 bg-green-500 text-white rounded mr-2"
          >
            Student Management
          </Link>
          <Link
            href="/admin/terms"
            className="px-4 py-2 bg-red-500 text-white rounded mr-2"
          >
            Term Management
          </Link>
          <Link
            href="/admin/classrooms"
            className="px-4 py-2 bg-purple-500 text-white rounded mr-2"
          >
            Classroom Management
          </Link>
          <Link
            href="/admin/teachers"
            className="px-4 py-2 bg-orange-500 text-white rounded"
          >
            Teacher Management
          </Link>
        </div>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Audit Logs</h2>
          <AuditLogTable logs={logs} />
        </section>
        {/* Add more admin features here */}
      </DashboardLayout>
    </RoleGuard>
  );
}
