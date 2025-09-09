import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";
import { useDeleteTeacherMutation } from "@/hooks/useDeleteTeacherMutation";
import { Toast } from "./Toast";
import {
  Edit,
  UserX,
  BookOpen,
  GraduationCap,
  Users as UsersIcon,
} from "lucide-react";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  subjectSpecialization?: string;
  assignedClassId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface TeacherTableProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}

export default function TeacherTable({
  teachers,
  onEdit,
  onDelete,
}: TeacherTableProps) {
  const deleteTeacherMutation = useDeleteTeacherMutation();

  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleDelete = async (teacher: Teacher) => {
    try {
      await deleteTeacherMutation.mutateAsync(teacher._id);
      showToastMessage(
        `Teacher ${teacher.name} deleted successfully`,
        "success"
      );
      onDelete(teacher);
    } catch (error: any) {
      console.error("Delete teacher error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete teacher";
      showToastMessage(message, "error");
    }
  };

  // Empty state
  if (!teachers || teachers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No teachers found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by adding your first teacher.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Class Assignment
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {teacher.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {teacher.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-800 hover:bg-purple-100"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        {teacher.subjectSpecialization || "Not specified"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {teacher.assignedClassId ? (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {teacher.assignedClassId.name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-orange-100 text-orange-800 hover:bg-orange-100"
                        >
                          Not assigned
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(teacher)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(teacher)}
                          loading={deleteTeacherMutation.isPending}
                          loadingText="Deleting..."
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {teachers.map((teacher) => (
          <Card key={teacher._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {teacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {teacher.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {teacher.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs bg-purple-100 text-purple-800"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        {teacher.subjectSpecialization || "Not specified"}
                      </Badge>
                      {teacher.assignedClassId ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-100 text-green-800"
                        >
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {teacher.assignedClassId.name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs bg-orange-100 text-orange-800"
                        >
                          Not assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(teacher)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(teacher)}
                    loading={deleteTeacherMutation.isPending}
                    loadingText="Deleting..."
                    className="w-full"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                Created {new Date(teacher.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toast */}
      {showToast && toastProps && (
        <Toast
          message={toastProps.message}
          type={toastProps.type}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
