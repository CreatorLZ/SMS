import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { useToast } from "./use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  GraduationCap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  useStudent,
  useUpdateStudent,
  useStudentAttendance,
} from "../../hooks/useStudents";

interface StudentProfileProps {
  studentId: string;
  onClose?: () => void;
}

export default function StudentProfile({
  studentId,
  onClose,
}: StudentProfileProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: attendanceData, isLoading: attendanceLoading } =
    useStudentAttendance(studentId, selectedPeriod);
  const updateStudent = useUpdateStudent();

  const [editData, setEditData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phoneNumber: "",
    },
  });

  // Update edit data when student data loads
  React.useEffect(() => {
    if (student) {
      setEditData({
        fullName: student.fullName || "",
        email: student.email || "",
        phoneNumber: student.phoneNumber || "",
        address: student.address || "",
        emergencyContact: student.emergencyContact || {
          name: "",
          relationship: "",
          phoneNumber: "",
        },
      });
    }
  }, [student]);

  const handleSave = async () => {
    try {
      await updateStudent.mutateAsync({
        studentId,
        data: editData,
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Student profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update student profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (student) {
      setEditData({
        fullName: student.fullName || "",
        email: student.email || "",
        phoneNumber: student.phoneNumber || "",
        address: student.address || "",
        emergencyContact: student.emergencyContact || {
          name: "",
          relationship: "",
          phoneNumber: "",
        },
      });
    }
    setIsEditing(false);
  };

  const getAttendanceStats = () => {
    if (!attendanceData)
      return { present: 0, absent: 0, late: 0, total: 0, rate: 0 };

    // Handle different possible data structures
    let records: any[] = [];

    if (Array.isArray(attendanceData)) {
      records = attendanceData.flatMap((day: any) => day.records || []);
    } else if (
      (attendanceData as any).attendance &&
      Array.isArray((attendanceData as any).attendance)
    ) {
      records = (attendanceData as any).attendance.flatMap(
        (day: any) => day.records || []
      );
    } else if (
      (attendanceData as any).records &&
      Array.isArray((attendanceData as any).records)
    ) {
      records = (attendanceData as any).records;
    }

    const studentRecords = records.filter(
      (record: any) => record.studentId === studentId
    );

    const present = studentRecords.filter(
      (r: any) => r.status === "present"
    ).length;
    const absent = studentRecords.filter(
      (r: any) => r.status === "absent"
    ).length;
    const late = studentRecords.filter((r: any) => r.status === "late").length;
    const total = studentRecords.length;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;

    return { present, absent, late, total, rate };
  };

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Student not found</p>
        </CardContent>
      </Card>
    );
  }

  const attendanceStats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Student Profile</span>
            </CardTitle>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateStudent.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {updateStudent.isPending ? "Saving..." : "Save"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                </>
              )}
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.fullName}
                      onChange={(e) =>
                        setEditData({ ...editData, fullName: e.target.value })
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {student.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <p className="text-gray-900 font-medium">
                    {student.studentId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {student.email || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.phoneNumber}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {student.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <p className="text-gray-900">
                    {student.dateOfBirth
                      ? new Date(student.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <p className="text-gray-900">
                    {student.gender || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <p className="text-gray-900">
                  {student.address || "Not provided"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <p className="text-gray-900">
                  {student.location || "Not provided"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date
                </label>
                <p className="text-gray-900">
                  {student.admissionDate
                    ? new Date(student.admissionDate).toLocaleDateString()
                    : "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle>Parent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name
                  </label>
                  <p className="text-gray-900">
                    {student.parentName || "Not provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone
                  </label>
                  <p className="text-gray-900">
                    {student.parentPhone || "Not provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Student
                  </label>
                  <p className="text-gray-900">
                    {student.relationshipToStudent || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Period:</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>

                {attendanceLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Present:</span>
                      <span className="font-medium">
                        {attendanceStats.present}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600">Absent:</span>
                      <span className="font-medium">
                        {attendanceStats.absent}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-yellow-600">Late:</span>
                      <span className="font-medium">
                        {attendanceStats.late}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Attendance Rate:
                        </span>
                        <span className="font-bold text-lg">
                          {attendanceStats.rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle
                    className={`h-5 w-5 ${
                      student.status === "active"
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="capitalize">{student.status}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">
                    Enrolled:{" "}
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
