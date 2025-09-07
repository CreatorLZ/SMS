import { useState, useEffect } from "react";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";

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
    subjectSpecialization: "",
    assignedClassId: "",
  });

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        email: teacher.email,
        subjectSpecialization: teacher.subjectSpecialization || "",
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
        subjectSpecialization: formData.subjectSpecialization || undefined,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Teacher</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Subject Specialization
            </label>
            <input
              type="text"
              value={formData.subjectSpecialization}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subjectSpecialization: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              placeholder="e.g., Mathematics, English, Science"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Assign to Class (Optional)
            </label>
            <select
              value={formData.assignedClassId}
              onChange={(e) =>
                setFormData({ ...formData, assignedClassId: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">No class assignment</option>
              {classrooms?.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
