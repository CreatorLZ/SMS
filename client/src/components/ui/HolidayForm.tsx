import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Calendar, X, Plus } from "lucide-react";

interface Holiday {
  name: string;
  startDate: string;
  endDate: string;
}

interface HolidayFormProps {
  holiday?: Holiday;
  termStartDate: string;
  termEndDate: string;
  onSave: (holiday: Holiday) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function HolidayForm({
  holiday,
  termStartDate,
  termEndDate,
  onSave,
  onCancel,
  isEditing = false,
}: HolidayFormProps) {
  const [formData, setFormData] = useState<Holiday>({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name,
        startDate: holiday.startDate.split("T")[0], // Convert to YYYY-MM-DD
        endDate: holiday.endDate.split("T")[0],
      });
    }
  }, [holiday]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Holiday name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const termStart = new Date(termStartDate);
      const termEnd = new Date(termEndDate);

      if (startDate > endDate) {
        newErrors.endDate = "End date must be after start date";
      }

      if (startDate < termStart || startDate > termEnd) {
        newErrors.startDate = "Start date must be within term dates";
      }

      if (endDate < termStart || endDate > termEnd) {
        newErrors.endDate = "End date must be within term dates";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {isEditing ? "Edit Holiday" : "Add Holiday"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Holiday Name *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Christmas Break"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date *</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              min={termStartDate.split("T")[0]}
              max={termEndDate.split("T")[0]}
              className={errors.startDate ? "border-red-500" : ""}
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date *</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              min={termStartDate.split("T")[0]}
              max={termEndDate.split("T")[0]}
              className={errors.endDate ? "border-red-500" : ""}
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={handleSubmit} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {isEditing ? "Update Holiday" : "Add Holiday"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
