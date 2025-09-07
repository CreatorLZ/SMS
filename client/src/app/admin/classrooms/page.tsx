"use client";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import ClassroomTable from "../../../components/ui/ClassroomTable";
import CreateClassroomModal from "../../../components/ui/CreateClassroomModal";
import AssignStudentsModal from "../../../components/ui/AssignStudentsModal";
import { useClassroomManagementStore } from "../../../store/classroomManagementStore";

export default function AdminClassroomsPage() {
  const { setCreateModalOpen } = useClassroomManagementStore();

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Classroom Management</h1>
        <div className="mb-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create Classroom
          </button>
        </div>
        <ClassroomTable />
        <CreateClassroomModal />
        <AssignStudentsModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
