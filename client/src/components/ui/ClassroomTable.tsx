import { useMemo, useState, useEffect } from "react";
import { Classroom } from "../../hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "../../store/classroomManagementStore";
import { useAuthStore } from "../../store/authStore";
import { AttendanceHistoryResponse } from "../../hooks/useAttendance";
import api from "../../lib/api";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Skeleton } from "./skeleton";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Eye,
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  BookOpen,
} from "lucide-react";

interface ClassroomTableProps {
  classrooms: Classroom[];
  onViewDetails: (classroomId: string) => void;
}

type SortField = "name" | "teacher" | "students" | "attendance" | "createdAt";
type SortDirection = "asc" | "desc";

export default function ClassroomTable({
  classrooms,
  onViewDetails,
}: ClassroomTableProps) {
  const { setAssignModalOpen } = useClassroomManagementStore();
  const { user, loading: authLoading } = useAuthStore();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [attendanceRates, setAttendanceRates] = useState<{
    [classroomId: string]: number;
  }>({});
  const [loadingRates, setLoadingRates] = useState(true);

  // Check permissions for attendance data
  const canViewAttendance =
    !authLoading &&
    !!user &&
    (user.role === "admin" || user.role === "superadmin");

  // Fetch attendance rates
  useEffect(() => {
    const loadRates = async () => {
      if (classrooms.length === 0 || !canViewAttendance) {
        setLoadingRates(false);
        return;
      }

      setLoadingRates(true);
      const batchSize = 5;
      const rates: { [classroomId: string]: number } = {};

      try {
        const batches = [];
        for (let i = 0; i < classrooms.length; i += batchSize) {
          batches.push(classrooms.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const promises = batch.map(async (classroom) => {
            try {
              const response = await api.get("/admin/attendance", {
                params: { classroomId: classroom._id, limit: 100 },
              });
              const data = response.data as AttendanceHistoryResponse;
              let totalPresent = 0;
              let totalPossible = 0;
              data.attendance.forEach((att: any) => {
                att.records.forEach((record: any) => {
                  totalPossible++;
                  if (record.status === "present" || record.status === "late")
                    totalPresent++;
                });
              });
              const rate =
                totalPossible > 0
                  ? Math.round((totalPresent / totalPossible) * 100)
                  : 0;
              return { classroomId: classroom._id, rate };
            } catch (error) {
              console.error(
                `Error fetching attendance for classroom ${classroom._id}:`,
                error
              );
              return { classroomId: classroom._id, rate: 0 };
            }
          });

          const batchResults = await Promise.all(promises);
          batchResults.forEach(({ classroomId, rate }) => {
            rates[classroomId] = rate;
          });
        }

        setAttendanceRates(rates);
      } catch (error) {
        console.error("Error in batch processing:", error);
        classrooms.forEach((c) => {
          if (!(c._id in rates)) {
            rates[c._id] = 0;
          }
        });
        setAttendanceRates(rates);
      } finally {
        setLoadingRates(false);
      }
    };
    loadRates();
  }, [classrooms, canViewAttendance, authLoading]);

  // Sort classrooms
  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "teacher":
          aValue = a.teacherId.name.toLowerCase();
          bValue = b.teacherId.name.toLowerCase();
          break;
        case "students":
          aValue = a.students.length;
          bValue = b.students.length;
          break;
        case "attendance":
          aValue = canViewAttendance ? attendanceRates[a._id] ?? 0 : 0;
          bValue = canViewAttendance ? attendanceRates[b._id] ?? 0 : 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    classrooms,
    sortField,
    sortDirection,
    attendanceRates,
    canViewAttendance,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (rate >= 80) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Loading state
  if (loadingRates && canViewAttendance) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!classrooms || classrooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No classrooms found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first classroom.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("name")}
                      className="h-auto p-0 font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Classroom {getSortIcon("name")}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("teacher")}
                      className="h-auto p-0 font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Teacher {getSortIcon("teacher")}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("students")}
                      className="h-auto p-0 font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Students {getSortIcon("students")}
                    </Button>
                  </th>
                  {canViewAttendance && (
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("attendance")}
                        className="h-auto p-0 font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Attendance {getSortIcon("attendance")}
                      </Button>
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("createdAt")}
                      className="h-auto p-0 font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Created {getSortIcon("createdAt")}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedClassrooms.map((classroom) => {
                  const attendanceRate = canViewAttendance
                    ? attendanceRates[classroom._id] ?? 0
                    : null;

                  return (
                    <tr
                      key={classroom._id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-foreground">
                              {classroom.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {classroom._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {classroom.teacherId.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {classroom.teacherId.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-muted-foreground mr-2" />
                          <span className="text-sm font-medium">
                            {classroom.students.length}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            students
                          </span>
                        </div>
                      </td>
                      {canViewAttendance && (
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={`font-medium ${getAttendanceColor(
                              attendanceRate!
                            )}`}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {attendanceRate}%
                          </Badge>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(classroom.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(classroom._id)}
                            className="hover:bg-primary/10 hover:border-primary/20"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAssignModalOpen(true, classroom._id)
                            }
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedClassrooms.map((classroom) => {
          const attendanceRate = canViewAttendance
            ? attendanceRates[classroom._id] ?? 0
            : null;

          return (
            <Card
              key={classroom._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {classroom._id.slice(-6)}
                      </p>
                    </div>
                  </div>

                  {canViewAttendance && (
                    <Badge
                      variant="outline"
                      className={`font-medium ${getAttendanceColor(
                        attendanceRate!
                      )}`}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {attendanceRate}%
                    </Badge>
                  )}
                </div>

                {/* Teacher Info */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {classroom.teacherId.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {classroom.teacherId.email}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {classroom.students.length}
                      </p>
                      <p className="text-xs text-gray-600">Students</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(classroom.createdAt).getFullYear()}
                      </p>
                      <p className="text-xs text-gray-600">Since</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onViewDetails(classroom._id)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    onClick={() => setAssignModalOpen(true, classroom._id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
