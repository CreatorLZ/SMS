import { useState, useEffect, useMemo } from "react";
import { useStudentsQuery, Student } from "@/hooks/useStudentsQuery";
import { useAssignStudentsMutation } from "@/hooks/useAssignStudentsMutation";
import { useAddStudentsMutation } from "@/hooks/useAddStudentsMutation";
import { useRemoveStudentsMutation } from "@/hooks/useRemoveStudentsMutation";
import { useClassroomsQuery } from "@/hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "@/store/classroomManagementStore";
import { useStudentManagementStore } from "@/store/studentManagementStore";
import { toast } from "sonner";
import { Button } from "./button";
import { Input } from "./input";
import {
  Plus,
  UserMinus,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Terminal,
  Database,
  GraduationCap,
  Users as UsersIcon,
} from "lucide-react";

export default function AssignStudentsModal() {
  const { isAssignModalOpen, selectedClassroomId, setAssignModalOpen } =
    useClassroomManagementStore();
  const { setCreateModalOpen, closeAllModals } = useStudentManagementStore();

  const [searchTerm, setSearchTerm] = useState("");

  const { data: studentsResponse } = useStudentsQuery(
    undefined, // search - we'll handle client-side search
    undefined, // classId
    1, // page
    1000, // limit - fetch more students for assignment
    true, // forClassroomAssignment
    selectedClassroomId || undefined // classroomId
  );

  // Filter students based on search term (client-side search for better UX)
  const students = useMemo(() => {
    if (!studentsResponse?.students) return [];

    let filtered = studentsResponse.students;

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.fullName?.toLowerCase().includes(searchLower) ||
          student.studentId?.toLowerCase().includes(searchLower) ||
          student.currentClass?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [studentsResponse?.students, searchTerm]);

  const { data: classrooms } = useClassroomsQuery();

  const assignStudentsMutation = useAssignStudentsMutation();
  const addStudentsMutation = useAddStudentsMutation();
  const removeStudentsMutation = useRemoveStudentsMutation();

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [originalStudentIds, setOriginalStudentIds] = useState<string[]>([]);

  // Get current classroom data
  const currentClassroom = classrooms?.find(
    (c) => c._id === selectedClassroomId
  );

  useEffect(() => {
    if (currentClassroom && isAssignModalOpen) {
      // Pre-select currently assigned students
      const currentIds = currentClassroom.students.map((s) => s._id);
      setSelectedStudentIds(currentIds);
      setOriginalStudentIds(currentIds);
      // Clear search when modal opens
      setSearchTerm("");
    }
  }, [currentClassroom, isAssignModalOpen]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddSelectedStudents = async () => {
    if (!selectedClassroomId) return;

    const newStudentIds = selectedStudentIds.filter(
      (id) => !originalStudentIds.includes(id)
    );

    if (newStudentIds.length === 0) {
      toast.error("No new students selected to add");
      return;
    }

    try {
      // Use assignStudentsMutation (same as "Update All") to avoid authorization issues
      await assignStudentsMutation.mutateAsync({
        classroomId: selectedClassroomId,
        data: { studentIds: selectedStudentIds }, // Send all selected students
      });
      toast.success(`${newStudentIds.length} students added successfully!`);
      setOriginalStudentIds(selectedStudentIds);
    } catch (error: any) {
      console.error("Error adding students:", error);
      toast.error(error?.response?.data?.message || "Failed to add students");
    }
  };

  const handleRemoveSelectedStudents = async () => {
    if (!selectedClassroomId) return;

    const studentsToRemove = originalStudentIds.filter(
      (id) => !selectedStudentIds.includes(id)
    );

    if (studentsToRemove.length === 0) {
      toast.error("No students selected to remove");
      return;
    }

    try {
      await removeStudentsMutation.mutateAsync({
        classroomId: selectedClassroomId,
        data: { studentIds: studentsToRemove },
      });
      toast.success(
        `${studentsToRemove.length} students removed successfully!`
      );
      setOriginalStudentIds(selectedStudentIds);
    } catch (error: any) {
      console.error("Error removing students:", error);
      toast.error(
        error?.response?.data?.message || "Failed to remove students"
      );
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedClassroomId) return;

    try {
      await assignStudentsMutation.mutateAsync({
        classroomId: selectedClassroomId,
        data: { studentIds: selectedStudentIds },
      });
      toast.success("Students updated successfully!");
      setOriginalStudentIds(selectedStudentIds);
    } catch (error: any) {
      console.error("Error updating students:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update students"
      );
    }
  };

  const getStudentStatus = (studentId: string) => {
    const isOriginallyAssigned = originalStudentIds.includes(studentId);
    const isCurrentlySelected = selectedStudentIds.includes(studentId);

    if (isOriginallyAssigned && isCurrentlySelected) return "assigned";
    if (!isOriginallyAssigned && isCurrentlySelected) return "to-add";
    if (isOriginallyAssigned && !isCurrentlySelected) return "to-remove";
    return "unassigned";
  };

  const getStatusCounts = () => {
    let assigned = 0;
    let toAdd = 0;
    let toRemove = 0;

    students.forEach((student) => {
      const status = getStudentStatus(student._id);
      if (status === "assigned") assigned++;
      else if (status === "to-add") toAdd++;
      else if (status === "to-remove") toRemove++;
    });

    return { assigned, toAdd, toRemove };
  };

  const { assigned, toAdd, toRemove } = getStatusCounts();
  const hasChanges = toAdd > 0 || toRemove > 0;

  if (!isAssignModalOpen || !currentClassroom) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      {/* Retro CRT scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(75, 85, 99, 0.1) 2px,
            rgba(75, 85, 99, 0.1) 4px
          )`,
        }}
      />

      {/* Main Terminal Container */}
      <div className="w-full max-w-4xl max-h-[95vh] bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl relative overflow-hidden">
        {/* Terminal Header */}
        <div className="border-b-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                <span className="text-sm md:text-base font-bold">
                  {currentClassroom.name.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Header */}
        {/* <div className="border-b border-gray-600 p-3 md:p-4 bg-gray-100/10">
          <div className="text-sm font-bold text-center">
            Assigning Students to {currentClassroom.name}
          </div>
        </div> */}

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Content Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="border-b border-gray-600 mb-4 pb-2">
              <div className="text-sm font-bold">
                STUDENT ASSIGNMENT MANAGEMENT
              </div>
              <div className="text-xs">
                SELECT STUDENTS TO ASSIGN/REMOVE FROM CLASS
              </div>
            </div>

            {/* Status Summary */}
            <div className="mb-4 border border-gray-600 p-4 bg-gray-100/20">
              <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1 flex items-center gap-2">
                <Database className="w-4 h-4" />
                ASSIGNMENT STATUS SUMMARY
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-1">
                  <div className="w-full md:w-40 font-bold">
                    CURRENTLY ASSIGNED:
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>{assigned} students</span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-1">
                  <div className="w-full md:w-40 font-bold">TO BE ADDED:</div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>{toAdd} students</span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-1">
                  <div className="w-full md:w-40 font-bold">TO BE REMOVED:</div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span>{toRemove} students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="border border-gray-600 p-4 bg-gray-100/20">
                <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  STUDENT SEARCH SYSTEM
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-40 font-bold mb-1 md:mb-0 text-xs">
                    SEARCH QUERY:
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 text-xs"
                      placeholder="Enter student name, ID, or class..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="mb-6 border border-gray-600 p-4 bg-gray-100/20">
              <div className="text-xs mb-3 font-bold border-b border-gray-600 pb-1 flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                STUDENT DATABASE
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {students.length} students found
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <div className="space-y-1 text-xs">
                  {students?.map((student: Student) => {
                    const status = getStudentStatus(student._id);
                    const isSelected = selectedStudentIds.includes(student._id);
                    return (
                      <div
                        key={student._id}
                        onClick={() => handleStudentToggle(student._id)}
                        className={`border border-gray-600/30 p-3 transition-all cursor-pointer hover:border-gray-600 hover:shadow-sm ${
                          status === "assigned"
                            ? "bg-green-50/50"
                            : status === "to-add"
                            ? "bg-blue-50/50"
                            : status === "to-remove"
                            ? "bg-red-50/50"
                            : "bg-gray-50/50"
                        } ${
                          isSelected
                            ? "ring-2 ring-blue-500 ring-opacity-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={student._id}
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent double triggering
                                handleStudentToggle(student._id);
                              }}
                              className="rounded border-gray-600"
                            />
                            <div>
                              <div className="font-bold text-gray-900">
                                {student.fullName}
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div>STUDENT ID: {student.studentId}</div>
                                <div>CURRENT CLASS: {student.currentClass}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {status === "assigned" && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded">
                                ASSIGNED
                              </span>
                            )}
                            {status === "to-add" && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 border border-blue-300 rounded">
                                TO ADD
                              </span>
                            )}
                            {status === "to-remove" && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 border border-red-300 rounded">
                                TO REMOVE
                              </span>
                            )}
                            {status === "unassigned" && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 border border-gray-300 rounded">
                                AVAILABLE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Command Bar */}
          <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm font-bold">
                {hasChanges ? "Changes Pending" : "Ready"}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-bold"
                >
                  [CANCEL]
                </button>

                {toAdd > 0 && (
                  <button
                    onClick={handleAddSelectedStudents}
                    disabled={assignStudentsMutation.isPending}
                    className="px-4 py-2 border border-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {assignStudentsMutation.isPending
                      ? "[ADDING...]"
                      : `[ADD ${toAdd} STUDENTS]`}
                  </button>
                )}

                {toRemove > 0 && (
                  <button
                    onClick={handleRemoveSelectedStudents}
                    disabled={removeStudentsMutation.isPending}
                    className="px-4 py-2 border border-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {removeStudentsMutation.isPending
                      ? "[REMOVING...]"
                      : `[REMOVE ${toRemove} STUDENTS]`}
                  </button>
                )}

                {hasChanges && (
                  <button
                    onClick={handleBulkUpdate}
                    disabled={assignStudentsMutation.isPending}
                    className="px-4 py-2 border border-green-600 bg-green-50 hover:bg-green-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                  >
                    {assignStudentsMutation.isPending
                      ? "[UPDATING...]"
                      : "[UPDATE ALL]"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
