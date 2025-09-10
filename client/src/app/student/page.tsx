"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  UserCheck,
  BarChart3,
  TrendingUp,
  Target,
} from "lucide-react";

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  // Mock data - in real app this would come from API
  const stats = {
    currentGPA: 3.8,
    attendanceRate: 95,
    completedAssignments: 28,
    totalAssignments: 32,
    upcomingTests: 3,
    subjects: 6,
  };

  const todaysSchedule = [
    {
      time: "08:00",
      subject: "Mathematics",
      teacher: "Mr. Johnson",
      room: "Room 101",
    },
    { time: "09:30", subject: "Physics", teacher: "Ms. Davis", room: "Lab 2" },
    {
      time: "11:00",
      subject: "English",
      teacher: "Mrs. Wilson",
      room: "Room 203",
    },
    {
      time: "14:00",
      subject: "History",
      teacher: "Mr. Brown",
      room: "Room 105",
    },
  ];

  const recentGrades = [
    { subject: "Mathematics", grade: "A", score: 95, date: "2025-01-15" },
    { subject: "Physics", grade: "A-", score: 92, date: "2025-01-14" },
    { subject: "English", grade: "B+", score: 88, date: "2025-01-13" },
    { subject: "History", grade: "A", score: 96, date: "2025-01-12" },
  ];

  const upcomingAssignments = [
    {
      subject: "Mathematics",
      title: "Calculus Problem Set",
      dueDate: "2025-01-20",
      status: "pending",
    },
    {
      subject: "Physics",
      title: "Lab Report",
      dueDate: "2025-01-22",
      status: "pending",
    },
    {
      subject: "English",
      title: "Essay on Shakespeare",
      dueDate: "2025-01-25",
      status: "in_progress",
    },
  ];

  return (
    <RoleGuard allowed={["student"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground">
                Here's your academic dashboard overview.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Student Portal
            </Badge>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current GPA
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentGPA}</div>
                <p className="text-xs text-muted-foreground">
                  Grade Point Average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Attendance Rate
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.attendanceRate}%
                </div>
                <p className="text-xs text-muted-foreground">This term</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assignments
                </CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completedAssignments}/{stats.totalAssignments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed this term
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Tests
                </CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.upcomingTests}
                </div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysSchedule.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {session.time}
                      </div>
                      <div>
                        <div className="font-medium">{session.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.teacher} • {session.room}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Recent Grades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentGrades.map((grade, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{grade.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {grade.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{grade.grade}</div>
                      <div className="text-sm text-muted-foreground">
                        {grade.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAssignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.subject} • Due: {assignment.dueDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          assignment.status === "completed"
                            ? "default"
                            : assignment.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {assignment.status === "in_progress"
                          ? "In Progress"
                          : assignment.status === "completed"
                          ? "Completed"
                          : "Pending"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/student/grades">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <GraduationCap className="h-6 w-6" />
                    <span className="text-sm">View Grades</span>
                  </Button>
                </Link>

                <Link href="/student/attendance">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">My Attendance</span>
                  </Button>
                </Link>

                <Link href="/student/schedule">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Class Schedule</span>
                  </Button>
                </Link>

                <Link href="/student/reports">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Progress Report</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
