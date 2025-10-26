"use client";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  UserCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useParentDashboardQuery } from "@/hooks/useParentDashboardQuery";
import RoleGuard from "@/components/ui/role-guard";
import DashboardLayout from "@/components/ui/dashboard-layout";

export default function FamilyAttendance() {
  const user = useAuthStore((s) => s.user);
  const { data: dashboardData, isLoading, error } = useParentDashboardQuery();

  // Use real data from API, fallback to empty arrays if loading/error
  const children = dashboardData?.linkedStudents || [];

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 95)
      return {
        status: "excellent",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (percentage >= 90)
      return { status: "good", color: "text-blue-600", bg: "bg-blue-100" };
    if (percentage >= 85)
      return { status: "fair", color: "text-orange-600", bg: "bg-orange-100" };
    return { status: "concerning", color: "text-red-600", bg: "bg-red-100" };
  };

  const getStatusBadge = (percentage: number) => {
    const { status, bg } = getAttendanceStatus(percentage);
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <Badge
        className={`${bg} text-${
          status === "excellent"
            ? "green"
            : status === "good"
            ? "blue"
            : status === "fair"
            ? "orange"
            : "red"
        }-800`}
      >
        {statusText}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <RoleGuard allowed={["parent"]}>
        <DashboardLayout>
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Family Attendance
                </h1>
                <p className="text-muted-foreground">
                  Monitor attendance patterns across all your children.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Parent Portal
              </Badge>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading attendance data...
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowed={["parent"]}>
        <DashboardLayout>
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Family Attendance
                </h1>
                <p className="text-muted-foreground">
                  Monitor attendance patterns across all your children.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Parent Portal
              </Badge>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="mt-4 text-red-600">
                  Failed to load attendance data
                </p>
                <p className="text-sm text-muted-foreground">
                  Please try refreshing the page
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["parent"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Family Attendance
              </h1>
              <p className="text-muted-foreground">
                Monitor attendance patterns across all your children.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Parent Portal
            </Badge>
          </div>

          {/* Family Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Family Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Attendance
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {children.length > 0
                        ? Math.round(
                            children.reduce(
                              (sum, child) => sum + child.attendance,
                              0
                            ) / children.length
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Family average this term
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Excellent
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {children.filter((c) => c.attendance >= 95).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Children with ≥95% attendance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Good</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {
                        children.filter(
                          (c) => c.attendance >= 85 && c.attendance < 95
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Children with 85-94% attendance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Needs Attention
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {children.filter((c) => c.attendance < 85).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Children with less than 85% attendance
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Individual Child Attendance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <Card
                key={child.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      {child.name}
                    </span>
                    {getStatusBadge(child.attendance)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{child.grade}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {child.attendance}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current Term Attendance
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {getTrendIcon("up")}
                      <span className="text-xs text-green-600">+1%</span>
                    </div>
                  </div>

                  {/* Attendance Breakdown */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        18
                      </div>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        1
                      </div>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-600">
                        1
                      </div>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>

                  {/* Recent Attendance Pattern */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Last 7 Days</p>
                    <div className="flex gap-1">
                      {[
                        "present",
                        "present",
                        "late",
                        "present",
                        "present",
                        "present",
                        "absent",
                      ].map((status, index) => (
                        <div
                          key={index}
                          className={`w-6 h-6 rounded-full ${
                            status === "present"
                              ? "bg-green-500"
                              : status === "late"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                          title={`${status} on ${new Date(
                            Date.now() - (6 - index) * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/parent/child/${child.id}/attendance`}
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Contact Teacher
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attendance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Attendance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Strong Attendance Pattern</div>
                    <div className="text-sm text-muted-foreground">
                      Your children have maintained excellent attendance this
                      term with an average of{" "}
                      {children.length > 0
                        ? Math.round(
                            children.reduce(
                              (sum, child) => sum + child.attendance,
                              0
                            ) / children.length
                          )
                        : 0}
                      % across all children.
                    </div>
                  </div>
                </div>

                {children.some((c) => c.attendance < 90) && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Attendance Monitoring</div>
                      <div className="text-sm text-muted-foreground">
                        Some children have attendance below 90%. Consider
                        discussing attendance patterns with teachers.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Improvement Trend</div>
                    <div className="text-sm text-muted-foreground">
                      Family attendance has improved by 2% compared to last
                      term. Keep up the good work!
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {children.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Attendance Data
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  Attendance records will appear here once your children are
                  enrolled and attendance is recorded.
                </p>
                <Button variant="outline">Contact School Administration</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
