import { useState, useEffect } from "react";
import { useUpdateStudentMutation } from "@/hooks/useUpdateStudentMutation";
import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { Toast } from "./Toast";
import {
  STUDENT_CLASSES,
  STUDENT_CLASS_VALUES,
  isValidStudentClass,
} from "@/constants/classes";

export default function EditStudentModal() {
  const { isEditModalOpen, selectedStudentId, setEditModalOpen } =
    useStudentManagementStore();
  const updateStudentMutation = useUpdateStudentMutation();
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
    gender: "",
    dateOfBirth: "",
    address: "",
    location: "",
    parentName: "",
    parentPhone: "",
    relationshipToStudent: "",
    admissionDate: "",
  });

  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  // Find parent of selected student by checking linkedStudentIds
  const findParentId = (studentId: string) => {
    return (
      users?.data?.find(
        (user) =>
          user.role === "parent" &&
          user.linkedStudentIds?.some((student) => student._id === studentId)
      )?._id || ""
    );
  };

  useEffect(() => {
    if (selectedStudent && isEditModalOpen) {
      const parentId = findParentId(selectedStudent._id);
      setFormData({
        fullName: selectedStudent.fullName || "",
        studentId: selectedStudent.studentId || "",
        currentClass: selectedStudent.currentClass || "",
        parentId: parentId,
        gender: selectedStudent.gender || "",
        dateOfBirth: selectedStudent.dateOfBirth
          ? new Date(selectedStudent.dateOfBirth).toISOString().split("T")[0]
          : "",
        address: selectedStudent.address || "",
        location: selectedStudent.location || "",
        parentName: selectedStudent.parentName || "",
        parentPhone: selectedStudent.parentPhone || "",
        relationshipToStudent: selectedStudent.relationshipToStudent || "",
        admissionDate: selectedStudent.admissionDate
          ? new Date(selectedStudent.admissionDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [selectedStudent, isEditModalOpen, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      await updateStudentMutation.mutateAsync({
        id: selectedStudentId,
        data: formData,
      });
      showToastMessage("Student updated successfully!", "success");
      setEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating student:", error);
      showToastMessage(
        error?.response?.data?.message || "Failed to update student",
        "error"
      );
    }
  };

  // Filter only parent users
  const parentUsers =
    users?.data?.filter((user) => user.role === "parent") || [];

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
              {STUDENT_CLASSES.map((classOption) => (
                <option key={classOption.value} value={classOption.value}>
                  {classOption.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Parent Name
            </label>
            <input
              type="text"
              value={formData.parentName}
              onChange={(e) =>
                setFormData({ ...formData, parentName: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Parent Phone
            </label>
            <input
              type="tel"
              value={formData.parentPhone}
              onChange={(e) =>
                setFormData({ ...formData, parentPhone: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
              pattern="[0-9]*"
              title="Please enter only digits"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Relationship to Student
            </label>
            <select
              value={formData.relationshipToStudent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  relationshipToStudent: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select relationship</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Admission Date
            </label>
            <input
              type="date"
              value={formData.admissionDate}
              onChange={(e) =>
                setFormData({ ...formData, admissionDate: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
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
