import { useState } from "react";
import { useCreateClassroomMutation } from "@/hooks/useCreateClassroomMutation";
import { useTeachersQuery, Teacher } from "@/hooks/useTeachersQuery";
import { useClassroomManagementStore } from "@/store/classroomManagementStore";
import { STUDENT_CLASSES } from "@/constants/classes";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create New Classroom</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Classroom Name
            </label>
            <select
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded"
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <select
              value={formData.teacherId}
              onChange={(e) =>
                setFormData({ ...formData, teacherId: e.target.value })
              }
              className="w-full p-2 border rounded"
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={createClassroomMutation.isPending}
            >
              {createClassroomMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
