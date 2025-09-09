import { useState } from "react";
import { useCreateClassroomMutation } from "@/hooks/useCreateClassroomMutation";
import { useTeachersQuery, Teacher } from "@/hooks/useTeachersQuery";
import { useClassroomManagementStore } from "@/store/classroomManagementStore";
import { STUDENT_CLASSES } from "@/constants/classes";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import { BookOpen, UserCheck, X } from "lucide-react";

export default function CreateClassroomModal() {
  const { isCreateModalOpen, setCreateModalOpen } =
    useClassroomManagementStore();
  const createClassroomMutation = useCreateClassroomMutation();
  const { data: teachers } = useTeachersQuery();

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClassroomMutation.mutateAsync(formData);
      alert("Classroom created successfully!");
      setCreateModalOpen(false);
      setFormData({ name: "", teacherId: "" });
    } catch (error: any) {
      console.error("Error creating classroom:", error);
      alert(error?.response?.data?.message || "Failed to create classroom");
    }
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Create New Classroom
          </h2>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Classroom Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Classroom Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Classroom Name *
                </label>
                <select
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a classroom</option>
                  {STUDENT_CLASSES.map((classOption) => (
                    <option key={classOption.value} value={classOption.value}>
                      {classOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Teacher Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="teacherId"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Class Teacher *
                </label>
                <select
                  id="teacherId"
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData({ ...formData, teacherId: e.target.value })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers?.map((teacher: Teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createClassroomMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createClassroomMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Classroom...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Classroom
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
