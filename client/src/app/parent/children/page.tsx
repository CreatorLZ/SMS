"use client";
import { useState } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import RoleGuard from "@/components/ui/role-guard";
import { useAuthStore } from "@/store/authStore";
import { useParentDashboardQuery } from "@/hooks/useParentDashboardQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Heart,
  GraduationCap,
  UserCheck,
  BarChart3,
  Calendar,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Target,
} from "lucide-react";

export default function ChildrenOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: dashboardData, isLoading, error } = useParentDashboardQuery();

  // Use real data from API, fallback to empty arrays if loading/error
  const children = dashboardData?.linkedStudents || [];

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

  if (isLoading) {
    return (
      <RoleGuard allowed={["parent"]}>
        <DashboardLayout>
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  My Children
                </h1>
                <p className="text-muted-foreground">
                  Overview of all your children's academic progress.
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
                  Loading children data...
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
                  My Children
                </h1>
                <p className="text-muted-foreground">
                  Overview of all your children's academic progress.
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
                  Failed to load children data
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
              <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
              <p className="text-muted-foreground">
                Overview of all your children's academic progress.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Parent Portal
            </Badge>
          </div>

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
                    {children.length > 0
                      ? Math.round(
                          (children.reduce((sum, child) => sum + child.gpa, 0) /
                            children.length) *
                            10
                        ) / 10
                      : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Average GPA</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <Card
                key={child.id}
                className="hover:shadow-lg transition-shadow"
              >
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

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/parent/child/${child.id}/grades`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Grades
                      </Button>
                    </Link>
                    <Link href={`/parent/child/${child.id}/attendance`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Attendance
                      </Button>
                    </Link>
                    <Link href={`/parent/child/${child.id}/results`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Results
                      </Button>
                    </Link>
                    <Link href={`/parent/progress?child=${child.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Progress
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {children.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Children Linked
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  You don't have any children linked to your account yet. Please
                  contact the school administration to link your children.
                </p>
                <Button variant="outline">Contact Administration</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
