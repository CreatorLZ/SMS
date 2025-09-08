import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useToggleStudentStatusMutation } from "@/hooks/useToggleStudentStatusMutation";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { Toast } from "./Toast";
import { useState } from "react";

export default function StudentTable() {
  const { searchQuery, classFilter, currentPage, setEditModalOpen } =
    useStudentManagementStore();

  const {
    data: studentsResponse,
    isLoading,
    error,
  } = useStudentsQuery(searchQuery, classFilter, currentPage);

  const toggleStatusMutation = useToggleStudentStatusMutation();

  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleToggleStatus = async (
    studentId: string,
    currentStatus: string
  ) => {
    const isActive = currentStatus === "inactive";
    try {
      await toggleStatusMutation.mutateAsync({
        id: studentId,
        data: { isActive },
      });
      // Success feedback could be added here if needed
    } catch (error: any) {
      console.error("Error toggling student status:", error);
      // Only show toast for actual business errors
      if (error?.response?.status === 404) {
        showToastMessage("Student not found", "error");
      } else if (error?.response?.status >= 500) {
        showToastMessage("Server error occurred. Please try again.", "error");
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading students.</div>;
  if (!studentsResponse?.students || studentsResponse.students.length === 0)
    return <div>No students found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Student ID</th>
            <th>Class</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {studentsResponse.students.map((student: Student) => (
            <tr key={student._id}>
              <td>{student.fullName}</td>
              <td>{student.studentId}</td>
              <td>{student.currentClass}</td>
              <td>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    student.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {student.status}
                </span>
              </td>
              <td>{new Date(student.createdAt).toLocaleString()}</td>
              <td>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditModalOpen(true, student._id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleToggleStatus(student._id, student.status)
                    }
                    className={`px-3 py-1 text-white rounded text-sm ${
                      student.status === "active"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {student.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
