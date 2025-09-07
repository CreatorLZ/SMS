import { useState } from "react";
import { useCreateTermMutation } from "@/hooks/useCreateTermMutation";
import { useTermManagementStore } from "@/store/termManagementStore";

export default function CreateTermModal() {
  const { isCreateModalOpen, setCreateModalOpen } = useTermManagementStore();
  const createTermMutation = useCreateTermMutation();
  const [formData, setFormData] = useState({
    name: "1st" as "1st" | "2nd" | "3rd",
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.year) {
      alert("Year is required");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert("Start date and end date are required");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert("End date must be after start date");
      return;
    }

    try {
      await createTermMutation.mutateAsync(formData);
      alert("Term created successfully!");
      setCreateModalOpen(false);
      setFormData({
        name: "1st",
        year: new Date().getFullYear(),
        startDate: "",
        endDate: "",
      });
    } catch (error: any) {
      console.error("Error creating term:", error);
      alert(
        `Error creating term: ${error.response?.data?.message || error.message}`
      );
    }
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create New Term</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Term Name</label>
            <select
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value as "1st" | "2nd" | "3rd",
                })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="1st">First Term</option>
              <option value="2nd">Second Term</option>
              <option value="3rd">Third Term</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
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
              disabled={createTermMutation.isPending}
            >
              {createTermMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
