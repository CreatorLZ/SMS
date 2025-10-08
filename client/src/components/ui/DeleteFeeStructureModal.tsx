import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { AlertTriangle, DollarSign, Users, Calendar } from "lucide-react";

interface DeleteFeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  feeStructure: any;
  isLoading?: boolean;
}

export default function DeleteFeeStructureModal({
  isOpen,
  onClose,
  onConfirm,
  feeStructure,
  isLoading = false,
}: DeleteFeeStructureModalProps) {
  if (!isOpen || !feeStructure) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg scale-in">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">
                Delete Fee Structure
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Fee Structure Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Fee Structure Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Classroom:</span>
                  <p className="font-medium">
                    {feeStructure.classroomId?.name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Term:</span>
                  <p className="font-medium">
                    {feeStructure.termId?.name} {feeStructure.termId?.year}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-medium text-lg text-green-600">
                    {formatCurrency(feeStructure.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Warning */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">
                    Impact on Students
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Deleting this fee structure will remove the corresponding
                    fee records from all students in this classroom. This action
                    cannot be reversed.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>
                  Are you sure you want to delete this fee structure?
                </strong>
                <br />
                This will permanently remove the fee configuration and all
                associated student fee records for this classroom and term
                combination.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Fee Structure"}
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
