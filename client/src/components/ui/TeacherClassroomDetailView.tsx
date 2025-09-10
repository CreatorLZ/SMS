import { useState, useEffect } from "react";
import { Classroom } from "../../hooks/useTeacherClassroomsQuery";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import AttendanceCalendar from "./AttendanceCalendar";
import AttendanceMarker from "./AttendanceMarker";
import TimetableManager from "./TimetableManager";
import ReportsDashboard from "./ReportsDashboard";
import StudentProfile from "./StudentProfile";
import ConfirmDialog from "./ConfirmDialog";
import {
  useMarkAttendance,
  useUpdateAttendance,
  useGetClassAttendance,
  useGetAttendanceHistory,
} from "../../hooks/useAttendance";
import { useSaveTimetable } from "../../hooks/useTimetable";
import { useRemoveStudentsMutation } from "../../hooks/useRemoveStudentsMutation";
import { useSchoolDays } from "../../hooks/useSchoolDays";
import { useAttendanceComparison } from "../../hooks/useAttendanceComparison";
import { useRecentActivity } from "../../hooks/useRecentActivity";
import { useTeacherClassroomStudents } from "../../hooks/useTeacherClassroomsQuery";
import { useActiveTermQuery } from "../../hooks/useActiveTermQuery";
import { useToast } from "./use-toast";
import api from "../../lib/api";

import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  BookOpen,
  FileText,
  ArrowLeft,
  BarChart3,
  Clock,
} from "lucide-react";

interface TeacherClassroomDetailViewProps {
  classroom: Classroom;
  onBack: () => void;
}

