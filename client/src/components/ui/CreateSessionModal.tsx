import { useState } from "react";
import { useCreateSessionMutation } from "../../hooks/useSessionsQuery";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { GraduationCap, X } from "lucide-react";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
}: CreateSessionModalProps) {
  const createSessionMutation = useCreateSessionMutation();
  const [formData, setFormData] = useState({
    name: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    isActive: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      alert("Session name is required");
      return;
    }

    if (!formData.startYear || !formData.endYear) {
      alert("Start year and end year are required");
      return;
    }

    if (formData.startYear >= formData.endYear) {
      alert("End year must be greater than start year");
      return;
    }

    try {
      await createSessionMutation.mutateAsync(formData);
      alert("Session created successfully!");
      onClose();
      setFormData({
        name: "",
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 1,
        isActive: false,
      });
    } catch (error: any) {
      console.error("Error creating session:", error);
      alert(
        `Error creating session: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Auto-generate session name when years change
  const handleYearChange = (field: "startYear" | "endYear", value: number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate name if both years are valid
      if (
        updated.startYear &&
        updated.endYear &&
        updated.endYear > updated.startYear
      ) {
        updated.name = `${updated.startYear}/${updated.endYear}`;
      }
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6" />
            Create Academic Session
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="startYear"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Start Year *
                </label>
                <Input
                  id="startYear"
                  type="number"
                  value={formData.startYear}
                  onChange={(e) =>
                    handleYearChange("startYear", parseInt(e.target.value))
                  }
                  placeholder="2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="endYear"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  End Year *
                </label>
                <Input
                  id="endYear"
                  type="number"
                  value={formData.endYear}
                  onChange={(e) =>
                    handleYearChange("endYear", parseInt(e.target.value))
                  }
                  placeholder="2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Session Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="2024/2025"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border border-gray-300"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Set as active session
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSessionMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createSessionMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Session...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export a function to open the modal
export const useCreateSessionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
};
