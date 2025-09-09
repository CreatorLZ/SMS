import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Users,
  Calendar,
} from "lucide-react";
import { useToast } from "./use-toast";
import { useGetClassAttendance } from "../../hooks/useAttendance";

interface Student {
  _id: string;
  fullName: string;
  studentId: string;
}

interface AttendanceMarkerProps {
  classroomId: string;
  selectedDate: Date;
  students: Student[];
  onSave: (attendanceData: {
    [studentId: string]: "present" | "absent" | "late";
  }) => Promise<void>;
  onCancel: () => void;
  existingAttendance?: {
    [studentId: string]: "present" | "absent" | "late";
  };
}

export default function AttendanceMarker({
  classroomId,
  selectedDate,
  students,
  onSave,
  onCancel,
  existingAttendance = {},
}: AttendanceMarkerProps) {
  const { toast } = useToast();

  // Fetch existing attendance data for the selected date
  const selectedDateString = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const { data: existingAttendanceData, isLoading: isLoadingExisting } =
    useGetClassAttendance(classroomId, selectedDateString);

  const [attendanceData, setAttendanceData] = useState<{
    [studentId: string]: "present" | "absent" | "late";
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const initializedRef = useRef(false);
  const prevStudentsRef = useRef<string>("");
  const prevExistingAttendanceRef = useRef<string>("");
  const prevExistingDataRef = useRef<string>("");

  // Initialize attendance data
  useEffect(() => {
    const studentsKey = JSON.stringify(students.map((s) => s._id));
    const existingAttendanceKey = JSON.stringify(existingAttendance);
    const existingDataKey = existingAttendanceData
      ? JSON.stringify(existingAttendanceData.records)
      : "";

    // Only reinitialize if students, existingAttendance, or backend data changed
    if (
      !initializedRef.current ||
      studentsKey !== prevStudentsRef.current ||
      existingAttendanceKey !== prevExistingAttendanceRef.current ||
      existingDataKey !== prevExistingDataRef.current
    ) {
      const initialData: {
        [studentId: string]: "present" | "absent" | "late";
      } = {};

      // First priority: Use backend data if available
      if (existingAttendanceData?.records) {
        // Create a map of student IDs to their attendance status from backend
        const backendAttendanceMap: {
          [studentId: string]: "present" | "absent" | "late";
        } = {};
        existingAttendanceData.records.forEach((record: any) => {
          backendAttendanceMap[record.studentId._id || record.studentId] =
            record.status;
        });

        // Initialize with backend data
        students.forEach((student) => {
          initialData[student._id] =
            backendAttendanceMap[student._id] || "absent";
        });
      } else {
        // Fallback: Use existingAttendance prop or default to "absent"
        students.forEach((student) => {
          initialData[student._id] =
            existingAttendance[student._id] || "absent";
        });
      }

      setAttendanceData(initialData);

      initializedRef.current = true;
      prevStudentsRef.current = studentsKey;
      prevExistingAttendanceRef.current = existingAttendanceKey;
      prevExistingDataRef.current = existingDataKey;
    }
  }, [students, existingAttendance, existingAttendanceData]);

  const handleStatusChange = (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBulkAction = (status: "present" | "absent" | "late") => {
    const newData: { [studentId: string]: "present" | "absent" | "late" } = {};
    students.forEach((student) => {
      newData[student._id] = status;
    });
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(attendanceData);
      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: students.length,
    };

    Object.values(attendanceData).forEach((status) => {
      if (status === "present") stats.present++;
      else if (status === "absent") stats.absent++;
      else if (status === "late") stats.late++;
    });

    return stats;
  };

  const stats = getAttendanceStats();
  const attendanceRate =
    stats.total > 0
      ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1)
      : "0.0";

  // Show loading state while fetching existing attendance
  if (isLoadingExisting) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading existing attendance...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>
                {existingAttendanceData ? "Edit Attendance" : "Mark Attendance"}
              </span>
            </CardTitle>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-600">
                {students.length} Students • {attendanceRate}% Present
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.present}
                </p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absent}
                </p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.late}
                </p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => handleBulkAction("present")}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>All Present</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleBulkAction("absent")}
              className="flex items-center space-x-2"
            >
              <XCircle className="h-4 w-4 text-red-600" />
              <span>All Absent</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleBulkAction("late")}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>All Late</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Individual Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {student.fullName}
                  </p>
                  <p className="text-sm text-gray-600">
                    ID: {student.studentId}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {(["present", "absent", "late"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(student._id, status)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        attendanceData[student._id] === status
                          ? status === "present"
                            ? "bg-green-500 text-white"
                            : status === "absent"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {status === "present" && (
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                      )}
                      {status === "absent" && (
                        <XCircle className="h-4 w-4 inline mr-1" />
                      )}
                      {status === "late" && (
                        <Clock className="h-4 w-4 inline mr-1" />
                      )}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save Attendance"}</span>
        </Button>
      </div>
    </div>
  );
}
