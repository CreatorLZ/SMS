import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useAttendanceCalendar } from "../../hooks/useAttendanceCalendar";

interface AttendanceCalendarProps {
  classroomId: string;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

interface AttendanceData {
  [date: string]: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

export default function AttendanceCalendar({
  classroomId,
  onDateSelect,
  selectedDate,
}: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Use real API hook
  const { data: attendanceData, isLoading } = useAttendanceCalendar(
    classroomId,
    currentDate.getMonth(),
    currentDate.getFullYear()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAttendanceStatus = (date: Date) => {
    if (!attendanceData) return "no-data";

    const dateKey = date.toISOString().split("T")[0];
    const data = attendanceData[dateKey];

    if (!data) return "no-data";

    const attendanceRate = (data.present + data.late) / data.total;

    if (attendanceRate >= 0.9) return "excellent"; // 90%+ present/late
    if (attendanceRate >= 0.8) return "good"; // 80-89% present/late
    if (attendanceRate >= 0.7) return "fair"; // 70-79% present/late
    return "poor"; // <70% present/late
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500 hover:bg-green-600";
      case "good":
        return "bg-blue-500 hover:bg-blue-600";
      case "fair":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "poor":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-300 hover:bg-gray-400";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Attendance Calendar</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    onClick={() => onDateSelect(date)}
                    className={`
                      w-full h-full rounded-lg border-2 transition-all duration-200
                      ${
                        isSelected(date)
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-transparent"
                      }
                      ${isToday(date) ? "ring-2 ring-green-200" : ""}
                      ${getStatusColor(getAttendanceStatus(date))}
                      flex items-center justify-center text-white font-medium
                      hover:scale-105 transform
                    `}
                  >
                    <span className="text-sm">{date.getDate()}</span>
                  </button>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Excellent (90%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Good (80-89%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Fair (70-79%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Poor (&lt;70%)</span>{" "}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>No Data</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
              onClick={() => onDateSelect(new Date())}
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Mark Today</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
            >
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">All Present</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
            >
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Copy Previous</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
            >
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Mark Holiday</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
