import { Classroom } from "../../hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "../../store/classroomManagementStore";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react";

interface ClassroomCardsProps {
  classrooms: Classroom[];
  onViewDetails: (classroomId: string) => void;
}

export default function ClassroomCards({
  classrooms,
  onViewDetails,
}: ClassroomCardsProps) {
  const { setAssignModalOpen } = useClassroomManagementStore();

  const getAttendanceRate = (students: any[]) => {
    // Mock attendance rate - in real implementation, this would come from attendance data
    return Math.floor(Math.random() * 20) + 80; // Random between 80-100%
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classrooms.map((classroom) => {
        const attendanceRate = getAttendanceRate(classroom.students);

        return (
          <Card
            key={classroom._id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {classroom.name}
                </CardTitle>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    attendanceRate >= 90
                      ? "bg-green-100 text-green-800"
                      : attendanceRate >= 80
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {attendanceRate}% Attendance
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Teacher Info */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {classroom.teacherId.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {classroom.teacherId.email}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(classroom.createdAt).getFullYear()}
                    </p>
                    <p className="text-xs text-gray-600">Since</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => onViewDetails(classroom._id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  View Details
                </Button>
                <Button
                  onClick={() => setAssignModalOpen(true, classroom._id)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Manage Students
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
