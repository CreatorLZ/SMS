import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useGradingScales } from "@/hooks/useGradingScales";
import { getGradeFromScore, isPassingGrade } from "@/lib/gradingUtils";

interface StudentResult {
  studentId: string;
  fullName: string;
  scores: {
    subject: string;
    totalScore: number;
    grade?: string;
  }[];
}

interface ResultsAnalyticsProps {
  students: StudentResult[];
  className?: string;
}

export default function ResultsAnalytics({
  students,
  className,
}: ResultsAnalyticsProps) {
  const { data: gradingScales = [] } = useGradingScales();

  const analytics = useMemo(() => {
    if (!students.length) return null;

    // Calculate overall statistics
    const totalStudents = students.length;
    const totalScores = students.flatMap((student) =>
      student.scores.map((score) => score.totalScore)
    );

    const averageScore =
      totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;

    // Grade distribution
    const gradeDistribution = gradingScales.reduce((acc, scale) => {
      acc[scale.grade] = 0;
      return acc;
    }, {} as Record<string, number>);

    students.forEach((student) => {
      student.scores.forEach((score) => {
        const gradeResult = getGradeFromScore(score.totalScore, gradingScales);
        gradeDistribution[gradeResult.grade] =
          (gradeDistribution[gradeResult.grade] || 0) + 1;
      });
    });

    // Subject-wise analysis
    const subjectStats = new Map<
      string,
      {
        totalScore: number;
        count: number;
        grades: Record<string, number>;
      }
    >();

    students.forEach((student) => {
      student.scores.forEach((score) => {
        const subject = score.subject;
        const gradeResult = getGradeFromScore(score.totalScore, gradingScales);

        if (!subjectStats.has(subject)) {
          subjectStats.set(subject, {
            totalScore: 0,
            count: 0,
            grades: {},
          });
        }

        const stats = subjectStats.get(subject)!;
        stats.totalScore += score.totalScore;
        stats.count += 1;
        stats.grades[gradeResult.grade] =
          (stats.grades[gradeResult.grade] || 0) + 1;
      });
    });

    // Pass/fail statistics
    const passFailStats = students.reduce(
      (acc, student) => {
        const hasFailingGrade = student.scores.some((score) => {
          const gradeResult = getGradeFromScore(
            score.totalScore,
            gradingScales
          );
          return !isPassingGrade(gradeResult.grade);
        });

        if (hasFailingGrade) {
          acc.failing += 1;
        } else {
          acc.passing += 1;
        }
        return acc;
      },
      { passing: 0, failing: 0 }
    );

    return {
      totalStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      gradeDistribution,
      subjectStats: Array.from(subjectStats.entries()).map(
        ([subject, stats]) => ({
          subject,
          averageScore:
            Math.round((stats.totalScore / stats.count) * 100) / 100,
          grades: stats.grades,
        })
      ),
      passFailStats,
    };
  }, [students, gradingScales]);

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available for analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Students
                </p>
                <p className="text-2xl font-bold">{analytics.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Class Average
                </p>
                <p className="text-2xl font-bold">{analytics.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Passing Rate
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    (analytics.passFailStats.passing /
                      analytics.totalStudents) *
                      100
                  )}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  At Risk
                </p>
                <p className="text-2xl font-bold">
                  {analytics.passFailStats.failing}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Grade Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.gradeDistribution)
              .filter(([, count]) => count > 0)
              .sort(([a], [b]) => {
                // Sort grades in descending order (A, B, C, D, E, F)
                const gradeOrder = [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "A1",
                  "B2",
                  "B3",
                  "C4",
                  "C5",
                  "C6",
                  "D7",
                  "E8",
                  "F9",
                ];
                return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
              })
              .map(([grade, count]) => {
                const percentage = Math.round(
                  (count /
                    (analytics.totalStudents * analytics.subjectStats.length)) *
                    100
                );
                return (
                  <div
                    key={grade}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="min-w-[3rem]">
                        {grade}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} students
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subject Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.subjectStats
              .sort((a, b) => b.averageScore - a.averageScore)
              .map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{subject.subject}</h4>
                    <Badge variant="secondary">
                      {subject.averageScore}% avg
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(subject.grades)
                      .filter(([, count]) => count > 0)
                      .sort(([a], [b]) => {
                        const gradeOrder = [
                          "A",
                          "B",
                          "C",
                          "D",
                          "E",
                          "F",
                          "A1",
                          "B2",
                          "B3",
                          "C4",
                          "C5",
                          "C6",
                          "D7",
                          "E8",
                          "F9",
                        ];
                        return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
                      })
                      .map(([grade, count]) => (
                        <div
                          key={grade}
                          className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                        >
                          <span className="font-medium">{grade}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
