"use client";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import TermTable from "../../../components/ui/TermTable";
import CreateTermModal from "../../../components/ui/CreateTermModal";
import { useTermManagementStore } from "../../../store/termManagementStore";

export default function AdminTermsPage() {
  const { setCreateModalOpen } = useTermManagementStore();

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Term Management</h1>
        <div className="mb-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create Term
          </button>
        </div>
        <TermTable />
        <CreateTermModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
