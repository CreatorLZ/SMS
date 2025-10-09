import { useState, useRef, useEffect } from "react";
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
import { useStudentsQuery } from "../../hooks/useStudentsQuery";
import {
  useStudentFees,
  useStudentFeeSummary,
} from "../../hooks/useStudentFees";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Search,
  CreditCard,
} from "lucide-react";

interface StudentFeeRowProps {
  student: any;
  onViewFees: (student: any) => void;
  formatCurrency: (amount: number) => string;
}

function StudentFeeRow({
  student,
  onViewFees,
  formatCurrency,
}: StudentFeeRowProps) {
  const { data: feeSummary, isLoading } = useStudentFeeSummary(student._id);

  // Calculate total paid and balance from fee summary
  const totalPaid = feeSummary?.paidFees || 0;
  const totalUnpaid = feeSummary?.unpaidFees || 0;
  const totalAmount = feeSummary?.totalAmount || 0;
  const balance = totalAmount - totalPaid;

  return (
    <TableRow>
      <TableCell className="font-medium">{student.studentId}</TableCell>
      <TableCell>{student.fullName}</TableCell>
      <TableCell>{student.currentClass}</TableCell>
      <TableCell>
        {isLoading ? (
          <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <span className="font-medium text-green-600">
            {formatCurrency(totalPaid)}
          </span>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <span
            className={`font-medium ${
              balance > 0 ? "text-orange-600" : "text-green-600"
            }`}
          >
            {formatCurrency(balance)}
          </span>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          formatCurrency(totalAmount)
        )}
      </TableCell>
      <TableCell>
        <Button size="sm" variant="outline" onClick={() => onViewFees(student)}>
          Manage Fees
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface StudentFeeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onMarkPaidClick?: (student: any, fee: any) => void;
}

function StudentFeeDetailsModal({
  open,
  onOpenChange,
  student,
  onMarkPaidClick,
}: StudentFeeDetailsModalProps) {
  const { studentFees, isLoadingStudentFees } = useFeeStore();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getPaymentStatusBadge = (paid: boolean) => {
    return paid ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Unpaid
      </Badge>
    );
  };

  const getViewableStatusBadge = (viewable: boolean) => {
    return viewable ? (
      <Badge className="bg-blue-100 text-blue-800">Viewable</Badge>
    ) : (
      <Badge variant="secondary">Not Viewable</Badge>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Fee Details - {student?.fullName}
              </h2>
              <p className="text-sm text-gray-600">
                Student ID: {student?.studentId} | Class:{" "}
                {student?.currentClass}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoadingStudentFees ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : studentFees ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Fees
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {studentFees.termFees.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Paid Fees
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {studentFees.termFees.filter((f) => f.paid).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Outstanding
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {studentFees.termFees.filter((f) => !f.paid).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          studentFees.termFees.reduce(
                            (sum, f) => sum + f.amount,
                            0
                          )
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Details Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Fee Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Amount Paid</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Viewable</TableHead>
                          <TableHead>PIN Code</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentFees.termFees.map((fee: any) => {
                          const amountPaid = fee.amountPaid || 0;
                          const balance = fee.amount - amountPaid;
                          const isOutstanding = balance > 0;

                          return (
                            <TableRow key={`${fee.term}-${fee.session}`}>
                              <TableCell className="font-medium">
                                {fee.term} {fee.session}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(fee.amount)}
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {formatCurrency(amountPaid)}
                              </TableCell>
                              <TableCell
                                className={
                                  balance > 0
                                    ? "text-orange-600 font-medium"
                                    : "text-green-600"
                                }
                              >
                                {formatCurrency(balance)}
                              </TableCell>
                              <TableCell>
                                {getPaymentStatusBadge(fee.paid)}
                              </TableCell>
                              <TableCell>
                                {getViewableStatusBadge(fee.viewable)}
                              </TableCell>
                              <TableCell>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {fee.pinCode}
                                </code>
                              </TableCell>
                              <TableCell>
                                {fee.paymentDate
                                  ? new Date(
                                      fee.paymentDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                {isOutstanding && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      onMarkPaidClick?.(studentFees, fee)
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Make Payment
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No fee data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StudentFeeTableProps {
  onMarkPaidClick?: (student: any, fee: any) => void;
}

export default function StudentFeeTable({
  onMarkPaidClick,
}: StudentFeeTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] =
    useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const {
    studentFees,
    isLoadingStudentFees,
    studentFeesPage,
    studentFeesSearch,
    studentFeesClassFilter,
    setStudentFeesPage,
    setStudentFeesSearch,
    setStudentFeesClassFilter,
  } = useFeeStore();

  const { data: studentsResponse, isLoading: isLoadingStudents } =
    useStudentsQuery(
      studentFeesSearch,
      studentFeesClassFilter,
      studentFeesPage
    );

  const students = studentsResponse?.students || [];

  // Auto-scroll to top when page changes
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [studentFeesPage]);
  const { getStudentFees } = useStudentFees();

  const handleViewFees = async (student: any) => {
    setSelectedStudentForDetails(student);
    setIsDetailsModalOpen(true);
    try {
      await getStudentFees(student._id);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to load student fees");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getPaymentStatusBadge = (paid: boolean) => {
    return paid ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Unpaid
      </Badge>
    );
  };

  const getViewableStatusBadge = (viewable: boolean) => {
    return viewable ? (
      <Badge className="bg-blue-100 text-blue-800">Viewable</Badge>
    ) : (
      <Badge variant="secondary">Not Viewable</Badge>
    );
  };

  // Get unique classrooms for filter
  const classrooms = [
    ...new Set(
      students
        .map((student: any) => student.classroomId)
        .filter((classroomId) => classroomId) // Remove undefined values
    ),
  ];

  return (
    <div ref={tableRef} className="space-y-6">
      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Fee Management</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={studentFeesSearch}
                onChange={(e) => setStudentFeesSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={studentFeesClassFilter}
              onValueChange={setStudentFeesClassFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Classrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classrooms</SelectItem>
                {classrooms.map((classroomId) => {
                  const classroom = students.find(
                    (s: any) => s.classroomId === classroomId
                  );
                  return (
                    <SelectItem key={classroomId} value={classroomId}>
                      {classroom?.currentClass || classroomId}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <StudentFeeRow
                      key={student._id}
                      student={student}
                      onViewFees={handleViewFees}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {students.length === 0 && !isLoadingStudents && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {studentsResponse?.pagination &&
        studentsResponse.pagination.pages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {(studentFeesPage - 1) *
                    (studentsResponse.pagination.limit || 10) +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    studentFeesPage * (studentsResponse.pagination.limit || 10),
                    studentsResponse.pagination.total
                  )}{" "}
                  of {studentsResponse.pagination.total} students
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStudentFeesPage(studentFeesPage - 1)}
                    disabled={studentFeesPage <= 1 || isLoadingStudents}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      {
                        length: Math.min(5, studentsResponse.pagination.pages),
                      },
                      (_, i) => {
                        let pageNum;
                        if (studentsResponse.pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (studentFeesPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          studentFeesPage >=
                          studentsResponse.pagination.pages - 2
                        ) {
                          pageNum = studentsResponse.pagination.pages - 4 + i;
                        } else {
                          pageNum = studentFeesPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pageNum === studentFeesPage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setStudentFeesPage(pageNum)}
                            disabled={isLoadingStudents}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStudentFeesPage(studentFeesPage + 1)}
                    disabled={
                      studentFeesPage >= studentsResponse.pagination.pages ||
                      isLoadingStudents
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Student Fee Details Modal */}
      <StudentFeeDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        student={selectedStudentForDetails}
        onMarkPaidClick={onMarkPaidClick}
      />
    </div>
  );
}
