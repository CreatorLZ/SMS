"use client";

import { useState, useEffect } from "react";
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
import { useTeacherClassroomSubjectsQuery } from "@/hooks/useClassroomSubjectsQuery";
import { useSubmitResult, useStudentResults } from "@/hooks/useResults";
import { useSessionsQuery } from "@/hooks/useSessionsQuery";

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
  const { data: sessions } = useSessionsQuery();
  const { data: classroomSubjects, isLoading: subjectsLoading } =
    useTeacherClassroomSubjectsQuery(classId || "");
  const { data: existingResults, isLoading: resultsLoading } =
    useStudentResults(studentId);
  const submitResult = useSubmitResult();

  const subjects = classroomSubjects?.subjects.map((s) => s.name) || [];

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

  // Local storage helpers
  const getStorageKey = () => {
    if (!studentId || !session || !term) return null;
    return `results-${studentId}-${session}-${term}`;
  };

  const saveToLocalStorage = (data: any) => {
    try {
      const key = getStorageKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const key = getStorageKey();
      if (key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
    }
    return null;
  };

  const clearLocalStorage = () => {
    try {
      const key = getStorageKey();
      if (key) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  };

  // Load data from server first, then localStorage as fallback
  useEffect(() => {
    if (existingResults && existingResults.length > 0 && session && term) {
      // Find the result for the current session and term
      const currentResult = existingResults.find(
        (result) =>
          result.term === term &&
          result.year === parseInt(session.split("/")[0])
      );

      if (currentResult) {
        // Populate scores from server data
        const serverScores: Record<
          string,
          { ca1: string; ca2: string; exam: string }
        > = {};
        currentResult.scores.forEach((score) => {
          serverScores[score.subject] = {
            ca1: score.assessments.ca1.toString(),
            ca2: score.assessments.ca2.toString(),
            exam: score.assessments.exam.toString(),
          };
        });
        setScores(serverScores);

        // Populate comments from server data
        setComments((prev) => ({
          ...prev,
          teacher: currentResult.comment || "",
        }));
      }
    } else {
      // Fallback to localStorage if no server data
      const savedData = loadFromLocalStorage();
      if (savedData) {
        if (savedData.scores) setScores(savedData.scores);
        if (savedData.domainTraits) setDomainTraits(savedData.domainTraits);
        if (savedData.comments) setComments(savedData.comments);
      }
    }
  }, [existingResults, session, term, studentId]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = { scores, domainTraits, comments };
    saveToLocalStorage(dataToSave);
  }, [scores, domainTraits, comments]);

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
      if (!session || !term) {
        throw new Error("Session and term are required");
      }

      // Find the session data to get the year
      const sessionData = sessions?.find((s) => s.name === session);
      if (!sessionData) {
        throw new Error("Session not found");
      }

      // Transform scores into the expected format
      const transformedScores = subjects.map((subject) => {
        const subjectScores = scores[subject] || {
          ca1: "0",
          ca2: "0",
          exam: "0",
        };
        const ca1 = parseFloat(subjectScores.ca1) || 0;
        const ca2 = parseFloat(subjectScores.ca2) || 0;
        const exam = parseFloat(subjectScores.exam) || 0;
        const totalScore = ca1 + ca2 + exam;

        return {
          subject,
          assessments: {
            ca1,
            ca2,
            exam,
          },
          totalScore,
        };
      });

      // Submit the results
      await submitResult(studentId, {
        term,
        year: sessionData.startYear,
        scores: transformedScores,
        comment: comments.teacher || "",
      });

      // Clear localStorage after successful save
      clearLocalStorage();

      // Navigate back to results management
      router.push("/teacher/results");
    } catch (error) {
      console.error("Error saving results:", error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/teacher/results");
  };

  if (studentLoading || subjectsLoading || resultsLoading) {
    return (
      <RoleGuard allowed={["teacher"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">
              {studentLoading
                ? "Loading student data..."
                : subjectsLoading
                ? "Loading subjects..."
                : "Loading existing results..."}
            </div>
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
            <div className="bg-white border border-gray-300">
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Subject Scores
                </h3>
              </div>
              <div className="p-4">
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
                    {subjects.map((subject: string, index: number) => (
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
                            className="text-center h-9 bg-white border-gray-300 rounded-none"
                            value={scores[subject]?.ca1 || ""}
                            onChange={(e) =>
                              handleScoreChange(subject, "ca1", e.target.value)
                            }
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            className="text-center h-9 bg-white border-gray-300 rounded-none"
                            value={scores[subject]?.ca2 || ""}
                            onChange={(e) =>
                              handleScoreChange(subject, "ca2", e.target.value)
                            }
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            className="text-center h-9 bg-white border-gray-300 rounded-none"
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
            </div>

            {/* Right Column - Domain Traits and Info */}
            <div className="space-y-6">
              {/* Domain Traits */}
              <div className="bg-white border border-gray-300">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
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
                        <SelectTrigger className="h-9 bg-white border-gray-300 rounded-none">
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
                          <SelectTrigger className="h-9 bg-white border-gray-300 rounded-none">
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
                          <SelectTrigger className="h-9 bg-white border-gray-300 rounded-none">
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
                          <SelectTrigger className="h-9 bg-white border-gray-300 rounded-none">
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
                          <SelectTrigger className="h-9 bg-white border-gray-300 rounded-none">
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
              <div className="bg-white border border-gray-300">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
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
                            className="h-9 bg-white border-gray-300 rounded-none"
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
                            className="h-9 bg-white border-gray-300 rounded-none"
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
                            className="h-9 bg-white border-gray-300 rounded-none"
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
                            className="h-9 bg-white border-gray-300 rounded-none"
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
