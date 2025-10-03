"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/dashboard-layout";
import RoleGuard from "@/components/ui/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, X } from "lucide-react";
import { useStudent } from "@/hooks/useStudents";
import { useTeacherClassroomsQuery } from "@/hooks/useTeacherClassroomsQuery";

const subjects = [
  "Physics",
  "Chemistry",
  "Commerce",
  "Mathematics",
  "Economics",
  "Biology",
  "Government",
  "Accounting",
  "Computer",
];

const ratingOptions = [
  { value: "1", label: "1. Exceptional" },
  { value: "2", label: "2. Good" },
  { value: "3", label: "3. Satisfactory" },
  { value: "4", label: "4. Poor" },
  { value: "5", label: "5. Very Poor" },
];

export default function EnterStudentResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const classId = searchParams.get("classId");
  const session = searchParams.get("session");
  const term = searchParams.get("term");

  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: classrooms } = useTeacherClassroomsQuery();

  const selectedClassroom = classrooms?.find((c) => c._id === classId);

  const [scores, setScores] = useState<
    Record<string, { ca1: string; ca2: string; exam: string }>
  >({});
  const [domainTraits, setDomainTraits] = useState({
    handwriting: "2",
    usesTime: "2",
    neatWork: "4",
    homework: "5",
    respectAuthority: "1",
  });
  const [comments, setComments] = useState({
    teacher: "",
    houseMaster: "",
    nextTermBegins: "",
    thisTermEnds: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (
    subject: string,
    field: "ca1" | "ca2" | "exam",
    value: string
  ) => {
    setScores((prev) => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement save logic using the existing API
      console.log("Saving results for student:", studentId, {
        scores,
        domainTraits,
        comments,
        session,
        term,
        classId,
      });

      // Navigate back to results management
      router.push("/teacher/results");
    } catch (error) {
      console.error("Error saving results:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/teacher/results");
  };

  if (studentLoading) {
    return (
      <RoleGuard allowed={["teacher"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading student data...</div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (!student) {
    return (
      <RoleGuard allowed={["teacher"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Student not found</div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="flex items-center"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Enter Student Results
                </h1>
                <p className="text-sm text-muted-foreground">
                  Entering results for {student.fullName} ({student.studentId})
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Results"}
              </Button>
            </div>
          </div>

          {/* Context Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Session:</span> {session}
              </div>
              <div>
                <span className="font-medium">Term:</span> {term} Term
              </div>
              <div>
                <span className="font-medium">Class:</span>{" "}
                {selectedClassroom?.name || classId}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-[1fr_400px] gap-6">
            {/* Left Column - Subjects */}
            <div className="bg-white border border-gray-300 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Subject Scores</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 text-sm">
                      Subjects
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                      1st CA Score
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                      2nd CA Score
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                      Exam Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, index) => (
                    <tr
                      key={subject}
                      className={
                        index !== subjects.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }
                    >
                      <td className="py-3 px-2 text-gray-700 text-sm">
                        {subject}
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          className="text-center h-9 bg-white border-gray-300"
                          value={scores[subject]?.ca1 || ""}
                          onChange={(e) =>
                            handleScoreChange(subject, "ca1", e.target.value)
                          }
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          className="text-center h-9 bg-white border-gray-300"
                          value={scores[subject]?.ca2 || ""}
                          onChange={(e) =>
                            handleScoreChange(subject, "ca2", e.target.value)
                          }
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          className="text-center h-9 bg-white border-gray-300"
                          value={scores[subject]?.exam || ""}
                          onChange={(e) =>
                            handleScoreChange(subject, "exam", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Column - Domain Traits and Info */}
            <div className="space-y-6">
              {/* Domain Traits */}
              <div className="bg-white border border-gray-300 rounded-lg">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 rounded-t-lg">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 2a2 2 0 0 0-2 2v18l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
                    </svg>
                    Domain Traits
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Psychomotor Domain */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h4 className="font-medium text-gray-700 text-sm mb-3">
                      PSYCHOMOTOR DOMAIN
                    </h4>
                    <div className="grid grid-cols-[1fr_180px] gap-3 items-center">
                      <Label className="font-normal text-sm text-gray-700">
                        Handwriting
                      </Label>
                      <Select
                        value={domainTraits.handwriting}
                        onValueChange={(value) =>
                          setDomainTraits((prev) => ({
                            ...prev,
                            handwriting: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 bg-white border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Affective Domain */}
                  <div>
                    <h4 className="font-medium text-gray-700 text-sm mb-3">
                      AFFECTIVE DOMAIN
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-[1fr_180px] gap-3 items-center ">
                        <Label className="text-sm text-gray-700 font-normal">
                          Uses Time To Good Advantage
                        </Label>
                        <Select
                          value={domainTraits.usesTime}
                          onValueChange={(value) =>
                            setDomainTraits((prev) => ({
                              ...prev,
                              usesTime: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 bg-white border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ratingOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-[1fr_180px] gap-3 items-center">
                        <Label className="text-sm text-gray-700 font-normal">
                          Does Neat Work
                        </Label>
                        <Select
                          value={domainTraits.neatWork}
                          onValueChange={(value) =>
                            setDomainTraits((prev) => ({
                              ...prev,
                              neatWork: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 bg-white border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ratingOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-[1fr_180px] gap-3 items-center">
                        <Label className="text-sm text-gray-700 font-normal">
                          Does Homework Regularly
                        </Label>
                        <Select
                          value={domainTraits.homework}
                          onValueChange={(value) =>
                            setDomainTraits((prev) => ({
                              ...prev,
                              homework: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 bg-white border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ratingOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-[1fr_180px] gap-3 items-center">
                        <Label className="text-sm text-gray-700 font-normal">
                          Respect Authority
                        </Label>
                        <Select
                          value={domainTraits.respectAuthority}
                          onValueChange={(value) =>
                            setDomainTraits((prev) => ({
                              ...prev,
                              respectAuthority: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 bg-white border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ratingOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info/Comments */}
              <div className="bg-white border border-gray-300 rounded-lg">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 rounded-t-lg">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 2a2 2 0 0 0-2 2v18l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
                    </svg>
                    Info/Comments
                  </h3>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 text-sm">
                          Details
                        </th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 px-2 text-gray-700 text-sm">
                          Teacher
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            className="h-9 bg-white border-gray-300"
                            value={comments.teacher}
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                teacher: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 px-2 text-gray-700 text-sm">
                          House Master
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            className="h-9 bg-white border-gray-300"
                            value={comments.houseMaster}
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                houseMaster: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 px-2 text-gray-700 text-sm">
                          Next Term Begins
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="date"
                            className="h-9 bg-white border-gray-300"
                            value={comments.nextTermBegins}
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                nextTermBegins: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-gray-700 text-sm">
                          This Term Ends
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="date"
                            className="h-9 bg-white border-gray-300"
                            value={comments.thisTermEnds}
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                thisTermEnds: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
