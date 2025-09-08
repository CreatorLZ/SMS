import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  Download,
  Filter,
  PieChart,
  LineChart,
  Activity,
} from "lucide-react";
import {
  useAttendanceReport,
  useStudentReport,
  useTeacherReport,
  useClassroomReport,
  useOverallReport,
} from "../../hooks/useReports";

interface ReportData {
  attendance: {
    totalDays: number;
    averageAttendance: number;
    attendanceTrend: number;
    topPerformers: Array<{ name: string; rate: number }>;
    lowPerformers: Array<{ name: string; rate: number }>;
  };
  students: {
    totalStudents: number;
    activeStudents: number;
    newEnrollments: number;
    studentGrowth: number;
  };
  teachers: {
    totalTeachers: number;
    activeTeachers: number;
    averageWorkload: number;
    teacherUtilization: number;
  };
  classes: {
    totalClasses: number;
    averageClassSize: number;
    utilizationRate: number;
    scheduleEfficiency: number;
  };
}

interface ReportsDashboardProps {
  classroomId?: string;
  classroomName?: string;
}

export default function ReportsDashboard({
  classroomId,
  classroomName,
}: ReportsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // Use real API hooks
  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendanceReport(classroomId, selectedPeriod);
  const { data: studentData, isLoading: studentLoading } = useStudentReport(
    classroomId,
    selectedPeriod
  );
  const { data: teacherData, isLoading: teacherLoading } =
    useTeacherReport(selectedPeriod);
  const { data: classroomData, isLoading: classroomLoading } =
    useClassroomReport(classroomId, selectedPeriod);

  const isLoading =
    attendanceLoading || studentLoading || teacherLoading || classroomLoading;

  // Combine data from different hooks
  const reportData =
    attendanceData && studentData && teacherData && classroomData
      ? {
          attendance: attendanceData,
          students: studentData,
          teachers: teacherData,
          classes: classroomData,
        }
      : null;

  const handleExportReport = (format: "pdf" | "excel" | "csv") => {
    // Mock export functionality
    console.log(`Exporting report as ${format.toUpperCase()}`);
    // In real implementation, this would trigger actual export
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {classroomName
              ? `${classroomName} Reports`
              : "School Reports & Analytics"}
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for {selectedPeriod}ly
            performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Period Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Export Options */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport("pdf")}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport("excel")}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Attendance
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData.attendance.averageAttendance}%
                </p>
                <div className="flex items-center mt-2">
                  {reportData.attendance.attendanceTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      reportData.attendance.attendanceTrend >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.abs(reportData.attendance.attendanceTrend)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData.students.totalStudents}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">
                    +{reportData.students.newEnrollments} new
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Teacher Utilization
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(reportData.teachers.teacherUtilization)}%
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm font-medium text-purple-600">
                    {reportData.teachers.averageWorkload} hrs/day avg
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Class Utilization
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(reportData.classes.utilizationRate)}%
                </p>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm font-medium text-orange-600">
                    {reportData.classes.averageClassSize} avg size
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <PieChart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="h-5 w-5" />
              <span>Attendance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Attendance trend chart will be implemented here
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {selectedPeriod}ly attendance patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Attendance Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.attendance.topPerformers.map((student, index) => (
                <div
                  key={student.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.name}
                      </p>
                      <p className="text-sm text-gray-600">Student</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {student.rate}%
                    </p>
                    <p className="text-xs text-gray-600">Attendance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Students Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.attendance.lowPerformers.map((student, index) => (
                <div
                  key={student.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        student.rate < 80
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      !
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.name}
                      </p>
                      <p className="text-sm text-gray-600">Student</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {student.rate}%
                    </p>
                    <p className="text-xs text-gray-600">Attendance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Class Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.classes.totalClasses}
                  </p>
                  <p className="text-sm text-blue-600">Total Classes</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(reportData.classes.scheduleEfficiency)}%
                  </p>
                  <p className="text-sm text-green-600">Schedule Efficiency</p>
                </div>
              </div>
              <div className="text-center py-4">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  Detailed class performance charts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Report */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {reportData.attendance.totalDays}
              </div>
              <p className="text-sm text-gray-600">School Days</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportData.students.activeStudents}
              </div>
              <p className="text-sm text-gray-600">Active Students</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {reportData.teachers.activeTeachers}
              </div>
              <p className="text-sm text-gray-600">Active Teachers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Math.round(reportData.classes.utilizationRate)}%
              </div>
              <p className="text-sm text-gray-600">Overall Utilization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
