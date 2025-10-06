import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StudentResult } from "@/hooks/useResults";

interface ViewResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  results: StudentResult[];
  session: string;
  term: string;
  className: string;
}

export default function ViewResultsModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  results,
  session,
  term,
  className,
}: ViewResultsModalProps) {
  // Find the result for the current session and term
  const currentResult = results.find(
    (result) =>
      result.term === term && result.year === parseInt(session.split("/")[0])
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              Student Results - {studentName}
            </h2>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <span>ID: {studentId}</span>
              <span>Class: {className}</span>
              <span>Session: {session}</span>
              <span>Term: {term}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!currentResult ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found for the selected session and term.
            </div>
          ) : (
            <>
              {/* Subject Scores */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Subject Scores
                  </h3>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700 text-sm">
                          Subject
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          CA1
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          CA2
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          Exam
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          Total
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700 text-sm w-32">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResult.scores.map((score, index) => (
                        <tr
                          key={score.subject}
                          className={
                            index !== currentResult.scores.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          }
                        >
                          <td className="py-3 px-2 text-gray-700 text-sm font-medium">
                            {score.subject}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm">
                            {score.assessments.ca1}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm">
                            {score.assessments.ca2}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm">
                            {score.assessments.exam}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 text-sm font-semibold">
                            {score.totalScore}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge
                              variant={
                                score.totalScore >= 70
                                  ? "default"
                                  : score.totalScore >= 60
                                  ? "secondary"
                                  : score.totalScore >= 50
                                  ? "outline"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {score.totalScore >= 70
                                ? "A"
                                : score.totalScore >= 60
                                ? "B"
                                : score.totalScore >= 50
                                ? "C"
                                : score.totalScore >= 45
                                ? "D"
                                : "F"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comments */}
              {currentResult.comment && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Teacher's Comment
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 text-sm">
                      {currentResult.comment}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
