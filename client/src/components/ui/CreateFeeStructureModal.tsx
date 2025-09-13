import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
// Using simple modal implementation without Radix UI
import { useFeeStructures } from "../../hooks/useFeeStructures";
import { useClassroomsQuery } from "../../hooks/useClassroomsQuery";
import { useTermsQuery } from "../../hooks/useTermsQuery";

interface CreateFeeStructureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateFeeStructureModal({
  open,
  onOpenChange,
}: CreateFeeStructureModalProps) {
  const [formData, setFormData] = useState({
    classroomId: "",
    termId: "",
    amount: "",
  });

  const { createFeeStructure, isCreating } = useFeeStructures();
  const { data: classrooms = [] } = useClassroomsQuery();
  const { data: terms = [] } = useTermsQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.classroomId || !formData.termId || !formData.amount) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createFeeStructure({
        classroomId: formData.classroomId,
        termId: formData.termId,
        amount: parseFloat(formData.amount),
      });

      alert("Fee structure created successfully!");
      setFormData({ classroomId: "", termId: "", amount: "" });
      onOpenChange(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create fee structure");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create Fee Structure</h2>
          <p className="text-sm text-gray-600">
            Set up a fee structure for a specific classroom and term
            combination.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classroom">Classroom</Label>
            <Select
              value={formData.classroomId}
              onValueChange={(value) => handleInputChange("classroomId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom: any) => (
                  <SelectItem key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Select
              value={formData.termId}
              onValueChange={(value) => handleInputChange("termId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term: any) => (
                  <SelectItem key={term._id} value={term._id}>
                    {term.name} {term.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Fee Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter fee amount"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Fee Structure"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
