import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { toast } from "sonner";

import {
  useGetTimetable,
  useSaveTimetable,
  useUpdateTimetableEntry,
  useDeleteTimetableEntry,
} from "../../hooks/useTimetable";
import { useClassroomSubjectsQuery } from "../../hooks/useClassroomSubjectsQuery";
import { useTeachersQuery } from "../../hooks/useTeachersQuery";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  BookOpen,
  User,
  Loader2,
  Download,
  RotateCcw,
  CheckSquare,
  Square,
} from "lucide-react";

interface TimetableEntry {
  _id?: string;
  dayOfWeek: number; // 0-4 (Monday-Friday)
  period: number; // 1-8
  subject: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  classroom: string;
  isBreak?: boolean; // New field to distinguish break periods
  breakLabel?: string; // Label for break periods (e.g., "Lunch Break", "Recess")
}

interface TimetableManagerProps {
  classroomId: string;
  classroomName: string;
  onSave: (timetable: TimetableEntry[]) => void;
  existingTimetable?: TimetableEntry[];
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Home Economics",
  "Religious Studies",
];

export default function TimetableManager({
  classroomId,
  classroomName,
  onSave,
  existingTimetable = [],
}: TimetableManagerProps) {
  const [timetable, setTimetable] =
    useState<TimetableEntry[]>(existingTimetable);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set()
  );
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Load existing timetable data with enhanced caching
  const {
    data: timetableData,
    isLoading: timetableLoading,
    error: timetableError,
    refetch: refetchTimetable,
  } = useGetTimetable(classroomId);

  // Type guard to check if timetableData has the expected structure
  const hasTimetableData =
    timetableData &&
    typeof timetableData === "object" &&
    "timetable" in timetableData;

  // Real teachers data from API - all teachers available
  const { data: teachers = [], isLoading: teachersLoading } =
    useTeachersQuery();

  // Classroom subjects data from API
  const { data: classroomSubjectsData, isLoading: subjectsLoading } =
    useClassroomSubjectsQuery(classroomId);

  // Update timetable entry hook
  const updateTimetableEntry = useUpdateTimetableEntry();

  // Update local state when timetable data is loaded
  useEffect(() => {
    if (hasTimetableData && timetableData.timetable) {
      const formattedTimetable = (timetableData as any).timetable.map(
        (entry: any) => ({
          _id: entry._id,
          dayOfWeek: entry.dayOfWeek,
          period: entry.period,
          subject: entry.subject,
          teacherId: entry.teacherId,
          teacherName: entry.teacherName,
          startTime: entry.startTime,
          endTime: entry.endTime,
          classroom: entry.classroom || classroomName,
        })
      );
      setTimetable(formattedTimetable);
    } else if (timetableData && !hasTimetableData) {
      // No timetable exists yet, keep empty state
      setTimetable([]);
    }
  }, [timetableData, classroomName, hasTimetableData]);

  const getTimetableForDay = (dayIndex: number) => {
    return timetable
      .filter((entry) => entry.dayOfWeek === dayIndex)
      .sort((a, b) => a.period - b.period);
  };

  const getEntryForSlot = (dayIndex: number, period: number) => {
    return timetable.find(
      (entry) => entry.dayOfWeek === dayIndex && entry.period === period
    );
  };

  const handleAddEntry = () => {
    setEditingEntry({
      dayOfWeek: 1, // Monday
      period: 1,
      subject: "",
      teacherId: "",
      teacherName: "",
      startTime: "08:00",
      endTime: "09:00",
      classroom: classroomName,
    });
    setShowAddForm(true);
  };

  const handleEditEntry = (entry: TimetableEntry) => {
    setEditingEntry({ ...entry });
    setShowAddForm(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    setTimetable((prev) => prev.filter((entry) => entry._id !== entryId));
    toast.success("Entry deleted", {
      description: "Timetable entry has been removed",
    });
  };

  const handleSaveEntry = async () => {
    if (!editingEntry) return;

    // Validate required fields based on period type
    if (editingEntry.isBreak) {
      if (!editingEntry.breakLabel?.trim()) {
        toast.error("Validation Error", {
          description: "Please provide a break label",
        });
        return;
      }
    } else {
      if (!editingEntry.subject || !editingEntry.teacherId) {
        toast.error("Validation Error", {
          description: "Please fill in all required fields",
        });
        return;
      }
    }

    // Check for conflicts
    const conflict = timetable.find(
      (entry) =>
        entry.dayOfWeek === editingEntry.dayOfWeek &&
        entry.period === editingEntry.period &&
        entry._id !== editingEntry._id
    );

    if (conflict) {
      const conflictDescription = conflict.isBreak
        ? conflict.breakLabel || "Break"
        : conflict.subject;
      toast.error("Schedule Conflict", {
        description: `This time slot is already occupied by ${conflictDescription}`,
      });
      return;
    }

    try {
      const teacher = teachers.find((t) => t._id === editingEntry.teacherId);
      const entryData = {
        ...editingEntry,
        teacherName: teacher?.name || "",
      };

      // If editing existing entry, update it
      if (editingEntry._id && !editingEntry._id.startsWith("temp_")) {
        await updateTimetableEntry.mutateAsync({
          classroomId,
          entryId: editingEntry._id,
          updateData: entryData,
        });
      } else {
        // For new entries, add to local state (will be saved when saving entire timetable)
        const newEntry = {
          ...entryData,
          _id: editingEntry._id || `temp_${Date.now()}`,
        };

        setTimetable((prev) => {
          const existingIndex = prev.findIndex(
            (entry) => entry._id === editingEntry._id
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newEntry;
            return updated;
          } else {
            return [...prev, newEntry];
          }
        });
      }

      setEditingEntry(null);
      setShowAddForm(false);

      const entryType = editingEntry.isBreak ? "break period" : "class period";
      toast.success("Entry saved", {
        description: `${
          editingEntry.isBreak
            ? editingEntry.breakLabel || "Break"
            : editingEntry.subject
        } ${entryType} has been saved successfully`,
      });
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast.error("Error", {
        description: error.response?.data?.message || "Failed to save entry",
      });
    }
  };

  const handleSaveTimetable = async () => {
    try {
      setIsSaving(true);
      await onSave(timetable);
      toast.success("Timetable saved", {
        description: "Class timetable has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving timetable:", error);
      toast.error("Error", {
        description:
          error.response?.data?.message || "Failed to save timetable",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk operations
  const handleSelectAllEntries = () => {
    if (selectedEntries.size === timetable.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(timetable.map((entry) => entry._id || "")));
    }
  };

  const handleEntrySelect = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedEntries.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${
      selectedEntries.size
    } timetable entr${selectedEntries.size === 1 ? "y" : "ies"}?`;
    if (!confirm(confirmMessage)) return;

    setTimetable((prev) =>
      prev.filter((entry) => !entry._id || !selectedEntries.has(entry._id))
    );
    setSelectedEntries(new Set());

    toast.success("Bulk delete completed", {
      description: `${selectedEntries.size} entries removed from timetable`,
    });
  };

  const handleExportTimetable = () => {
    const exportData = {
      classroom: classroomName,
      generatedAt: new Date().toISOString(),
      timetable: timetable.map((entry) => ({
        day: DAYS_OF_WEEK[entry.dayOfWeek],
        period: entry.period,
        type: entry.isBreak ? "Break" : "Class",
        subject: entry.isBreak ? entry.breakLabel || "Break" : entry.subject,
        teacher: entry.isBreak ? "" : entry.teacherName,
        time: `${entry.startTime} - ${entry.endTime}`,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${classroomName.replace(
      /\s+/g,
      "_"
    )}_timetable_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Export completed", {
      description: "Timetable exported successfully",
    });
  };

  const handleClearTimetable = () => {
    if (
      !confirm(
        "Are you sure you want to clear the entire timetable? This action cannot be undone."
      )
    )
      return;

    setTimetable([]);
    setSelectedEntries(new Set());

    toast.success("Timetable cleared", {
      description: "All entries have been removed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Class Timetable - {classroomName}</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={handleExportTimetable}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={timetable.length === 0}
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button
                onClick={handleClearTimetable}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                disabled={timetable.length === 0}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </Button>
              <Button
                onClick={handleAddEntry}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Period</span>
              </Button>
              <Button
                onClick={handleSaveTimetable}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Timetable"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedEntries.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedEntries.size} entr
                  {selectedEntries.size === 1 ? "y" : "ies"} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSelectAllEntries}
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  {selectedEntries.size === timetable.length ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showAddForm && editingEntry && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntry._id ? "Edit Period" : "Add New Period"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day
                </label>
                <select
                  value={editingEntry.dayOfWeek}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      dayOfWeek: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select
                  value={editingEntry.period}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      period: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERIODS.map((period) => (
                    <option key={period} value={period}>
                      Period {period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Type
                </label>
                <select
                  value={editingEntry.isBreak ? "break" : "class"}
                  onChange={(e) => {
                    const isBreak = e.target.value === "break";
                    setEditingEntry({
                      ...editingEntry,
                      isBreak,
                      subject: isBreak ? "" : editingEntry.subject,
                      teacherId: isBreak ? "" : editingEntry.teacherId,
                      teacherName: isBreak ? "" : editingEntry.teacherName,
                      breakLabel: isBreak
                        ? editingEntry.breakLabel || "Break"
                        : "",
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="class">Class Period</option>
                  <option value="break">Break Period</option>
                </select>
              </div>

              {editingEntry.isBreak ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Break Label *
                  </label>
                  <input
                    type="text"
                    value={editingEntry.breakLabel || ""}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        breakLabel: e.target.value,
                      })
                    }
                    placeholder="e.g., Lunch Break, Recess"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      value={editingEntry.subject}
                      onChange={(e) =>
                        setEditingEntry({
                          ...editingEntry,
                          subject: e.target.value,
                          teacherId: "", // Reset teacher when subject changes
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Subject</option>
                      {classroomSubjectsData?.subjects?.map((subject) => (
                        <option key={subject._id} value={subject.name}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher *
                    </label>
                    <select
                      value={editingEntry.teacherId}
                      onChange={(e) => {
                        const teacher = teachers.find(
                          (t) => t._id === e.target.value
                        );
                        setEditingEntry({
                          ...editingEntry,
                          teacherId: e.target.value,
                          teacherName: teacher?.name || "",
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={editingEntry.startTime}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={editingEntry.endTime}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEntry}>Save Period</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {timetableLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading timetable...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {timetableError && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-red-600">
              <p className="font-medium">Failed to load timetable</p>
              <p className="text-sm mt-1">
                {timetableError.message || "Please try again later"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Timetable Grid */}
      {!timetableLoading && !timetableError && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                      Day
                    </th>
                    {PERIODS.map((period) => (
                      <th
                        key={period}
                        className="border border-gray-300 px-4 py-2 text-center font-medium min-w-[150px]"
                      >
                        Period {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map((day, dayIndex) => (
                    <tr key={dayIndex} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                        {day}
                      </td>
                      {PERIODS.map((period) => {
                        const entry = getEntryForSlot(dayIndex, period);
                        return (
                          <td
                            key={period}
                            className="border border-gray-300 px-2 py-2"
                          >
                            {entry ? (
                              entry.isBreak ? (
                                <div className="space-y-2 bg-green-50 p-3 rounded-md border border-green-200">
                                  <div className="text-sm font-medium text-green-800 flex items-center space-x-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{entry.breakLabel || "Break"}</span>
                                  </div>
                                  <div className="text-xs text-green-600">
                                    {entry.startTime} - {entry.endTime}
                                  </div>
                                  <div className="flex space-x-1 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditEntry(entry)}
                                      className="h-6 px-2 border-green-300 text-green-700 hover:bg-green-100"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDeleteEntry(entry._id!)
                                      }
                                      className="h-6 px-2 text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {entry.subject}
                                  </div>
                                  <div className="text-xs text-gray-600 flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{entry.teacherName}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {entry.startTime} - {entry.endTime}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditEntry(entry)}
                                      className="h-6 px-2"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDeleteEntry(entry._id!)
                                      }
                                      className="h-6 px-2 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="text-center py-4 text-gray-400">
                                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs">No class scheduled</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingEntry({
                                      dayOfWeek: dayIndex,
                                      period,
                                      subject: "",
                                      teacherId: "",
                                      teacherName: "",
                                      startTime: "08:00",
                                      endTime: "09:00",
                                      classroom: classroomName,
                                    });
                                    setShowAddForm(true);
                                  }}
                                  className="mt-2 h-6 text-xs"
                                >
                                  Add Class
                                </Button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {timetable.length}
                </p>
                <p className="text-sm text-gray-600">Total Periods</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(timetable.map((entry) => entry.teacherId)).size}
                </p>
                <p className="text-sm text-gray-600">Active Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {PERIODS.length}
                </p>
                <p className="text-sm text-gray-600">Periods per Day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(timetable.length / DAYS_OF_WEEK.length)}
                </p>
                <p className="text-sm text-gray-600">Avg Periods/Day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
