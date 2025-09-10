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
  Heart,
  AlertTriangle,
} from "lucide-react";

export default function ParentDashboard() {
  const user = useAuthStore((s) => s.user);

  // Mock data - in real app this would come from API
  const children = [
    {
      id: "1",
      name: "Emma Johnson",
      grade: "Grade 10",
      gpa: 3.8,
      attendance: 95,
      status: "excellent",
    },
    {
      id: "2",
      name: "Liam Johnson",
      grade: "Grade 8",
      gpa: 3.2,
      attendance: 88,
      status: "good",
    },
  ];

  const notifications = [
    {
      id: "1",
      type: "grade",
      child: "Emma Johnson",
      message: "New grade posted in Mathematics: A (95%)",
      date: "2025-01-15",
      priority: "normal",
    },
    {
      id: "2",
      type: "attendance",
      child: "Liam Johnson",
      message: "Attendance below 90% this week",
      date: "2025-01-14",
      priority: "warning",
    },
    {
      id: "3",
      type: "event",
      child: "Emma Johnson",
      message: "Parent-Teacher conference scheduled for Jan 25",
      date: "2025-01-13",
      priority: "normal",
    },
  ];

  const upcomingEvents = [
    {
      title: "Parent-Teacher Conference",
      child: "Emma Johnson",
      date: "2025-01-25",
      time: "14:00",
      type: "meeting",
    },
    {
      title: "Science Fair",
      child: "Both Children",
      date: "2025-02-10",
      time: "09:00",
      type: "event",
    },
    {
      title: "Report Card Distribution",
      child: "Both Children",
      date: "2025-02-15",
      time: "16:00",
      type: "academic",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "needs_attention":
        return "text-orange-600";
      case "concerning":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case "needs_attention":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            Needs Attention
          </Badge>
        );
      case "concerning":
        return <Badge className="bg-red-100 text-red-800">Concerning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "grade":
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case "attendance":
        return <UserCheck className="h-4 w-4 text-orange-600" />;
      case "event":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <RoleGuard allowed={["parent"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground">
                Stay connected with your children's academic journey.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Parent Portal
            </Badge>
          </div>

          {/* Children Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      {child.name}
                    </span>
                    {getStatusBadge(child.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{child.grade}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {child.gpa}
                      </div>
                      <p className="text-xs text-muted-foreground">GPA</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {child.attendance}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Attendance
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/parent/child/${child.id}/grades`}>
                      <Button size="sm" variant="outline" className="flex-1">
                        View Grades
                      </Button>
                    </Link>
                    <Link href={`/parent/child/${child.id}/attendance`}>
                      <Button size="sm" variant="outline" className="flex-1">
                        Attendance
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {notification.child}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {notification.message}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.date}
                      </div>
                    </div>
                    {notification.priority === "warning" && (
                      <Badge variant="destructive" className="text-xs">
                        Important
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.child} • {event.date} at {event.time}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        event.type === "meeting"
                          ? "default"
                          : event.type === "event"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/parent/children">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">My Children</span>
                  </Button>
                </Link>

                <Link href="/parent/progress">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Progress Reports</span>
                  </Button>
                </Link>

                <Link href="/parent/attendance">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">Attendance</span>
                  </Button>
                </Link>

                <Link href="/parent/messages">
                  <Button
                    className="w-full h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm">Messages</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Family Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Family Academic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {children.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Children</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(
                      (children.reduce((sum, child) => sum + child.gpa, 0) /
                        children.length) *
                        10
                    ) / 10}
                  </div>
                  <p className="text-sm text-muted-foreground">Average GPA</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round(
                      children.reduce(
                        (sum, child) => sum + child.attendance,
                        0
                      ) / children.length
                    )}
                    %
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average Attendance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
