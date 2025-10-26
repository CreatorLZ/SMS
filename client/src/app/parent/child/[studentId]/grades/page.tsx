"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface GradeData {
  subject: string;
  grade: string;
  score: number;
  term: string;
  teacher: string;
}

interface ChildGradesData {
  studentName: string;
  className: string;
  grades: GradeData[];
  gpa: number;
  gradeDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsImprovement: number;
  };
}

const ChildGradesPage = () => {
  const { studentId } = useParams();
  const { user, token } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "child", studentId, "grades"],
    queryFn: async () => {
      const response = await fetch(`/api/parent/child/${studentId}/grades`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch grades");
      return response.json() as Promise<ChildGradesData>;
    },
    enabled: !!studentId && !!token,
  });

  if (isLoading) return <div>Loading grades...</div>;
  if (error) return <div>Error loading grades</div>;
  if (!data) return <div>No data available</div>;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/parent/child/${studentId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Child
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{data.studentName}'s Grades</h1>
            <p className="text-muted-foreground">{data.className}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5" />
          <span className="text-lg font-semibold">
            GPA: {data.gpa.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Grade Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.gradeDistribution.excellent}
              </div>
              <div className="text-sm text-muted-foreground">Excellent (A)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.gradeDistribution.good}
              </div>
              <div className="text-sm text-muted-foreground">Good (B)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {data.gradeDistribution.average}
              </div>
              <div className="text-sm text-muted-foreground">Average (C)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.gradeDistribution.needsImprovement}
              </div>
              <div className="text-sm text-muted-foreground">
                Needs Improvement
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Subject Grades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.grades.map((grade, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium">{grade.subject}</h3>
                    <Badge className={getGradeColor(grade.grade)}>
                      {grade.grade}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {grade.term} • {grade.teacher}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{grade.score}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildGradesPage;
