"use client";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import UserTable from "../../../components/ui/UserTable";
import CreateUserModal from "../../../components/ui/CreateUserModal";
import { useUserManagementStore } from "../../../store/userManagementStore";

export default function AdminUsersPage() {
  const { setCreateModalOpen } = useUserManagementStore();

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="mb-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create User
          </button>
        </div>
        <UserTable />
        <CreateUserModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
