import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  GraduationCap,
  AlertTriangle,
  Keyboard,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useResultsManagementStore } from "@/store/resultsManagementStore";
import { Student } from "@/hooks/useResultsStudentsQuery";
import ResultsMarker from "@/components/ui/ResultsMarker";

interface StudentResultModalProps {
  students: Student[];
  selectedSession: string;
  selectedTerm: string;
  selectedClass: string;
}

export default function StudentResultModal({
  students,
  selectedSession,
  selectedTerm,
  selectedClass,
}: StudentResultModalProps) {
  const { isEntryModalOpen, selectedStudentId, setEntryModalOpen } =
    useResultsManagementStore();

  const [currentStudentIndex, setCurrentStudentIndex] = useState<number>(0);

  // Find current student and their index
  const currentStudent = students.find((_, index) => {
    if (selectedStudentId) {
      return students[index]._id === selectedStudentId;
    }
    return index === currentStudentIndex;
  });

  const currentIndex = selectedStudentId
    ? students.findIndex((student) => student._id === selectedStudentId)
    : currentStudentIndex;

  // Update current student index when selectedStudentId changes
  useEffect(() => {
    if (selectedStudentId) {
      const index = students.findIndex(
        (student) => student._id === selectedStudentId
      );
      if (index !== -1) {
        setCurrentStudentIndex(index);
      }
    }
  }, [selectedStudentId, students]);

  const handleClose = () => {
    setEntryModalOpen(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentStudentIndex(newIndex);
      // Update selected student ID for consistency
      const newStudent = students[newIndex];
      if (newStudent) {
        setEntryModalOpen(true, newStudent._id);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentStudentIndex(newIndex);
      // Update selected student ID for consistency
      const newStudent = students[newIndex];
      if (newStudent) {
        setEntryModalOpen(true, newStudent._id);
      }
    }
  };

  const handleSave = () => {
    // The ResultsMarker component handles its own saving
    // This is just for navigation or additional actions
  };

  if (!currentStudent) {
    return null;
  }

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < students.length - 1;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEntryModalOpen) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          if (hasPrev) handlePrev();
          break;
        case "ArrowRight":
          event.preventDefault();
          if (hasNext) handleNext();
          break;
        case "Escape":
          event.preventDefault();
          // TODO: Check for unsaved changes before closing
          handleClose();
          break;
      }
    },
    [isEntryModalOpen, hasPrev, hasNext]
  );

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentStudent) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[95vh] overflow-hidden flex flex-col scale-in">
        {/* Single-Column Header Layout */}
        <div className="border-b flex-shrink-0">
          {/* Student Navigation Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={!hasPrev}
                className="h-8 w-8 p-0"
                title={`Previous student (←)`}
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>

              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <span className="font-medium">{currentIndex + 1}</span>
                <span>of</span>
                <span className="font-medium">{students.length}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!hasNext}
                className="h-8 w-8 p-0"
                title={`Next student (→)`}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Student Information */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Student Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                  {(
                    currentStudent.fullName ||
                    currentStudent.firstName + " " + currentStudent.lastName
                  )
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                {/* Student Details */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentStudent.fullName ||
                      `${currentStudent.firstName} ${currentStudent.lastName}`}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">
                      Reg No: {currentStudent.studentId}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {currentStudent.gender || "Not specified"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Academic Period Badge */}
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {selectedTerm} {selectedSession.split("/")[0]}-
                {selectedSession.split("/")[1]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Single-Column Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ResultsMarker
              classroomId={selectedClass}
              students={[
                {
                  _id: currentStudent._id,
                  fullName:
                    currentStudent.fullName ||
                    `${currentStudent.firstName} ${currentStudent.lastName}`,
                  studentId: currentStudent.studentId,
                },
              ]}
              selectedTerm={selectedTerm}
              selectedYear={parseInt(selectedSession.split("/")[0])}
              onSave={() => {
                // Auto-advance to next student if available
                if (hasNext) {
                  handleNext();
                } else {
                  handleClose();
                }
              }}
              onCancel={handleClose}
            />
          </div>

          {/* Keyboard Navigation Hint */}
          <div className="px-6 py-3 bg-gray-50 border-t">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Keyboard className="h-3 w-3" />
                <span>Use arrow keys to navigate students • Esc to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