export default function TeacherClassroomDetailView({
  classroom,
  onBack,
}: TeacherClassroomDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAttendanceMarker, setShowAttendanceMarker] = useState(false);

  // Student management state
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );

  const { toast } = useToast();
  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();
  const saveTimetable = useSaveTimetable();
  const removeStudentsMutation = useRemoveStudentsMutation();
  const attendanceHistory = useGetAttendanceHistory({
    classroomId: classroom._id,
  });

  // Get today's attendance for accurate present count
  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${String(
    todayDate.getMonth() + 1
  ).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
  const { data: todayAttendance } = useGetClassAttendance(classroom._id, today);

  // New hooks for dynamic data
  const { data: schoolDaysData, isLoading: schoolDaysLoading } = useSchoolDays(
    classroom._id
  );
  const { data: attendanceComparison, isLoading: comparisonLoading } =
    useAttendanceComparison(classroom._id);
  const { data: recentActivity, isLoading: activityLoading } =
    useRecentActivity(classroom._id);

  // Active term hook for holidays
  const { data: activeTerm } = useActiveTermQuery();

  const [attendanceRate, setAttendanceRate] = useState(0);
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    if (attendanceHistory.data) {
      let totalPresent = 0;
      let totalPossible = 0;
      attendanceHistory.data.attendance.forEach((att: any) => {
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
      setAttendanceRate(rate);
      setLoadingRate(false);
    }
  }, [attendanceHistory.data]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAttendanceMarker(true);
  };

  const handleAttendanceSave = async (attendanceData: {
    [studentId: string]: "present" | "absent" | "late";
  }) => {
    if (!selectedDate) return;

    try {
      // Use local date formatting to avoid timezone conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const records = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      );

      // Check if attendance already exists for this date
      let existingAttendance: { _id: string } | null = null;
      try {
        const response = await api.get(
          `/admin/attendance/class/${classroom._id}/${dateString}`
        );
        existingAttendance = response.data as { _id: string };
      } catch (error: any) {
        // If 404, attendance doesn't exist, which is fine
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      if (existingAttendance && existingAttendance._id) {
        // Update existing attendance
        await updateAttendance.mutateAsync({
          attendanceId: existingAttendance._id,
          records,
        });
      } else {
        // Create new attendance
        await markAttendance.mutateAsync({
          classroomId: classroom._id,
          date: dateString,
          records,
        });
      }

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });

      setShowAttendanceMarker(false);
      setSelectedDate(null);
    } catch (error: any) {
      console.error("Error saving attendance:", error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to save attendance",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save attendance",
          variant: "destructive",
        });
      }

      throw error;
    }
  };

  const handleCancelAttendance = () => {
    setShowAttendanceMarker(false);
    setSelectedDate(null);
  };

  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowStudentProfileModal(true);
  };

  const handleCloseStudentProfile = () => {
    setShowStudentProfileModal(false);
    setSelectedStudentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Classrooms</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {classroom.name}
            </h1>
            <p className="text-gray-600">Classroom Management Dashboard</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            attendanceRate >= 90
              ? "bg-green-100 text-green-800"
              : attendanceRate >= 80
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {attendanceRate}% Average Attendance
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {classroom.students.length}
            </div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {todayAttendance?.records?.filter(
                (record) =>
                  record.status === "present" || record.status === "late"
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Students present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Days</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {schoolDaysLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {schoolDaysData?.schoolDays || 0}
                </div>
                <p className="text-xs text-muted-foreground">Academic days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Trend
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {(attendanceComparison?.comparison?.change ?? 0) >= 0
                    ? "+"
                    : ""}
                  {attendanceComparison?.comparison?.change ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  vs Last Month (
                  {attendanceComparison?.comparison?.trend || "stable"})
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <div className="w-full">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
          {[
            { value: "overview", label: "Overview" },
            { value: "students", label: "Students" },
            { value: "attendance", label: "Attendance" },
            { value: "timetable", label: "Timetable" },
            { value: "reports", label: "Reports" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teacher Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5" />
                    <span>Class Teacher</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {classroom.teacherId.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {classroom.teacherId.email}
                      </p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Assigned:</strong>{" "}
                        {new Date(classroom.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Class Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Class Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Class Name:</strong> {classroom.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Created:</strong>{" "}
                        {new Date(classroom.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Academic Year:</strong>{" "}
                        {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 rounded w-16 ml-auto"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity?.activities?.length ? (
                  <div className="space-y-3">
                    {recentActivity.activities.map((activity, index) => {
                      const colors = [
                        "bg-green-50",
                        "bg-blue-50",
                        "bg-purple-50",
                        "bg-yellow-50",
                        "bg-red-50",
                      ];
                      const dotColors = [
                        "bg-green-500",
                        "bg-blue-500",
                        "bg-purple-500",
                        "bg-yellow-500",
                        "bg-red-500",
                      ];

                      return (
                        <div
                          key={activity.id}
                          className={`flex items-center space-x-3 p-3 ${
                            colors[index % colors.length]
                          } rounded-lg`}
                        >
                          <div
                            className={`w-2 h-2 ${
                              dotColors[index % dotColors.length]
                            } rounded-full`}
                          ></div>
                          <p className="text-sm flex-1">
                            {activity.description}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No recent activity found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Students ({classroom.students.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classroom.students.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: {student.studentId}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(student._id)}
                      >
                        View Profile
                      </Button>
                    </div>
                  ))}
                  {classroom.students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No students in this class yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-6">
            {showAttendanceMarker && selectedDate ? (
              <AttendanceMarker
                classroomId={classroom._id}
                selectedDate={selectedDate}
                students={classroom.students}
                onSave={handleAttendanceSave}
                onCancel={handleCancelAttendance}
              />
            ) : (
              <AttendanceCalendar
                classroomId={classroom._id}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate || undefined}
                holidays={activeTerm?.holidays || []}
              />
            )}
          </div>
        )}

        {activeTab === "timetable" && (
          <TimetableManager
            classroomId={classroom._id}
            classroomName={classroom.name}
            onSave={async (timetable) => {
              await saveTimetable.mutateAsync({
                classroomId: classroom._id,
                timetable,
              });
            }}
          />
        )}

        {activeTab === "reports" && (
          <ReportsDashboard
            classroomId={classroom._id}
            classroomName={classroom.name}
          />
        )}
      </div>

      {/* Modals */}
      {showStudentProfileModal && selectedStudentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <StudentProfile
              studentId={selectedStudentId}
              onClose={handleCloseStudentProfile}
            />
          </div>
        </div>
      )}
    </div>
  );
}
