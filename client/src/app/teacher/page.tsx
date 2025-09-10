"use client";
import { useState } from "react";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Clock } from "lucide-react";
import {
  useTeacherClassroomsQuery,
  Classroom,
} from "../../hooks/useTeacherClassroomsQuery";
import TeacherClassroomCards from "../../components/ui/TeacherClassroomCards";
import TeacherClassroomDetailView from "../../components/ui/TeacherClassroomDetailView";

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const [selectedClassroomForDetail, setSelectedClassroomForDetail] = useState<
    string | null
  >(null);
  const {
    data: classrooms,
    isLoading: classroomsLoading,
    error: classroomsError,
  } = useTeacherClassroomsQuery();

  // Mock data - in real app this would come from API
  const stats = {
    assignedClasses: classrooms?.length || 0,
    totalStudents:
      classrooms?.reduce(
        (total, classroom) => total + classroom.students.length,
        0
      ) || 0,
    pendingAssignments: 3,
    subjects: ["Mathematics", "Physics"],
  };

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground">
                Here's your teaching dashboard overview.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Teacher Portal
            </Badge>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assigned Classes
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.assignedClasses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active class assignments
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
                  {stats.totalStudents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Students under supervision
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Tasks
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingAssignments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Assignments to review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Classroom Management Section */}
          {selectedClassroomForDetail ? (
            <TeacherClassroomDetailView
              classroom={
                classrooms?.find((c) => c._id === selectedClassroomForDetail)!
              }
              onBack={() => setSelectedClassroomForDetail(null)}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    My Classrooms
                  </h2>
                  <p className="text-muted-foreground">
                    Manage your assigned classes and students
                  </p>
                </div>
              </div>

              {classroomsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-600">Loading classrooms...</div>
                </div>
              ) : classroomsError ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-600">Error loading classrooms</div>
                </div>
              ) : classrooms && classrooms.length > 0 ? (
                <TeacherClassroomCards
                  classrooms={classrooms}
                  onViewDetails={setSelectedClassroomForDetail}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No classrooms assigned</p>
                    <p className="text-sm text-gray-500">
                      Contact your administrator to assign classrooms
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subjects Taught */}
          <Card>
            <CardHeader>
              <CardTitle>Subjects You Teach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.subjects.map((subject, index) => (
                  <Badge key={index} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
