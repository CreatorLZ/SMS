"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useParentDashboardQuery } from "@/hooks/useParentDashboardQuery";
import RoleGuard from "@/components/ui/role-guard";
import DashboardLayout from "@/components/ui/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle,
  Users,
} from "lucide-react";

export default function ProgressReports() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const selectedChildId = searchParams.get("child");

  const { data: dashboardData, isLoading, error } = useParentDashboardQuery();

  // Use real data from API, fallback to empty arrays if loading/error
  const children = dashboardData?.linkedStudents || [];
  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId)
    : null;

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
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
                  Progress Reports
                </h1>
                <p className="text-muted-foreground">
                  Track your children's academic progress and achievements.
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
                  Loading progress data...
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
                  Progress Reports
                </h1>
                <p className="text-muted-foreground">
                  Track your children's academic progress and achievements.
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
                  Failed to load progress data
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
                Progress Reports
              </h1>
              <p className="text-muted-foreground">
                Track your children's academic progress and achievements.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Parent Portal
            </Badge>
          </div>

          <Tabs
            defaultValue={selectedChildId || "overview"}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Family Overview</TabsTrigger>
              <TabsTrigger value="individual" disabled={!selectedChild}>
                {selectedChild
                  ? `${selectedChild.name}'s Progress`
                  : "Individual Progress"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Family Progress Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Family Academic Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {children.length > 0
                          ? Math.round(
                              (children.reduce(
                                (sum, child) => sum + child.gpa,
                                0
                              ) /
                                children.length) *
                                10
                            ) / 10
                          : 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average GPA
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {getTrendIcon("up")}
                        <span className="text-xs text-green-600">+0.2</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
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
                      <p className="text-sm text-muted-foreground">
                        Average Attendance
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {getTrendIcon("stable")}
                        <span className="text-xs text-gray-600">Stable</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {
                          children.filter((c) => c.status === "excellent")
                            .length
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Excellent Performers
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-purple-600">
                          Top Students
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Child Progress Cards */}
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
                        {getStatusBadge(child.status)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {child.grade}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {child.gpa}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Current GPA
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {getTrendIcon("up")}
                            <span className="text-xs text-green-600">+0.1</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {child.attendance}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Attendance
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {getTrendIcon("stable")}
                            <span className="text-xs text-gray-600">0%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Mathematics</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">A</span>
                            {getTrendIcon("up")}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">English</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">B+</span>
                            {getTrendIcon("stable")}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Science</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">A-</span>
                            {getTrendIcon("up")}
                          </div>
                        </div>
                      </div>

                      <Link href={`/parent/progress?child=${child.id}`}>
                        <Button className="w-full" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Detailed Progress
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              {selectedChild && (
                <>
                  {/* Individual Progress Header */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          {selectedChild.name}'s Academic Progress
                        </span>
                        {getStatusBadge(selectedChild.status)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedChild.grade} • Current GPA: {selectedChild.gpa}
                      </p>
                    </CardHeader>
                  </Card>

                  {/* Detailed Progress Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>GPA Trend</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">3.2 → 3.4</span>
                              {getTrendIcon("up")}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Attendance Rate</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">92% → 95%</span>
                              {getTrendIcon("up")}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Subject Average</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">B+ → A-</span>
                              {getTrendIcon("up")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Subject Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { subject: "Mathematics", grade: "A", trend: "up" },
                            {
                              subject: "English",
                              grade: "B+",
                              trend: "stable",
                            },
                            { subject: "Science", grade: "A-", trend: "up" },
                            { subject: "History", grade: "B", trend: "down" },
                            { subject: "Art", grade: "A", trend: "up" },
                          ].map((item) => (
                            <div
                              key={item.subject}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{item.subject}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{item.grade}</Badge>
                                {getTrendIcon(item.trend)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Achievement Highlights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              Mathematics Excellence
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Scored 95% in recent mathematics assessment
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              2 weeks ago
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                          <Award className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              Perfect Attendance
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Maintained 100% attendance for the month
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              1 month ago
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
