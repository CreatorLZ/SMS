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
} from "lucide-react";

interface MarkFeePaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  fee?: any;
}

export default function MarkFeePaidModal({
  open,
  onOpenChange,
  student,
  fee,
}: MarkFeePaidModalProps) {
  const [formData, setFormData] = useState({
    paymentAmount: "",
    paymentMethod: "",
    receiptNumber: "",
  });

  const { markFeePaid, isMarkingPaid } = useStudentFees();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student || !fee) return;

    try {
      await markFeePaid({
        studentId: student._id,
        term: fee.term,
        session: fee.session,
        paymentAmount:
          parseFloat(formData.paymentAmount) ||
          fee.amount - (fee.amountPaid || 0),
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

      alert("Payment recorded successfully!");
      setFormData({ paymentAmount: "", paymentMethod: "", receiptNumber: "" });
      onOpenChange(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to mark fee as paid");
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] shadow-2xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white overflow-hidden flex-shrink-0">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Record Payment</h1>
                <p className="text-emerald-100 text-sm">
                  Complete this transaction to grant result access
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {student && fee && (
            <div className="p-8">
              {/* Transaction Summary */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {student.studentId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(fee.amount - (fee.amountPaid || 0))}
                    </div>
                    <div className="text-sm text-gray-600">Balance Due</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {fee.term} {fee.session}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Term
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(fee.amountPaid || 0)}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Paid
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(fee.amount)}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Total
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        Payment Information
                      </h3>

                      <div className="space-y-4">
                        {/* Payment Amount */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            Amount to Pay
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm">₦</span>
                            </div>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={formData.paymentAmount}
                              onChange={(e) =>
                                handleInputChange(
                                  "paymentAmount",
                                  e.target.value
                                )
                              }
                              className="pl-8 h-12 text-lg font-medium border-2 border-gray-200 focus:border-emerald-500 rounded-xl"
                              min="0"
                              max={fee.amount - (fee.amountPaid || 0)}
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            Maximum:{" "}
                            {formatCurrency(fee.amount - (fee.amountPaid || 0))}
                          </p>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            Payment Method
                          </Label>
                          <Select
                            value={formData.paymentMethod}
                            onValueChange={(value) =>
                              handleInputChange("paymentMethod", value)
                            }
                          >
                            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl">
                              <SelectValue placeholder="Choose payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span>Cash Payment</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="bank_transfer">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <span>Bank Transfer</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="online">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                  <span>Online Payment</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="mobile_money">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                                  <span>Mobile Money</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Receipt Number */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            Receipt Number
                            <span className="text-gray-500 font-normal ml-1">
                              (Optional)
                            </span>
                          </Label>
                          <Input
                            placeholder="Enter receipt number"
                            value={formData.receiptNumber}
                            onChange={(e) =>
                              handleInputChange("receiptNumber", e.target.value)
                            }
                            className="h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview & Actions */}
                  <div className="space-y-6">
                    {/* PIN Code Display */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Key className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Access PIN
                          </h4>
                          <p className="text-sm text-gray-600">
                            For result viewing
                          </p>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-dashed border-amber-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-mono font-bold text-amber-700 tracking-wider">
                          {fee.pinCode}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          Share this PIN with the student after payment
                        </p>
                      </div>
                    </div>

                    {/* What Happens Next */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            What Happens Next
                          </h4>
                          <p className="text-sm text-gray-600">
                            After payment confirmation
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">
                            Fee status updates to "Paid"
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">
                            Student can view results immediately
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">
                            Transaction recorded in audit log
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                          <span className="text-red-600 text-sm font-bold">
                            !
                          </span>
                        </div>
                        <h4 className="font-semibold text-red-900">
                          Important
                        </h4>
                      </div>
                      <p className="text-sm text-red-800 leading-relaxed">
                        This action cannot be undone. Once confirmed, the
                        payment will be recorded and the student will have
                        immediate access to their results.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-12 px-8 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isMarkingPaid}
                    className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isMarkingPaid ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Payment...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        Confirm Payment
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
