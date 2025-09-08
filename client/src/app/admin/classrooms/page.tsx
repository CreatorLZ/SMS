"use client";
import { useState } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import ClassroomCards from "../../../components/ui/ClassroomCards";
import ClassroomDetailView from "../../../components/ui/ClassroomDetailView";
import CreateClassroomModal from "../../../components/ui/CreateClassroomModal";
import AssignStudentsModal from "../../../components/ui/AssignStudentsModal";
import {
  useClassroomsQuery,
  Classroom,
} from "../../../hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "../../../store/classroomManagementStore";
import { Button } from "../../../components/ui/button";
import { Plus, Grid, List } from "lucide-react";

export default function AdminClassroomsPage() {
  const { setCreateModalOpen, viewMode, selectedClassroomForDetail } =
    useClassroomManagementStore();
  const { data: classrooms, isLoading, error } = useClassroomsQuery();
  const [viewType, setViewType] = useState<"cards" | "table">("cards");

  const handleViewDetails = (classroomId: string) => {
    const classroomManagementStore = useClassroomManagementStore.getState();
    classroomManagementStore.setSelectedClassroomForDetail(classroomId);
  };

  const handleBackToList = () => {
    const classroomManagementStore = useClassroomManagementStore.getState();
    classroomManagementStore.setSelectedClassroomForDetail(null);
  };

  const selectedClassroom = classrooms?.find(
    (c: Classroom) => c._id === selectedClassroomForDetail
  );

  if (isLoading) {
    return (
      <RoleGuard allowed={["admin", "superadmin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading classrooms...</div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowed={["admin", "superadmin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Error loading classrooms</div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        {viewMode === "detail" && selectedClassroom ? (
          <ClassroomDetailView
            classroom={selectedClassroom}
            onBack={handleBackToList}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Classroom Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage classrooms, teachers, and student assignments
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewType("cards")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewType === "cards"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Grid className="h-4 w-4 inline mr-1" />
                    Cards
                  </button>
                  <button
                    onClick={() => setViewType("table")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewType === "table"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <List className="h-4 w-4 inline mr-1" />
                    Table
                  </button>
                </div>

                {/* Create Button */}
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Classroom</span>
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Grid className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Total Classrooms
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {classrooms?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Active Teachers
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(
                        classrooms?.map((c: Classroom) => c.teacherId._id)
                      ).size || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <List className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {classrooms?.reduce(
                        (total: number, c: Classroom) =>
                          total + c.students.length,
                        0
                      ) || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Grid className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Avg Class Size
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {classrooms && classrooms.length > 0
                        ? Math.round(
                            classrooms.reduce(
                              (total: number, c: Classroom) =>
                                total + c.students.length,
                              0
                            ) / classrooms.length
                          )
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {viewType === "cards" ? (
              <ClassroomCards
                classrooms={classrooms || []}
                onViewDetails={handleViewDetails}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center py-8">
                  <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Table view will be implemented in Phase 2
                  </p>
                  <Button onClick={() => setViewType("cards")}>
                    Switch to Card View
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <CreateClassroomModal />
        <AssignStudentsModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
