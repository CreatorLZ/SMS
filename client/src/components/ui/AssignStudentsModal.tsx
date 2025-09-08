import { useState, useEffect } from "react";
import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useAssignStudentsMutation } from "@/hooks/useAssignStudentsMutation";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "@/store/classroomManagementStore";
import { Toast } from "./Toast";

export default function AssignStudentsModal() {
  const { isAssignModalOpen, selectedClassroomId, setAssignModalOpen } =
    useClassroomManagementStore();
  const { data: studentsResponse } = useStudentsQuery();
  const students = studentsResponse?.students || [];
  const { data: classrooms } = useClassroomsQuery();
  const assignStudentsMutation = useAssignStudentsMutation();

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  // Get current classroom data
  const currentClassroom = classrooms?.find(
    (c) => c._id === selectedClassroomId
  );

  useEffect(() => {
    if (currentClassroom && isAssignModalOpen) {
      // Pre-select currently assigned students
      setSelectedStudentIds(currentClassroom.students.map((s) => s._id));
    }
  }, [currentClassroom, isAssignModalOpen]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomId) return;

    try {
      await assignStudentsMutation.mutateAsync({
        classroomId: selectedClassroomId,
        data: { studentIds: selectedStudentIds },
      });
      showToastMessage("Students assigned successfully!", "success");
      setAssignModalOpen(false);
    } catch (error: any) {
      console.error("Error assigning students:", error);
      showToastMessage(
        error?.response?.data?.message || "Failed to assign students",
        "error"
      );
    }
  };

  if (!isAssignModalOpen || !currentClassroom) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Manage Students - {currentClassroom.name}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Students ({selectedStudentIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {students?.map((student: Student) => (
                <div key={student._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={student._id}
                    checked={selectedStudentIds.includes(student._id)}
                    onChange={() => handleStudentToggle(student._id)}
                    className="mr-2"
                  />
                  <label htmlFor={student._id} className="text-sm">
                    {student.fullName} ({student.studentId})
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={assignStudentsMutation.isPending}
            >
              {assignStudentsMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

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
