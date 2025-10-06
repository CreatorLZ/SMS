import React, { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useResultsManagementStore } from "@/store/resultsManagementStore";
import { Student } from "@/hooks/useResultsStudentsQuery";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ActionButton {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (studentId: string) => void;
  variant?: "default" | "outline" | "secondary";
}

interface ResultsStudentTableProps {
  students: Student[];
  pagination?: Pagination;
  onEnterResults?: (studentId: string) => void; // Keep for backward compatibility
  actions?: ActionButton[];
  buttonText?: string; // Keep for backward compatibility
  buttonIcon?: React.ComponentType<{ className?: string }>; // Keep for backward compatibility
}

export default function ResultsStudentTable({
  students,
  onEnterResults,
  actions,
  buttonText = "Enter Results",
  buttonIcon: ButtonIcon = UserCheck,
}: ResultsStudentTableProps) {
  // Support both old and new prop patterns
  const actionButtons =
    actions ||
    (onEnterResults
      ? [
          {
            text: buttonText,
            icon: ButtonIcon,
            onClick: onEnterResults,
          },
        ]
      : []);
  const { searchQuery, setSearchQuery } = useResultsManagementStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Students are already filtered by the hook
  const filteredStudents = students;

  // Focus management for keyboard navigation
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  const handleEnterResults = (studentId: string) => {
    if (actionButtons.length > 0) {
      actionButtons[0].onClick(studentId); // Use first action for backward compatibility
    } else if (onEnterResults) {
      onEnterResults(studentId);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (filteredStudents.length === 0) return;

    const maxRows = filteredStudents.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedRowIndex((prev) =>
          prev === null ? 0 : Math.min(maxRows - 1, prev + 1)
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedRowIndex((prev) =>
          prev === null ? maxRows - 1 : Math.max(0, prev - 1)
        );
        break;
      case "Enter":
        if (focusedRowIndex !== null && filteredStudents[focusedRowIndex]) {
          handleEnterResults(filteredStudents[focusedRowIndex]._id);
        }
        break;
      case "Home":
        event.preventDefault();
        setFocusedRowIndex(0);
        break;
      case "End":
        event.preventDefault();
        setFocusedRowIndex(maxRows - 1);
        break;
      default:
        break;
    }
  };

  const handleRowClick = (index: number) => {
    setFocusedRowIndex(index);
  };

  const handleRowDoubleClick = (studentId: string) => {
    handleEnterResults(studentId);
  };

  return (
    <div className="space-y-4" role="region" aria-label="Student results table">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-2">
        <div className="relative flex-1 max-w-sm w-full">
          <label htmlFor="student-search" className="sr-only">
            Search students by name or student ID
          </label>
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
            aria-hidden="true"
          />
          <Input
            id="student-search"
            ref={searchInputRef}
            placeholder="Search by name or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Type to filter students by name or registration number
          </div>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 whitespace-nowrap"
          aria-live="polite"
        >
          {filteredStudents.length} student
          {filteredStudents.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="alert">
            {searchQuery
              ? "No students found matching your search."
              : "No students found."}
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <div
              key={student._id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                focusedRowIndex === index
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleRowClick(index)}
              onDoubleClick={() => handleRowDoubleClick(student._id)}
              tabIndex={focusedRowIndex === index ? 0 : -1}
              role="row"
              aria-rowindex={index + 1}
              aria-selected={focusedRowIndex === index}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {student.fullName ||
                        `${student.firstName} ${student.lastName}`}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono">
                      ID: {student.studentId}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {student.gender || "Not specified"}
                </Badge>
              </div>
              <div className="flex gap-2">
                {actionButtons.map((action, actionIndex) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={actionIndex}
                      size="sm"
                      variant={action.variant || "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(student._id);
                      }}
                      className="flex-1"
                      aria-label={`${action.text} for ${
                        student.fullName ||
                        `${student.firstName} ${student.lastName}`
                      }`}
                    >
                      <ActionIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                      {action.text}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <Table
          role="table"
          aria-label="Student results management table"
          aria-describedby="table-instructions"
        >
          <TableHeader>
            <TableRow role="row">
              <TableHead className="w-16" scope="col" aria-sort="none">
                #
              </TableHead>
              <TableHead scope="col" aria-sort="none">
                Reg No
              </TableHead>
              <TableHead scope="col" aria-sort="none">
                Name
              </TableHead>
              <TableHead scope="col" aria-sort="none">
                Gender
              </TableHead>
              <TableHead className="text-right" scope="col">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow role="row">
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  role="cell"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Search
                      className="h-8 w-8 text-gray-300"
                      aria-hidden="true"
                    />
                    <span>
                      {searchQuery
                        ? "No students found matching your search."
                        : "No students found."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, index) => (
                <TableRow
                  key={student._id}
                  role="row"
                  aria-rowindex={index + 1}
                  onKeyDown={handleKeyDown}
                  tabIndex={focusedRowIndex === index ? 0 : -1}
                  className={`cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    focusedRowIndex === index
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => handleRowClick(index)}
                  onDoubleClick={() => handleRowDoubleClick(student._id)}
                  aria-selected={focusedRowIndex === index}
                >
                  <TableCell
                    className="font-medium"
                    role="cell"
                    aria-label={`Row ${index + 1}`}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    className="font-mono text-sm"
                    role="cell"
                    aria-label={`Registration number: ${student.studentId}`}
                  >
                    {student.studentId}
                  </TableCell>
                  <TableCell
                    role="cell"
                    aria-label={`Student name: ${
                      student.fullName ||
                      `${student.firstName} ${student.lastName}`
                    }`}
                  >
                    {student.fullName ||
                      `${student.firstName} ${student.lastName}`}
                  </TableCell>
                  <TableCell role="cell">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      aria-label={`Gender: ${
                        student.gender || "Not specified"
                      }`}
                    >
                      {student.gender || "Not specified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" role="cell">
                    <div className="flex gap-2 justify-end">
                      {actionButtons.map((action, actionIndex) => {
                        const ActionIcon = action.icon;
                        return (
                          <Button
                            key={actionIndex}
                            size="sm"
                            variant={action.variant || "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(student._id);
                            }}
                            className="focus:ring-2 focus:ring-blue-300"
                            aria-label={`${action.text} for ${
                              student.fullName ||
                              `${student.firstName} ${student.lastName}`
                            }`}
                          >
                            <ActionIcon
                              className="h-4 w-4 mr-2"
                              aria-hidden="true"
                            />
                            {action.text}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Navigation Instructions */}
      <div id="table-instructions" className="sr-only">
        Use arrow keys to navigate between students. Press Enter to open the
        result entry modal. Use search field to filter students by name or
        registration number.
      </div>
    </div>
  );
}
