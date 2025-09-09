import { useState, useEffect } from "react";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import SubjectTagsInput from "./SubjectTagsInput";
import { User, Mail, BookOpen, GraduationCap, Edit, X } from "lucide-react";

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
}

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  teacher: Teacher | null;
  isLoading: boolean;
}

export default function EditTeacherModal({
  isOpen,
  onClose,
  onSubmit,
  teacher,
  isLoading,
}: EditTeacherModalProps) {
  const { data: classrooms } = useClassroomsQuery();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subjectSpecializations: [] as string[],
    assignedClassId: "",
  });

  useEffect(() => {
    if (teacher) {
      // Handle both old and new subject format
      const subjects =
        teacher.subjectSpecializations &&
        teacher.subjectSpecializations.length > 0
          ? teacher.subjectSpecializations
          : teacher.subjectSpecialization
          ? [teacher.subjectSpecialization]
          : [];

      setFormData({
        name: teacher.name,
        email: teacher.email,
        subjectSpecializations: subjects,
        assignedClassId: teacher.assignedClassId?._id || "",
      });
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        assignedClassId: formData.assignedClassId || undefined,
        subjectSpecializations:
          formData.subjectSpecializations.length > 0
            ? formData.subjectSpecializations
            : undefined,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="w-6 h-6" />
            Edit Teacher
          </h2>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter teacher's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teaching Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Teaching Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Subject Specializations
                  </label>
                  <SubjectTagsInput
                    subjects={formData.subjectSpecializations}
                    onChange={(subjects) =>
                      setFormData({
                        ...formData,
                        subjectSpecializations: subjects,
                      })
                    }
                    placeholder="Add a subject specialization..."
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="assignedClassId"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Assign to Class (Optional)
                  </label>
                  <select
                    id="assignedClassId"
                    value={formData.assignedClassId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedClassId: e.target.value,
                      })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">No class assignment</option>
                    {classrooms?.map((classroom) => (
                      <option key={classroom._id} value={classroom._id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating Teacher...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Teacher
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
