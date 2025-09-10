"use client";
import { useState } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { useTeacherClassroomsQuery } from "../../../hooks/useTeacherClassroomsQuery";

type ScheduleItem = {
  id: string;
  time: string;
  subject: string;
  classroom: string;
  room: string;
  duration: number; // in minutes
  students: number;
  status: "upcoming" | "current" | "completed";
};

export default function TeacherSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const { data: classrooms } = useTeacherClassroomsQuery();

  // Mock schedule data - in real app this would come from API
  const todaysSchedule: ScheduleItem[] = [
    {
      id: "1",
      time: "08:00",
      subject: "Mathematics",
      classroom: "Grade 10A",
      room: "Room 101",
      duration: 60,
      students: 28,
      status: "completed",
    },
    {
      id: "2",
      time: "09:30",
      subject: "Physics",
      classroom: "Grade 11B",
      room: "Lab 2",
      duration: 60,
      students: 24,
      status: "current",
    },
    {
      id: "3",
      time: "11:00",
      subject: "Mathematics",
      classroom: "Grade 10A",
      room: "Room 101",
      duration: 60,
      students: 28,
      status: "upcoming",
    },
    {
      id: "4",
      time: "14:00",
      subject: "Physics",
      classroom: "Grade 11B",
      room: "Lab 2",
      duration: 60,
      students: 24,
      status: "upcoming",
    },
  ];

  const weeklySchedule = [
    { day: "Monday", classes: 4, totalHours: 6 },
    { day: "Tuesday", classes: 3, totalHours: 5 },
    { day: "Wednesday", classes: 4, totalHours: 6 },
    { day: "Thursday", classes: 3, totalHours: 5 },
    { day: "Friday", classes: 4, totalHours: 6 },
    { day: "Saturday", classes: 0, totalHours: 0 },
    { day: "Sunday", classes: 0, totalHours: 0 },
  ];

  const getStatusColor = (status: ScheduleItem["status"]) => {
    switch (status) {
      case "current":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "upcoming":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: ScheduleItem["status"]) => {
    switch (status) {
      case "current":
        return <Clock className="h-4 w-4" />;
      case "upcoming":
        return <Calendar className="h-4 w-4" />;
      case "completed":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
              <p className="text-muted-foreground">
                View and manage your teaching schedule
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Schedule Management
            </Badge>
          </div>

          {/* Navigation Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {viewMode === "daily"
                    ? formatDate(selectedDate)
                    : formatWeekRange(selectedDate)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === "daily" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("daily")}
                    >
                      Daily
                    </Button>
                    <Button
                      variant={viewMode === "weekly" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("weekly")}
                    >
                      Weekly
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {viewMode === "daily" ? (
            <>
              {/* Today's Schedule */}
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todaysSchedule.length > 0 ? (
                      <div className="space-y-4">
                        {todaysSchedule.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 border rounded-lg ${getStatusColor(
                              item.status
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-lg font-semibold">
                                  {item.time}
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(item.status)}
                                  <Badge
                                    variant="secondary"
                                    className={getStatusColor(item.status)}
                                  >
                                    {item.status.charAt(0).toUpperCase() +
                                      item.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {item.status === "current" && (
                                  <Link
                                    href={`/teacher/attendance?classroomId=${item.classroom}`}
                                  >
                                    <Button size="sm">
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Take Attendance
                                    </Button>
                                  </Link>
                                )}
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {item.subject} - {item.classroom}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{item.room}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {item.duration} minutes
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No classes scheduled for today</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Classes Today
                        </p>
                        <p className="text-2xl font-bold">
                          {todaysSchedule.length}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Completed
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {
                            todaysSchedule.filter(
                              (s) => s.status === "completed"
                            ).length
                          }
                        </p>
                      </div>
                      <UserCheck className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          In Progress
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {
                            todaysSchedule.filter((s) => s.status === "current")
                              .length
                          }
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Upcoming
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {
                            todaysSchedule.filter(
                              (s) => s.status === "upcoming"
                            ).length
                          }
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            /* Weekly View */
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {weeklySchedule.map((day, index) => (
                    <div
                      key={day.day}
                      className={`p-4 border rounded-lg text-center ${
                        index === new Date().getDay()
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <h3 className="font-medium text-gray-900 mb-2">
                        {day.day}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-blue-600">
                          {day.classes}
                        </p>
                        <p className="text-sm text-gray-600">classes</p>
                        <p className="text-sm text-gray-500">
                          {day.totalHours}h total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/teacher/attendance">
                  <Button className="w-full justify-start" variant="outline">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Take Attendance
                  </Button>
                </Link>

                <Link href="/teacher">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Button>
                </Link>

                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Export Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
