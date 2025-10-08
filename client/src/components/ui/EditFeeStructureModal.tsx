import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
// Using simple modal implementation without Radix UI
import { useFeeStructures } from "../../hooks/useFeeStructures";

interface EditFeeStructureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructure?: any;
}

export default function EditFeeStructureModal({
  open,
  onOpenChange,
  feeStructure,
}: EditFeeStructureModalProps) {
  const [amount, setAmount] = useState("");

  const { updateFeeStructure, isUpdating } = useFeeStructures();

  // Pre-populate form when feeStructure changes
  useEffect(() => {
    if (feeStructure) {
      setAmount(feeStructure.amount?.toString() || "");
    }
  }, [feeStructure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !feeStructure) {
      alert("Please enter a valid amount");
      return;
    }

    const newAmount = parseFloat(amount);
    if (isNaN(newAmount) || newAmount < 0) {
      alert("Please enter a valid positive amount");
      return;
    }

    try {
      await updateFeeStructure({
        id: feeStructure._id,
        amount: newAmount,
      });

      alert("Fee structure updated successfully!");
      onOpenChange(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update fee structure");
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === 0) return "₦0";

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  if (!open || !feeStructure) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Edit Fee Structure</h2>
          <p className="text-sm text-gray-600">
            Update the fee amount for this structure.
          </p>
        </div>

        {/* Display read-only information */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="text-sm">
            <span className="font-medium">Classroom:</span>{" "}
            {feeStructure.classroomId?.name}
          </div>
          <div className="text-sm">
            <span className="font-medium">Term:</span>{" "}
            {feeStructure.termId?.name} {feeStructure.termId?.year}
          </div>
          <div className="text-sm">
            <span className="font-medium">Current Amount:</span>{" "}
            {formatCurrency(feeStructure.amount)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">New Fee Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter new fee amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
              autoFocus
            />
            {amount && (
              <p className="text-sm text-muted-foreground font-medium">
                {formatCurrency(amount)}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Fee Structure"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
