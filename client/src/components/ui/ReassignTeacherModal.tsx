import { useState, useEffect } from "react";
import { useTeachersQuery } from "@/hooks/useTeachersQuery";
import { useReassignTeacherMutation } from "@/hooks/useClassroomReassignment";
import { toast } from "sonner";
import { Button } from "./button";
import { GraduationCap, Users, CheckCircle, X } from "lucide-react";

interface Classroom {
  _id: string;
  name: string;
  teacherId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ReassignTeacherModalProps {
  isOpen: boolean;
  classroom: Classroom;
  onClose: () => void;
}

export default function ReassignTeacherModal({
  isOpen,
  classroom,
  onClose,
}: ReassignTeacherModalProps) {
  const { data: teachers } = useTeachersQuery();
  const reassignMutation = useReassignTeacherMutation();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [originalTeacherId, setOriginalTeacherId] = useState<string>("");

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    if (isOpen && classroom) {
      const currentTeacherId = classroom.teacherId?._id || "";
      setSelectedTeacherId(currentTeacherId);
      setOriginalTeacherId(currentTeacherId);
    }
  }, [isOpen, classroom]);

  const handleReassign = async () => {
    if (!classroom?._id) return;

    // Don't do anything if no change
    if (selectedTeacherId === originalTeacherId) {
      onClose();
      return;
    }

    try {
      await reassignMutation.mutateAsync({
        classroomId: classroom._id,
        data: {
          teacherId: selectedTeacherId || undefined, // Send undefined for no teacher
        },
      });

      const teacher = teachers?.find((t) => t._id === selectedTeacherId);
      const teacherName = teacher?.name || "None";

      showToastMessage(
        `Teacher reassigned to ${classroom.name}: ${teacherName}`,
        "success"
      );

      onClose();
    } catch (error: any) {
      console.error("Error reassigning teacher:", error);
      showToastMessage(
        error?.response?.data?.message || "Failed to reassign teacher",
        "error"
      );
    }
  };

  const getCurrentTeacher = () => {
    if (!originalTeacherId) return null;
    return teachers?.find((t) => t._id === originalTeacherId);
  };

  const getSelectedTeacher = () => {
    if (!selectedTeacherId) return null;
    return teachers?.find((t) => t._id === selectedTeacherId);
  };

  const hasChanges = selectedTeacherId !== originalTeacherId;

  if (!isOpen || !classroom) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Reassign Teacher
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Assign a teacher to {classroom.name}
          </p>
        </div>

        {/* Current Assignment Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Current Assignment
              </p>
              <p className="text-sm text-gray-600">
                {getCurrentTeacher()?.name || "No teacher assigned"}
              </p>
            </div>
            {getCurrentTeacher() && (
              <div className="flex items-center space-x-1">
                <GraduationCap className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">Assigned</span>
              </div>
            )}
          </div>
        </div>

        {/* Teacher Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Teacher
          </label>
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <div className="p-2 space-y-2">
              {/* "No Teacher" option */}
              <div
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTeacherId === ""
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTeacherId("")}
              >
                <input
                  type="radio"
                  checked={selectedTeacherId === ""}
                  onChange={() => setSelectedTeacherId("")}
                  className="mr-3"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">No Teacher</p>
                    <p className="text-sm text-gray-600">
                      Remove teacher assignment
                    </p>
                  </div>
                </div>
                {selectedTeacherId === "" && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {/* Available Teachers */}
              {teachers
                ?.filter((teacher) => teacher.role === "teacher")
                .map((teacher) => (
                  <div
                    key={teacher._id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeacherId === teacher._id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedTeacherId(teacher._id)}
                  >
                    <input
                      type="radio"
                      checked={selectedTeacherId === teacher._id}
                      onChange={() => setSelectedTeacherId(teacher._id)}
                      className="mr-3"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {teacher.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {teacher.name}
                        </p>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                      </div>
                    </div>
                    {selectedTeacherId === teacher._id && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Change Preview */}
        {hasChanges && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Change Preview:</strong>
              <br />
              {getCurrentTeacher()?.name || "No teacher"} →{" "}
              {getSelectedTeacher()?.name || "No teacher"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={reassignMutation.isPending || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {reassignMutation.isPending ? (
              "Reassigning..."
            ) : (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Reassign Teacher
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
