import { useMemo, useState, useEffect } from "react";
import { Classroom } from "../../hooks/useTeacherClassroomsQuery";
import { useQueries } from "@tanstack/react-query";
import api from "../../lib/api";
import { AttendanceHistoryResponse } from "../../hooks/useAttendance";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Users, UserCheck, Calendar, TrendingUp, BookOpen } from "lucide-react";
import Link from "next/link";

interface TeacherClassroomCardsProps {
  classrooms: Classroom[];
  onViewDetails: (classroomId: string) => void;
}

export default function TeacherClassroomCards({
  classrooms,
  onViewDetails,
}: TeacherClassroomCardsProps) {
  const [attendanceRates, setAttendanceRates] = useState<{
    [classroomId: string]: number;
  }>({});
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const loadRates = async () => {
      if (classrooms.length === 0) {
        setLoadingRates(false);
        return;
      }

      setLoadingRates(true);
      const batchSize = 5; // Limit concurrency to 5 requests at a time
      const rates: { [classroomId: string]: number } = {};

      try {
        // Split classrooms into batches
        const batches = [];
        for (let i = 0; i < classrooms.length; i += batchSize) {
          batches.push(classrooms.slice(i, i + batchSize));
        }

        // Process each batch sequentially
        for (const batch of batches) {
          const promises = batch.map(async (classroom) => {
            try {
              // Use the admin attendance history endpoint
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

          // Wait for current batch to complete
          const batchResults = await Promise.all(promises);
          batchResults.forEach(({ classroomId, rate }) => {
            rates[classroomId] = rate;
          });
        }

        setAttendanceRates(rates);
      } catch (error) {
        console.error("Error in batch processing:", error);
        // Fallback: set all remaining classrooms to 0
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
  }, [classrooms]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classrooms.map((classroom) => {
        const attendanceRate = loadingRates
          ? 0
          : attendanceRates[classroom._id] ?? 0;

        const safeRate =
          typeof attendanceRate === "number" ? attendanceRate : 0;

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
                    safeRate >= 90
                      ? "bg-green-100 text-green-800"
                      : safeRate >= 80
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {safeRate}% Attendance
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Class Info */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {classroom.name}
                  </p>
                  <p className="text-xs text-gray-600">Your assigned class</p>
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
                <Link href={`/teacher/attendance?classroomId=${classroom._id}`}>
                  <Button variant="outline" size="sm" className="flex-1">
                    Take Attendance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
