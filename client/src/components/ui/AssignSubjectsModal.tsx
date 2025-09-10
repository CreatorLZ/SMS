"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { X } from "lucide-react";
import { useToast } from "./use-toast";
import { Loader2, Search, BookOpen } from "lucide-react";
import {
  useAvailableSubjectsQuery,
  useClassroomSubjectsQuery,
} from "../../hooks/useClassroomSubjectsQuery";
import { useAssignSubjectsMutation } from "../../hooks/useAssignSubjectsMutation";
import { Subject } from "../../hooks/useSubjectsQuery";

interface AssignSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
}

export default function AssignSubjectsModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
}: AssignSubjectsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set()
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current classroom subjects
  const { data: classroomSubjectsData, isLoading: classroomSubjectsLoading } =
    useClassroomSubjectsQuery(classroomId);

  // Fetch available subjects
  const {
    data: availableSubjects,
    isLoading: availableSubjectsLoading,
    error: availableSubjectsError,
  } = useAvailableSubjectsQuery(classroomId);

  const assignSubjectsMutation = useAssignSubjectsMutation();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedSubjects(new Set());
      setCategoryFilter("all");
    }
  }, [isOpen]);

  // Get all subjects (assigned + available)
  const allSubjects = [
    ...(classroomSubjectsData?.subjects || []),
    ...(availableSubjects || []),
  ];

  // Filter subjects based on search and category
  const filteredSubjects = allSubjects.filter((subject) => {
    const matchesSearch = subject.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || subject.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(
    new Set(allSubjects.map((subject) => subject.category))
  );

  const handleSubjectToggle = (subjectId: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleSelectAll = () => {
    const availableIds = availableSubjects?.map((s) => s._id) || [];
    const filteredAvailableIds = filteredSubjects
      .filter((s) => availableIds.includes(s._id) && s.isActive)
      .map((s) => s._id);

    if (selectedSubjects.size === filteredAvailableIds.length) {
      // Deselect all
      setSelectedSubjects(new Set());
    } else {
      // Select all available active subjects in current filter
      setSelectedSubjects(new Set(filteredAvailableIds));
    }
  };

  const handleAssign = async () => {
    if (selectedSubjects.size === 0) {
      toast({
        title: "No subjects selected",
        description: "Please select at least one subject to assign.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update - immediately update UI
    const currentSubjects = classroomSubjectsData?.subjects || [];
    const subjectsToAssign =
      availableSubjects?.filter((s) => selectedSubjects.has(s._id)) || [];

    // Update cache optimistically for immediate UI feedback
    queryClient.setQueryData(
      ["classroom-subjects", classroomId],
      (old: any) => ({
        ...old,
        subjects: [...currentSubjects, ...subjectsToAssign],
      })
    );

    // Update available subjects optimistically
    queryClient.setQueryData(
      ["available-subjects", classroomId],
      (old: Subject[]) => old?.filter((s) => !selectedSubjects.has(s._id)) || []
    );

    try {
      await assignSubjectsMutation.mutateAsync({
        classroomId,
        data: { subjectIds: Array.from(selectedSubjects) },
      });

      // Get assigned subject names for detailed toast
      const assignedSubjectNames = subjectsToAssign
        .map((s) => s.name)
        .join(", ");

      // Success toast with detailed message
      toast({
        title: "✅ Subjects Assigned Successfully",
        description:
          selectedSubjects.size === 1
            ? `Assigned "${assignedSubjectNames}" to ${classroomName}`
            : `Assigned ${selectedSubjects.size} subjects to ${classroomName}`,
      });

      // Clear all form state completely after successful assignment
      setSelectedSubjects(new Set());
      setSearchTerm("");
      setCategoryFilter("all");

      // Force React to process state updates before closing modal
      setTimeout(() => {
        onClose();
      }, 0);
    } catch (error: any) {
      // Revert optimistic updates on error
      queryClient.invalidateQueries({
        queryKey: ["classroom-subjects", classroomId],
      });

      queryClient.invalidateQueries({
        queryKey: ["available-subjects", classroomId],
      });

      toast({
        title: "❌ Assignment Failed",
        description:
          error.response?.data?.message ||
          "Failed to assign subjects. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Core":
        return "bg-blue-100 text-blue-800";
      case "Science":
        return "bg-green-100 text-green-800";
      case "Humanities":
        return "bg-purple-100 text-purple-800";
      case "Business":
        return "bg-orange-100 text-orange-800";
      case "Trade":
        return "bg-yellow-100 text-yellow-800";
      case "Optional":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Primary":
        return "bg-emerald-100 text-emerald-800";
      case "Junior Secondary":
        return "bg-indigo-100 text-indigo-800";
      case "Senior Secondary":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isAssigned = (subjectId: string) => {
    return classroomSubjectsData?.subjects?.some((s) => s._id === subjectId);
  };

  const availableCount = availableSubjects?.length || 0;
  const assignedCount = classroomSubjectsData?.subjects?.length || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 relative">
        {/* Loading Overlay */}
        {assignSubjectsMutation.isPending && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Assigning subjects...</span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Assign Subjects to {classroomName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select subjects to assign to this classroom. Currently{" "}
              {assignedCount} subject{assignedCount !== 1 ? "s" : ""} assigned,{" "}
              {availableCount} available.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={availableSubjectsLoading}
              >
                {selectedSubjects.size ===
                (availableSubjects?.filter((s) =>
                  filteredSubjects.some((fs) => fs._id === s._id)
                ).length || 0)
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </div>

          {/* Subjects List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {availableSubjectsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="flex-1">
                              <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                              <div className="flex gap-2">
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : availableSubjectsError ? (
              <div className="text-center py-8 text-red-600">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="mb-4">Failed to load subjects</p>
                <p className="text-sm text-gray-600 mb-4">
                  {availableSubjectsError.message || "Please try again later"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : availableSubjects?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="mb-2">No subjects available for assignment</p>
                <p className="text-sm">
                  All subjects are already assigned to this classroom, or no
                  subjects exist in the database.
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Need subjects?</strong> Run the seed script to
                    populate the database:
                  </p>
                  <code className="block mt-2 p-2 bg-blue-100 text-blue-900 rounded text-xs">
                    cd server && npm run seed:subjects
                  </code>
                </div>
              </div>
            ) : (
              filteredSubjects.map((subject) => {
                const assigned = isAssigned(subject._id);
                const available = availableSubjects?.some(
                  (s) => s._id === subject._id
                );

                return (
                  <Card
                    key={subject._id}
                    className={`transition-colors ${
                      assigned
                        ? "bg-green-50 border-green-200"
                        : available
                        ? "hover:bg-muted/50"
                        : "bg-gray-50 opacity-60"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {available && (
                            <input
                              type="checkbox"
                              checked={selectedSubjects.has(subject._id)}
                              onChange={() => handleSubjectToggle(subject._id)}
                              disabled={assigned || !subject.isActive}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{subject.name}</h3>
                              {assigned && (
                                <Badge className="bg-green-100 text-green-800">
                                  Assigned
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                className={getCategoryColor(subject.category)}
                              >
                                {subject.category}
                              </Badge>
                              <Badge className={getLevelColor(subject.level)}>
                                {subject.level}
                              </Badge>
                              <Badge
                                variant={
                                  subject.isActive ? "default" : "secondary"
                                }
                              >
                                {subject.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {!available && !assigned && (
                          <span className="text-sm text-muted-foreground">
                            Not available for this level
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {filteredSubjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No subjects found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedSubjects.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedSubjects.size} subject
                    {selectedSubjects.size > 1 ? "s" : ""} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubjects(new Set())}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              selectedSubjects.size === 0 || assignSubjectsMutation.isPending
            }
          >
            {assignSubjectsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                {selectedSubjects.size === 0
                  ? "Assign Subjects"
                  : `Assign ${selectedSubjects.size} Subject${
                      selectedSubjects.size > 1 ? "s" : ""
                    }`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
