"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useClassroomsQuery } from "../../../hooks/useClassroomsQuery";
import {
  useMarkAttendance,
  useGetAttendance,
  AttendanceResponse,
} from "../../../hooks/useAttendance";

import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Toast } from "../../../components/ui/Toast";

interface Student {
  _id: string;
  fullName: string;
  studentId: string;
}

interface Classroom {
  _id: string;
  name: string;
  students: Student[];
}

export default function TeacherAttendancePage() {
  const user = useAuthStore((s) => s.user);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: "present" | "absent" | "late";
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Get classrooms for the teacher
  const { data: classrooms, isLoading: classroomsLoading } =
    useClassroomsQuery();

  // Filter classrooms to only show those assigned to this teacher
  const teacherClassrooms =
    classrooms?.filter((c: any) => c.teacherId === user?._id) || [];

  const markAttendance = useMarkAttendance();
  const fetchAttendance = useGetAttendance();

  // Load existing attendance when classroom or date changes
  useEffect(() => {
    if (selectedClassroom && selectedDate) {
      loadExistingAttendance();
    }
  }, [selectedClassroom, selectedDate]);

  const loadExistingAttendance = async () => {
    try {
      setIsLoading(true);
      const response: AttendanceResponse = await fetchAttendance({
        classroomId: selectedClassroom,
        date: selectedDate,
      });
      if (response && response.records) {
        const attendanceMap: { [key: string]: "present" | "absent" | "late" } =
          {};
        response.records.forEach((record) => {
          attendanceMap[record.studentId._id] = record.status;
        });
        setAttendanceData(attendanceMap);
      } else {
        // No existing attendance, initialize with empty
        setAttendanceData({});
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
      setAttendanceData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClassroom) {
      setToastMessage({
        message: "Please select a classroom",
        type: "error",
      });
      return;
    }

    const selectedClass = teacherClassrooms.find(
      (c: Classroom) => c._id === selectedClassroom
    );
    if (!selectedClass) return;

    // Prepare attendance records
    const records = selectedClass.students.map((student) => ({
      studentId: student._id,
      status: attendanceData[student._id] || "absent", // Default to absent if not marked
    }));

    try {
      setIsSubmitting(true);
      await markAttendance.mutateAsync({
        classroomId: selectedClassroom,
        date: selectedDate,
        records,
      });
      setToastMessage({
        message: "Attendance marked successfully",
        type: "success",
      });
    } catch (error: unknown) {
      console.error("Error marking attendance:", error);
      setToastMessage({
        message:
          (error as any).response?.data?.message || "Failed to mark attendance",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClass = teacherClassrooms.find(
    (c: Classroom) => c._id === selectedClassroom
  );

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Mark Attendance</h1>

          {/* Classroom and Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Class and Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Classroom
                  </label>
                  <select
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a classroom</option>
                    {teacherClassrooms.map((classroom: Classroom) => (
                      <option key={classroom._id} value={classroom._id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Attendance List */}
          {selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance for {selectedClass.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    Loading attendance data...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedClass.students.map((student: Student) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{student.fullName}</p>
                          <p className="text-sm text-gray-600">
                            ID: {student.studentId}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {(["present", "absent", "late"] as const).map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleStatusChange(student._id, status)
                                }
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                  attendanceData[student._id] === status
                                    ? status === "present"
                                      ? "bg-green-500 text-white"
                                      : status === "absent"
                                      ? "bg-red-500 text-white"
                                      : "bg-yellow-500 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2"
                      >
                        {isSubmitting ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedClassroom && !classroomsLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">
                  Please select a classroom to mark attendance
                </p>
              </CardContent>
            </Card>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <Toast
              message={toastMessage.message}
              type={toastMessage.type}
              onClose={() => setToastMessage(null)}
            />
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
