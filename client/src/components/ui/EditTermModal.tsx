import { useState, useEffect } from "react";
import { useUpdateTermMutation } from "@/hooks/useUpdateTermMutation";
import { useTermManagementStore } from "@/store/termManagementStore";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import HolidayForm from "./HolidayForm";
import HolidayList from "./HolidayList";
import { Calendar, X, ChevronDown, ChevronUp } from "lucide-react";

interface Holiday {
  name: string;
  startDate: string;
  endDate: string;
}

export default function EditTermModal() {
  const { isEditModalOpen, selectedTerm, setEditModalOpen, setSelectedTerm } =
    useTermManagementStore();
  const updateTermMutation = useUpdateTermMutation();

  const [formData, setFormData] = useState({
    name: "1st" as "1st" | "2nd" | "3rd",
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
  });

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHolidayIndex, setEditingHolidayIndex] = useState<number | null>(
    null
  );
  const [showHolidays, setShowHolidays] = useState(true);

  // Update form data when selectedTerm changes
  useEffect(() => {
    if (selectedTerm) {
      setFormData({
        name: selectedTerm.name,
        year: selectedTerm.year,
        startDate: selectedTerm.startDate.split("T")[0], // Convert to YYYY-MM-DD format
        endDate: selectedTerm.endDate.split("T")[0],
      });
      setHolidays(selectedTerm.holidays || []);
    }
  }, [selectedTerm]);

  // Holiday management handlers
  const handleAddHoliday = () => {
    setEditingHolidayIndex(null);
    setShowHolidayForm(true);
  };

  const handleEditHoliday = (index: number) => {
    setEditingHolidayIndex(index);
    setShowHolidayForm(true);
  };

  const handleDeleteHoliday = (index: number) => {
    if (confirm("Are you sure you want to delete this holiday?")) {
      const newHolidays = holidays.filter((_, i) => i !== index);
      setHolidays(newHolidays);
    }
  };

  const handleSaveHoliday = (holiday: Holiday) => {
    if (editingHolidayIndex !== null) {
      // Edit existing holiday
      const newHolidays = [...holidays];
      newHolidays[editingHolidayIndex] = holiday;
      setHolidays(newHolidays);
    } else {
      // Add new holiday
      setHolidays([...holidays, holiday]);
    }
    setShowHolidayForm(false);
    setEditingHolidayIndex(null);
  };

  const handleCancelHolidayForm = () => {
    setShowHolidayForm(false);
    setEditingHolidayIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTerm) return;

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
      await updateTermMutation.mutateAsync({
        id: selectedTerm._id,
        data: {
          ...formData,
          holidays,
        },
      });
      alert("Term updated successfully!");
      setEditModalOpen(false);
      setSelectedTerm(null);
    } catch (error: any) {
      console.error("Error updating term:", error);
      alert(
        `Error updating term: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const handleClose = () => {
    setEditModalOpen(false);
    setSelectedTerm(null);
  };

  if (!isEditModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Edit Term
          </h2>
          <button
            onClick={handleClose}
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
                  htmlFor="year"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Year *
                </label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  placeholder="Enter year"
                  required
                />
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

          {/* Holiday Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Holiday Management</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowHolidays(!showHolidays)}
              >
                {showHolidays ? (
                  <ChevronUp className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-2" />
                )}
                {showHolidays ? "Hide" : "Show"} Holidays
              </Button>
            </div>

            {showHolidays && (
              <div className="space-y-4">
                {showHolidayForm ? (
                  <HolidayForm
                    holiday={
                      editingHolidayIndex !== null
                        ? holidays[editingHolidayIndex]
                        : undefined
                    }
                    termStartDate={formData.startDate}
                    termEndDate={formData.endDate}
                    onSave={handleSaveHoliday}
                    onCancel={handleCancelHolidayForm}
                    isEditing={editingHolidayIndex !== null}
                  />
                ) : (
                  <HolidayList
                    holidays={holidays}
                    termStartDate={formData.startDate}
                    termEndDate={formData.endDate}
                    onAddHoliday={handleAddHoliday}
                    onEditHoliday={handleEditHoliday}
                    onDeleteHoliday={handleDeleteHoliday}
                  />
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTermMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateTermMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating Term...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Update Term
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
