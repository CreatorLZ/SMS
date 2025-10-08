import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Input } from "./input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { useFeeStore } from "../../store/feeStore";
import { useClassroomsQuery } from "../../hooks/useClassroomsQuery";
import { useTermsQuery } from "../../hooks/useTermsQuery";
import { Download, Search, DollarSign } from "lucide-react";

interface ArrearsReportProps {
  onExport?: () => void;
}

export default function ArrearsReport({ onExport }: ArrearsReportProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const { arrears, isLoadingArrears } = useFeeStore();
  const { data: classrooms = [] } = useClassroomsQuery();
  const { data: terms = [] } = useTermsQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  // Filter arrears based on search and filters
  const filteredArrears = arrears.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClassroom =
      selectedClassroom === "" ||
      selectedClassroom === "all" ||
      student.classroom === selectedClassroom;

    const matchesTerm =
      selectedTerm === "" ||
      selectedTerm === "all" ||
      student.outstandingFees.some((fee) => fee.term === selectedTerm);

    return matchesSearch && matchesClassroom && matchesTerm;
  });

  // Calculate totals
  const totalStudents = filteredArrears.length;
  const totalUnpaidAmount = filteredArrears.reduce(
    (sum, student) => sum + student.totalOutstanding,
    0
  );
  const totalUnpaidFees = filteredArrears.reduce(
    (sum, student) => sum + student.outstandingFees.length,
    0
  );

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      [
        "Student ID",
        "Name",
        "Class",
        "Term",
        "Session",
        "Total Amount",
        "Amount Paid",
        "Balance",
        "PIN Code",
      ].join(","),
      ...filteredArrears.flatMap((student) =>
        student.outstandingFees.map((fee) =>
          [
            student.studentId,
            `"${student.fullName}"`,
            student.currentClass,
            fee.term,
            fee.session,
            fee.amount,
            fee.amountPaid || 0,
            fee.balance,
            fee.pinCode,
          ].join(",")
        )
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arrears-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    if (onExport) onExport();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalUnpaidAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Students with Arrears
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Unpaid Fees
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {totalUnpaidFees}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Arrears Report</CardTitle>
            <Button
              onClick={handleExport}
              disabled={filteredArrears.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedClassroom}
              onValueChange={setSelectedClassroom}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classrooms.map((classroom: any) => (
                  <SelectItem key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="1st">1st Term</SelectItem>
                <SelectItem value="2nd">2nd Term</SelectItem>
                <SelectItem value="3rd">3rd Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingArrears ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : filteredArrears.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {arrears.length === 0
                  ? "No students with arrears found"
                  : "No students match the current filters"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Outstanding Fees</TableHead>
                    <TableHead>Total Outstanding</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArrears.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {student.studentId}
                      </TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.currentClass}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {student.outstandingFees.length} fees
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(student.totalOutstanding)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.outstandingFees
                            .slice(0, 2)
                            .map((fee: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                {fee.term} {fee.session}: Balance{" "}
                                {formatCurrency(fee.balance)}
                                {fee.amountPaid > 0 &&
                                  ` (₦${formatCurrency(fee.amountPaid)} paid)`}
                              </div>
                            ))}
                          {student.outstandingFees.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{student.outstandingFees.length - 2} more fees
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
