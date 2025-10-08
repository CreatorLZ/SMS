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
import { CheckCircle, XCircle, DollarSign, Search } from "lucide-react";

interface StudentFeeRowProps {
  student: any;
  onViewFees: (studentId: string) => void;
  formatCurrency: (amount: number) => string;
}

function StudentFeeRow({
  student,
  onViewFees,
  formatCurrency,
}: StudentFeeRowProps) {
  const { data: feeSummary, isLoading } = useStudentFeeSummary(student._id);

  return (
    <TableRow>
      <TableCell className="font-medium">{student.studentId}</TableCell>
      <TableCell>{student.fullName}</TableCell>
      <TableCell>{student.currentClass}</TableCell>
      <TableCell>
        {isLoading ? (
          <div className="w-8 h-4 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <Badge variant="outline" className="bg-green-50">
            {feeSummary?.paidFees || 0}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <div className="w-8 h-4 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <Badge variant="destructive">{feeSummary?.unpaidFees || 0}</Badge>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          formatCurrency(feeSummary?.totalAmount || 0)
        )}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewFees(student._id)}
        >
          View Fees
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface StudentFeeTableProps {
  onMarkPaidClick?: (student: any, fee: any) => void;
}

export default function StudentFeeTable({
  onMarkPaidClick,
}: StudentFeeTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

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

  const handleViewFees = async (studentId: string) => {
    try {
      await getStudentFees(studentId);
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
      {/* Current Student Fees Display */}
      {studentFees && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Fee Details - {studentFees.fullName} ({studentFees.studentId})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Viewable</TableHead>
                    <TableHead>PIN Code</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees.termFees.map((fee: any) => (
                    <TableRow key={`${fee.term}-${fee.session}`}>
                      <TableCell className="font-medium">
                        {fee.term} {fee.session}
                      </TableCell>
                      <TableCell>{formatCurrency(fee.amount)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(fee.paid)}</TableCell>
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
                          ? new Date(fee.paymentDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {!fee.paid && (
                          <Button
                            size="sm"
                            onClick={() => onMarkPaidClick?.(studentFees, fee)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <TableHead>Paid Fees</TableHead>
                    <TableHead>Unpaid Fees</TableHead>
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
    </div>
  );
}
