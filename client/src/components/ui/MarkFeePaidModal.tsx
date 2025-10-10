import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Separator } from "./separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
// Using simple modal implementation without Radix UI
import { useStudentFees } from "../../hooks/useStudentFees";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFeeModalStore } from "../../store/feeModalStore";
import {
  CreditCard,
  DollarSign,
  Key,
  User,
  Calendar,
  Receipt,
  CheckCircle,
  XCircle,
  X,
  Loader2,
} from "lucide-react";

export default function MarkFeePaidModal() {
  const {
    isMarkPaidModalOpen,
    selectedStudent,
    selectedFee,
    closeMarkPaidModal,
  } = useFeeModalStore();
  const [formData, setFormData] = useState({
    paymentAmount: "",
    paymentMethod: "",
    receiptNumber: "",
  });
  const [modalState, setModalState] = useState<"idle" | "loading" | "success">(
    "idle"
  );

  const { markFeePaid } = useStudentFees();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !selectedFee) return;

    // Set loading state
    setModalState("loading");

    try {
      await markFeePaid({
        studentId: selectedStudent._id,
        term: selectedFee.term,
        session: selectedFee.session,
        paymentAmount:
          parseFloat(formData.paymentAmount) ||
          selectedFee.amount - (selectedFee.amountPaid || 0),
        paymentMethod: formData.paymentMethod || "cash",
        receiptNumber: formData.receiptNumber,
      });

      // Invalidate all relevant queries to refresh the UI immediately
      await queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "studentFeeSummary",
      });
      await queryClient.invalidateQueries({ queryKey: ["arrears"] });
      await queryClient.invalidateQueries({ queryKey: ["feeStructures"] });

      // Show success state immediately (no gap!)
      setModalState("success");

      // Reset form and close modal after showing success for 2 seconds
      setTimeout(() => {
        setFormData({
          paymentAmount: "",
          paymentMethod: "",
          receiptNumber: "",
        });
        setModalState("idle");
        closeMarkPaidModal();

        // Show toast notification after modal closes
        setTimeout(() => {
          toast.success("Payment recorded successfully!");
        }, 100);
      }, 2000);
    } catch (error: any) {
      // Reset to idle state on error
      setModalState("idle");

      // Show error toast
      toast.error(
        error.response?.data?.message || "Failed to mark fee as paid"
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (!isMarkPaidModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-gray-200 flex flex-col relative">
        {/* Loading Overlay */}
        {modalState === "loading" && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-gray-700">
                Processing payment...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-gray-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Record Payment
              </h1>
              <p className="text-sm text-gray-600">
                Complete payment to grant result access
              </p>
            </div>
          </div>
          <button
            onClick={closeMarkPaidModal}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedStudent && selectedFee && (
            <div className="p-6">
              {modalState === "success" ? (
                /* Success Screen */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Payment Recorded Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    The student's fee has been marked as paid and result access
                    has been granted.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-sm">
                    <div className="text-center">
                      <div className="text-lg font-mono font-bold text-blue-700 mb-1">
                        {selectedFee.pinCode}
                      </div>
                      <p className="text-xs text-gray-600">Result Access PIN</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Student Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {selectedStudent.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID: {selectedStudent.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(
                            selectedFee.amount - (selectedFee.amountPaid || 0)
                          )}
                        </div>
                        <div className="text-sm text-gray-600">Balance Due</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {selectedFee.term} {selectedFee.session}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
                          Term
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {formatCurrency(selectedFee.amountPaid || 0)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
                          Paid
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(selectedFee.amount)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
                          Total
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Payment Details
                        </h3>

                        {/* Payment Amount */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Amount to Pay *
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">₦</span>
                            </div>
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*[.,]?[0-9]*"
                              placeholder="0.00"
                              value={formData.paymentAmount}
                              onChange={(e) =>
                                handleInputChange(
                                  "paymentAmount",
                                  e.target.value.replace(/[^0-9.]/g, "")
                                )
                              }
                              className="pl-8 h-10 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          {formData.paymentAmount && (
                            <div className="text-sm text-gray-600">
                              {formatCurrency(
                                parseFloat(formData.paymentAmount) || 0
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            Maximum:{" "}
                            {formatCurrency(
                              selectedFee.amount - (selectedFee.amountPaid || 0)
                            )}
                          </p>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Payment Method
                          </Label>
                          <Select
                            value={formData.paymentMethod}
                            onValueChange={(value) =>
                              handleInputChange("paymentMethod", value)
                            }
                          >
                            <SelectTrigger className="h-10 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash Payment</SelectItem>
                              <SelectItem value="bank_transfer">
                                Bank Transfer
                              </SelectItem>
                              <SelectItem value="online">
                                Online Payment
                              </SelectItem>
                              <SelectItem value="mobile_money">
                                Mobile Money
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Receipt Number */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Receipt Number
                          </Label>
                          <Input
                            placeholder="Enter receipt number (optional)"
                            value={formData.receiptNumber}
                            onChange={(e) =>
                              handleInputChange("receiptNumber", e.target.value)
                            }
                            className="h-10 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Access PIN */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                          <Key className="w-5 h-5" />
                          Result Access PIN
                        </h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-xl font-mono font-bold text-blue-700 mb-2">
                              {selectedFee.pinCode}
                            </div>
                            <p className="text-sm text-gray-600">
                              Share this PIN with the student after payment
                              confirmation
                            </p>
                          </div>
                        </div>

                        {/* Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-yellow-600 text-sm font-bold mt-0.5">
                              !
                            </span>
                            <div>
                              <h4 className="font-medium text-yellow-800 mb-1">
                                Important
                              </h4>
                              <p className="text-sm text-yellow-700">
                                This action cannot be undone. Payment
                                confirmation will grant immediate result access.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeMarkPaidModal}
                        className="px-6 py-2 border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={modalState === "loading"}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {modalState === "loading" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Confirm Payment
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
