"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Download, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

interface ResultData {
  term: string;
  subject: string;
  grade: string;
  score: number;
  teacher: string;
  remarks?: string;
}

interface ChildResultsData {
  studentName: string;
  className: string;
  term: string;
  results: ResultData[];
  gpa: number;
  isPublished: boolean;
  requiresPin: boolean;
}

const ChildResultsPage = () => {
  const { studentId } = useParams();
  const { user, token } = useAuthStore();
  const [pin, setPin] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["parent", "child", studentId, "results"],
    queryFn: async () => {
      const response = await fetch(`/api/parent/child/${studentId}/results`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json() as Promise<ChildResultsData>;
    },
    enabled: !!studentId && !!token && isVerified,
  });

  const handlePinVerification = async () => {
    try {
      const response = await fetch(
        `/api/parent/child/${studentId}/results/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pin }),
        }
      );

      if (response.ok) {
        setIsVerified(true);
        refetch();
      } else {
        alert("Invalid PIN");
      }
    } catch (error) {
      alert("Error verifying PIN");
    }
  };

  if (isLoading) return <div>Loading results...</div>;
  if (error) return <div>Error loading results</div>;

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
            <h1 className="text-2xl font-bold">
              {data?.studentName || "Child"}'s Results
            </h1>
            <p className="text-muted-foreground">{data?.className || ""}</p>
          </div>
        </div>
        {data && (
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span className="text-lg font-semibold">Term: {data.term}</span>
          </div>
        )}
      </div>

      {/* PIN Verification */}
      {!isVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              PIN Verification Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pin">Enter PIN to view results</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="mt-1"
                />
              </div>
              <Button onClick={handlePinVerification}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify PIN
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {isVerified && data && (
        <>
          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-2xl font-bold">
                      GPA: {data.gpa.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Grade Point Average
                    </div>
                  </div>
                  <Badge variant={data.isPublished ? "default" : "secondary"}>
                    {data.isPublished ? "Published" : "Not Published"}
                  </Badge>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subject Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Subject Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{result.subject}</h3>
                        <Badge className={getGradeColor(result.grade)}>
                          {result.grade}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.teacher}
                      </div>
                      {result.remarks && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Remarks: {result.remarks}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {result.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ChildResultsPage;
