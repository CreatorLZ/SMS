import { useState } from "react";
import { useCreateTermMutation } from "@/hooks/useCreateTermMutation";
import { useTermManagementStore } from "@/store/termManagementStore";
import { useSessionsQuery } from "@/hooks/useSessionsQuery";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Calendar, X } from "lucide-react";

export default function CreateTermModal() {
  const { isCreateModalOpen, setCreateModalOpen } = useTermManagementStore();
  const createTermMutation = useCreateTermMutation();
  const { data: sessions, isLoading: sessionsLoading } = useSessionsQuery();
  const [formData, setFormData] = useState({
    name: "1st" as "1st" | "2nd" | "3rd",
    sessionId: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.sessionId) {
      alert("Session is required");
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
        sessionId: "",
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Create New Term
          </h2>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Term Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Term Name *
                </label>
                <select
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value as "1st" | "2nd" | "3rd",
                    })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="1st">First Term</option>
                  <option value="2nd">Second Term</option>
                  <option value="3rd">Third Term</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="session"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Academic Session *
                </label>
                <select
                  id="session"
                  value={formData.sessionId}
                  onChange={(e) =>
                    setFormData({ ...formData, sessionId: e.target.value })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={sessionsLoading}
                >
                  <option value="">
                    {sessionsLoading ? "Loading sessions..." : "Select Session"}
                  </option>
                  {sessions?.map((session) => (
                    <option key={session._id} value={session._id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="startDate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Start Date *
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="endDate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  End Date *
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTermMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createTermMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Term...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Term
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
