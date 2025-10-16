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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Manage Students - {currentClassroom.name}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search students by name, ID, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Summary */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{assigned} Assigned</span>
              </span>
              <span className="flex items-center space-x-1">
                <Plus className="h-4 w-4 text-blue-600" />
                <span>{toAdd} To Add</span>
              </span>
              <span className="flex items-center space-x-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>{toRemove} To Remove</span>
              </span>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="mb-6">
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="p-4 space-y-3">
              {students?.map((student: Student) => {
                const status = getStudentStatus(student._id);
                return (
                  <div
                    key={student._id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      status === "assigned"
                        ? "bg-green-50 border-green-200"
                        : status === "to-add"
                        ? "bg-blue-50 border-blue-200"
                        : status === "to-remove"
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={student._id}
                        checked={selectedStudentIds.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <label
                          htmlFor={student._id}
                          className="font-medium text-gray-900 cursor-pointer"
                        >
                          {student.fullName}
                        </label>
                        <p className="text-sm text-gray-600">
                          ID: {student.studentId} | Class:{" "}
                          {student.currentClass}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status === "assigned" && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Assigned
                        </span>
                      )}
                      {status === "to-add" && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          To Add
                        </span>
                      )}
                      {status === "to-remove" && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          To Remove
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={() => setAssignModalOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>

          <div className="flex space-x-2">
            {toAdd > 0 && (
              <Button
                onClick={handleAddSelectedStudents}
                disabled={assignStudentsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assignStudentsMutation.isPending ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {toAdd} Students
                  </>
                )}
              </Button>
            )}

            {toRemove > 0 && (
              <Button
                onClick={handleRemoveSelectedStudents}
                disabled={removeStudentsMutation.isPending}
                variant="destructive"
              >
                {removeStudentsMutation.isPending ? (
                  "Removing..."
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove {toRemove} Students
                  </>
                )}
              </Button>
            )}

            {hasChanges && (
              <Button
                onClick={handleBulkUpdate}
                disabled={assignStudentsMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {assignStudentsMutation.isPending ? (
                  "Updating..."
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Update All
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
