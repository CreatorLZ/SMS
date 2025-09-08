import { useState, useEffect } from "react";
import { Classroom } from "../../hooks/useClassroomsQuery";
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
  useGetAttendanceHistory,
} from "../../hooks/useAttendance";
import { useSaveTimetable } from "../../hooks/useTimetable";
import { useRemoveStudentFromClassroom } from "../../hooks/useRemoveStudentFromClassroom";
import { useToast } from "./use-toast";
import { useStudentManagementStore } from "../../store/studentManagementStore";

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

interface ClassroomDetailViewProps {
  classroom: Classroom;
  onBack: () => void;
}

export default function ClassroomDetailView({
  classroom,
  onBack,
}: ClassroomDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAttendanceMarker, setShowAttendanceMarker] = useState(false);

  // Student management state
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );

  const { toast } = useToast();
  const markAttendance = useMarkAttendance();
  const saveTimetable = useSaveTimetable();
  const removeStudentFromClassroom = useRemoveStudentFromClassroom();
  const fetchAttendance = useGetAttendanceHistory();

  const [attendanceRate, setAttendanceRate] = useState(0);
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    const loadRate = async () => {
      try {
        const data = await fetchAttendance({ classroomId: classroom._id });
        let totalPresent = 0;
        let totalPossible = 0;
        data.attendance.forEach((att) => {
          att.records.forEach((record) => {
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
      } catch (error) {
        setAttendanceRate(0);
      } finally {
        setLoadingRate(false);
      }
    };
    loadRate();
  }, [classroom._id, fetchAttendance]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAttendanceMarker(true);
  };

  const handleAttendanceSave = async (attendanceData: {
    [studentId: string]: "present" | "absent" | "late";
  }) => {
    if (!selectedDate) return;

    try {
      const records = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      );

      await markAttendance.mutateAsync({
        classroomId: classroom._id,
        date: selectedDate.toISOString().split("T")[0],
        records,
      });
      setShowAttendanceMarker(false);
      setSelectedDate(null);
    } catch (error) {
      console.error("Error saving attendance:", error);
      throw error;
    }
  };

  const handleCancelAttendance = () => {
    setShowAttendanceMarker(false);
    setSelectedDate(null);
  };

  // Student management handlers
  const handleAddStudent = () => {
    // Use the existing modal system through the store
    const { setCreateModalOpen } = useStudentManagementStore.getState();
    setCreateModalOpen(true);
  };

  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowStudentProfileModal(true);
  };

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    setStudentToRemove({ id: studentId, name: studentName });
    setShowRemoveConfirmDialog(true);
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;

    try {
      // Handle bulk removal
      const studentIds = studentToRemove.id
        .split(",")
        .filter((id) => id.trim());

      if (studentIds.length > 1) {
        // Bulk removal - remove each student individually
        const removePromises = studentIds.map((studentId) =>
          removeStudentFromClassroom.mutateAsync({
            classroomId: classroom._id,
            studentId: studentId.trim(),
          })
        );

        await Promise.all(removePromises);

        toast({
          title: "Success",
          description: `${studentIds.length} students have been removed from the class`,
        });
      } else {
        // Single removal
        await removeStudentFromClassroom.mutateAsync({
          classroomId: classroom._id,
          studentId: studentToRemove.id,
        });

        toast({
          title: "Success",
          description: `${studentToRemove.name} has been removed from the class`,
        });
      }

      // Clear selections and close dialog
      setSelectedStudents(new Set());
      setShowRemoveConfirmDialog(false);
      setStudentToRemove(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to remove student(s)",
        variant: "destructive",
      });
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmDialog(false);
    setStudentToRemove(null);
  };

  const handleStudentCreated = () => {
    setShowCreateStudentModal(false);
    toast({
      title: "Success",
      description: "Student added to class successfully",
    });
  };

  const handleCloseStudentProfile = () => {
    setShowStudentProfileModal(false);
    setSelectedStudentId(null);
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedStudents.size === classroom.students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(classroom.students.map((s) => s._id)));
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkRemove = () => {
    if (selectedStudents.size === 0) return;

    const studentNames = classroom.students
      .filter((s) => selectedStudents.has(s._id))
      .map((s) => s.fullName)
      .join(", ");

    setStudentToRemove({
      id: Array.from(selectedStudents).join(","),
      name: studentNames,
    });
    setShowRemoveConfirmDialog(true);
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
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {classroom.students.length}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(
                    classroom.students.length * (attendanceRate / 100)
                  )}
                </p>
                <p className="text-sm text-gray-600">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-sm text-gray-600">School Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  +{attendanceRate}%
                </p>
                <p className="text-sm text-gray-600">vs Last Month</p>
              </div>
            </div>
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
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm">Attendance marked for today</p>
                    <span className="text-xs text-gray-500 ml-auto">
                      2 hours ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm">New student added to class</p>
                    <span className="text-xs text-gray-500 ml-auto">
                      1 day ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="text-sm">Timetable updated</p>
                    <span className="text-xs text-gray-500 ml-auto">
                      3 days ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span>Students ({classroom.students.length})</span>
                    {selectedStudents.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedStudents.size} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkRemove}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove Selected
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedStudents.size === classroom.students.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    <Button size="sm" onClick={handleAddStudent}>
                      Add Student
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classroom.students.map((student) => (
                    <div
                      key={student._id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        selectedStudents.has(student._id)
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student._id)}
                          onChange={() => handleStudentSelect(student._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.fullName}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {student.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProfile(student._id)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveStudent(student._id, student.fullName)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {classroom.students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No students in this class yet.</p>
                      <Button className="mt-4" onClick={handleAddStudent}>
                        Add First Student
                      </Button>
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

      {showRemoveConfirmDialog && studentToRemove && (
        <ConfirmDialog
          isOpen={showRemoveConfirmDialog}
          title="Remove Student from Class"
          message={`Are you sure you want to remove ${studentToRemove.name} from this class? This action cannot be undone.`}
          confirmText="Remove Student"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
          isLoading={removeStudentFromClassroom.isPending}
        />
      )}
    </div>
  );
}
