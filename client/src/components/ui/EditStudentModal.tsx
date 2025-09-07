import { useState, useEffect } from "react";
import { useUpdateStudentMutation } from "@/hooks/useUpdateStudentMutation";
import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useStudentManagementStore } from "@/store/studentManagementStore";

export default function EditStudentModal() {
  const { isEditModalOpen, selectedStudentId, setEditModalOpen } =
    useStudentManagementStore();
  const updateStudentMutation = useUpdateStudentMutation();
  const { data: classrooms } = useClassroomsQuery();
  const { data: users } = useUsersQuery();

  // Get all students to find the selected one
  const { data: studentsResponse } = useStudentsQuery();
  const students = studentsResponse?.students || [];
  const selectedStudent = students.find(
    (student: Student) => student._id === selectedStudentId
  );

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    currentClass: "",
    parentId: "",
  });

  useEffect(() => {
    if (selectedStudent && isEditModalOpen) {
      setFormData({
        fullName: selectedStudent.fullName,
        studentId: selectedStudent.studentId,
        currentClass: selectedStudent.currentClass,
        parentId: "", // We'll need to get this from the backend if needed
      });
    }
  }, [selectedStudent, isEditModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      await updateStudentMutation.mutateAsync({
        id: selectedStudentId,
        data: formData,
      });
      console.log("Student updated successfully");
      setEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating student:", error);
      alert(error?.response?.data?.message || "Failed to update student");
    }
  };

  // Filter only parent users
  const parentUsers = users?.filter((user) => user.role === "parent") || [];

  if (!isEditModalOpen || !selectedStudent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit Student</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Student ID</label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              value={formData.currentClass}
              onChange={(e) =>
                setFormData({ ...formData, currentClass: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a class</option>
              {classrooms?.map((classroom) => (
                <option key={classroom._id} value={classroom.name}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Parent (Optional)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select a parent</option>
              {parentUsers.map((parent) => (
                <option key={parent._id} value={parent._id}>
                  {parent.name} ({parent.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={updateStudentMutation.isPending}
            >
              {updateStudentMutation.isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
