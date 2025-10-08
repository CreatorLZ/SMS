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
    paymentMethod: "",
    receiptNumber: "",
  });

  const { markFeePaid, isMarkingPaid } = useStudentFees();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student || !fee) return;

    try {
      await markFeePaid({
        studentId: student._id,
        term: fee.term,
        session: fee.session,
        paymentMethod: formData.paymentMethod || "cash",
        receiptNumber: formData.receiptNumber,
      });

      alert("Fee marked as paid successfully!");
      setFormData({ paymentMethod: "", receiptNumber: "" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Confirm Fee Payment
              </h2>
              <p className="text-sm text-gray-600">
                Mark this fee as paid to allow the student access to results
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {student && fee && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Fee & Student Details */}
              <div className="space-y-4">
                {/* Fee Details Card */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Fee Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Term & Year
                        </div>
                        <div className="font-semibold">
                          {fee.term} {fee.session}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          Amount
                        </div>
                        <div className="font-semibold text-green-600 text-lg">
                          {formatCurrency(fee.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Key className="w-4 h-4" />
                        PIN Code
                      </div>
                      <code className="bg-gray-100 px-3 py-2 rounded-md text-sm font-mono block">
                        {fee.pinCode}
                      </code>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Details Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-blue-600" />
                      Student Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Full Name</div>
                      <div className="font-semibold">{student.fullName}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Student ID</div>
                      <div className="font-semibold">{student.studentId}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notes */}
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-amber-800 text-lg flex items-center gap-2">
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                      Important Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>
                          This action <strong>cannot be undone</strong> once
                          confirmed
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>
                          Student will immediately be able to view their{" "}
                          <strong>results</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>
                          Payment will be recorded in the{" "}
                          <strong>audit trail</strong>
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Payment Form */}
              <div className="space-y-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Payment Details
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter payment information to complete the transaction
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="paymentMethod"
                          className="text-sm font-medium"
                        >
                          Payment Method
                        </Label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value) =>
                            handleInputChange("paymentMethod", value)
                          }
                        >
                          <SelectTrigger className="w-full h-11">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Cash
                              </div>
                            </SelectItem>
                            <SelectItem value="bank_transfer">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Bank Transfer
                              </div>
                            </SelectItem>
                            <SelectItem value="online">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                Online Payment
                              </div>
                            </SelectItem>
                            <SelectItem value="check">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Check
                              </div>
                            </SelectItem>
                            <SelectItem value="mobile_money">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                Mobile Money
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="receiptNumber"
                          className="text-sm font-medium"
                        >
                          Receipt Number
                          <span className="text-gray-500 font-normal ml-1">
                            (Optional)
                          </span>
                        </Label>
                        <Input
                          id="receiptNumber"
                          placeholder="Enter receipt number for reference"
                          value={formData.receiptNumber}
                          onChange={(e) =>
                            handleInputChange("receiptNumber", e.target.value)
                          }
                          className="h-11"
                        />
                        <p className="text-xs text-gray-500">
                          If available, enter the receipt number for record
                          keeping
                        </p>
                      </div>

                      <Separator className="my-4" />

                      {/* Success Preview */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            After confirmation:
                          </span>
                        </div>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <Badge className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                            <span>Fee status will be updated</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <Badge className="bg-blue-100 text-blue-800">
                              Viewable
                            </Badge>
                            <span>Results will be accessible to student</span>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-11"
              >
                Cancel Payment
              </Button>
              <Button
                onClick={(e) => {
                  // Find the form element and trigger submit
                  const form = (e.target as HTMLElement)
                    .closest(".modal-content")
                    ?.querySelector("form");
                  form?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
                }}
                disabled={isMarkingPaid}
                className="w-full sm:w-auto h-11 bg-green-600 hover:bg-green-700"
              >
                {isMarkingPaid ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Confirm Payment
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
