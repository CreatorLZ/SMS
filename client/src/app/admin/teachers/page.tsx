"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { useTeachersQuery } from "../../../hooks/useTeachersQuery";
import { useUpdateTeacherMutation } from "../../../hooks/useUpdateTeacherMutation";
import { toast } from "sonner";
import { useCreateTeacherMutation } from "@/hooks/useCreateTeacherMutation";
import { useDeleteTeacherMutation } from "@/hooks/useDeleteTeacherMutation";
import TeacherTable from "@/components/ui/TeacherTable";
import CreateTeacherModal from "@/components/ui/CreateTeacherModal";
import ViewUserModal from "@/components/ui/ViewUserModal";
import EditTeacherModal from "@/components/ui/EditTeacherModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { useTeacherManagementStore } from "@/store/teacherManagementStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, GraduationCap, BookOpen, Plus } from "lucide-react";

export default function TeacherManagement() {
  const { data: teachers, isLoading, refetch } = useTeachersQuery();
  const createTeacherMutation = useCreateTeacherMutation();
  const updateTeacherMutation = useUpdateTeacherMutation();
  const deleteTeacherMutation = useDeleteTeacherMutation();

  const {
    isCreateModalOpen,
    isEditModalOpen,
    isViewModalOpen,
    selectedTeacher,
    selectedTeacherId,
    setCreateModalOpen,
    setEditModalOpen,
    setViewModalOpen,
    setSelectedTeacher,
  } = useTeacherManagementStore();

  const handleViewEdit = (teacherId: string) => {
    setSelectedTeacher(null); // Clear any existing selection
    setEditModalOpen(true);
    // Find teacher by ID
    const teacher = teachers?.find((t) => t._id === teacherId);
    if (teacher) {
      setSelectedTeacher(teacher);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleCreateTeacher = async (teacherData: any) => {
    try {
      await createTeacherMutation.mutateAsync(teacherData);
      showToastMessage("Teacher created successfully", "success");
      setCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      showToastMessage(
        error.response?.data?.message || "Failed to create teacher",
        "error"
      );
    }
  };

  const handleDeleteTeacher = (teacher: any) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;

    try {
      await deleteTeacherMutation.mutateAsync(teacherToDelete._id);
      showToastMessage("Teacher deleted successfully", "success");
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
      refetch();
    } catch (error: any) {
      showToastMessage(
        error.response?.data?.message || "Failed to delete teacher",
        "error"
      );
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTeacherToDelete(null);
  };

  const handleViewTeacher = (teacherId: string) => {
    setViewModalOpen(true, teacherId);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setEditModalOpen(true);
  };

  // Define Teacher interface for statistics calculation
  interface Teacher {
    _id: string;
    name: string;
    email: string;
    role: string;
    subjectSpecializations?: string[];
    subjectSpecialization?: string; // Keep for backward compatibility
    assignedClassId?: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }

  // Calculate statistics
  const stats = useMemo(() => {
    if (!teachers) return { total: 0, assigned: 0, unassigned: 0, subjects: 0 };

    const assigned = teachers.filter(
      (t) => t.assignedClasses && t.assignedClasses.length > 0
    ).length;
    const unassigned = teachers.length - assigned;

    // Collect all unique subjects from all teachers
    const allSubjects = new Set<string>();
    (teachers as Teacher[]).forEach((teacher) => {
      // Check new format first
      if (
        teacher.subjectSpecializations &&
        teacher.subjectSpecializations.length > 0
      ) {
        teacher.subjectSpecializations.forEach((subject: string) => {
          if (subject && subject.trim() !== "") {
            allSubjects.add(subject.trim());
          }
        });
      }
      // Fallback to old format for backward compatibility
      else if (
        teacher.subjectSpecialization &&
        teacher.subjectSpecialization.trim() !== ""
      ) {
        allSubjects.add(teacher.subjectSpecialization.trim());
      }
    });

    return {
      total: teachers.length,
      assigned,
      unassigned,
      subjects: allSubjects.size,
    };
  }, [teachers]);

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Teacher Management
              </h1>
              <p className="text-muted-foreground">
                Manage teaching staff, subject assignments, and classroom
                allocations.
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Teachers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Teaching staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assigned Teachers
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.assigned}
                </div>
                <p className="text-xs text-muted-foreground">
                  With class assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unassigned Teachers
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.unassigned}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for assignment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subject Areas
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.subjects}
                </div>
                <p className="text-xs text-muted-foreground">
                  Different specializations
                </p>
              </CardContent>
            </Card>
          </div>

          <TeacherTable
            teachers={teachers || []}
            onView={handleViewTeacher}
            onEdit={handleEditTeacher}
            onDelete={handleDeleteTeacher}
          />

          <CreateTeacherModal
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateTeacher}
            isLoading={createTeacherMutation.isPending}
          />

          <ViewUserModal
            isOpen={isViewModalOpen}
            userId={selectedTeacherId}
            onClose={() => setViewModalOpen(false)}
            onEdit={handleViewEdit}
          />

          <EditTeacherModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedTeacher(null);
            }}
            teacherId={selectedTeacher?._id || ""}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            title="Delete Teacher"
            message={`Are you sure you want to delete ${teacherToDelete?.name}? This action cannot be undone.`}
            isLoading={deleteTeacherMutation.isPending}
          />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
