"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import ClassroomCards from "../../../components/ui/ClassroomCards";
import ClassroomTable from "../../../components/ui/ClassroomTable";
import ClassroomDetailView from "../../../components/ui/ClassroomDetailView";
import CreateClassroomModal from "../../../components/ui/CreateClassroomModal";
import AssignStudentsModal from "../../../components/ui/AssignStudentsModal";
import {
  useClassroomsQuery,
  Classroom,
} from "../../../hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "../../../store/classroomManagementStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Plus,
  Grid,
  List,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
} from "lucide-react";

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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!classrooms) return { total: 0, teachers: 0, students: 0, avgSize: 0 };

    const teachers = new Set(
      classrooms.map((c: Classroom) => c.teacherId?._id).filter(Boolean)
    ).size;

    const students = classrooms.reduce(
      (total: number, c: Classroom) => total + c.students.length,
      0
    );

    const avgSize =
      classrooms.length > 0 ? Math.round(students / classrooms.length) : 0;

    return {
      total: classrooms.length,
      teachers,
      students,
      avgSize,
    };
  }, [classrooms]);

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
          <div className="space-y-6 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Classroom Management
                </h1>
                <p className="text-muted-foreground">
                  Manage classrooms, teachers, and student assignments
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={viewType === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewType("cards")}
                    className="h-8"
                  >
                    <Grid className="h-4 w-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewType === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewType("table")}
                    className="h-8"
                  >
                    <List className="h-4 w-4 mr-1" />
                    Table
                  </Button>
                </div>

                {/* Create Button */}
                <Button onClick={() => setCreateModalOpen(true)} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Classroom
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Classrooms
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Active classrooms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Teachers
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.teachers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assigned to classes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.students}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Class Size
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.avgSize}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Students per class
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            {viewType === "cards" ? (
              <ClassroomCards
                classrooms={classrooms || []}
                onViewDetails={handleViewDetails}
              />
            ) : (
              <ClassroomTable
                classrooms={classrooms || []}
                onViewDetails={handleViewDetails}
              />
            )}
          </div>
        )}

        {/* Modals */}
        <CreateClassroomModal />
        <AssignStudentsModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
