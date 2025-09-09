import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { useToast } from "./use-toast";
import { useTeachersBySubject } from "../../hooks/useTeachersBySubject";
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
  const { toast } = useToast();
  const [timetable, setTimetable] =
    useState<TimetableEntry[]>(existingTimetable);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real teachers data from API
  const { data: teachers = [], isLoading: teachersLoading } =
    useTeachersBySubject();

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
    toast({
      title: "Entry deleted",
      description: "Timetable entry has been removed",
    });
  };

  const handleSaveEntry = () => {
    if (!editingEntry) return;

    // Validate required fields
    if (!editingEntry.subject || !editingEntry.teacherId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for conflicts
    const conflict = timetable.find(
      (entry) =>
        entry.dayOfWeek === editingEntry.dayOfWeek &&
        entry.period === editingEntry.period &&
        entry._id !== editingEntry._id
    );

    if (conflict) {
      toast({
        title: "Schedule Conflict",
        description: `This time slot is already occupied by ${conflict.subject}`,
        variant: "destructive",
      });
      return;
    }

    const teacher = teachers.find((t) => t._id === editingEntry.teacherId);
    const updatedEntry = {
      ...editingEntry,
      teacherName: teacher?.name || "",
      _id: editingEntry._id || `temp_${Date.now()}`,
    };

    setTimetable((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry._id === editingEntry._id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedEntry;
        return updated;
      } else {
        return [...prev, updatedEntry];
      }
    });

    setEditingEntry(null);
    setShowAddForm(false);

    toast({
      title: "Entry saved",
      description: "Timetable entry has been saved successfully",
    });
  };

  const handleSaveTimetable = async () => {
    try {
      setIsSaving(true);
      await onSave(timetable);
      toast({
        title: "Timetable saved",
        description: "Class timetable has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving timetable:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save timetable",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailableTeachers = (subject: string) => {
    if (!subject || subject === "") return teachers;
    return teachers.filter((teacher) =>
      teacher.subjectSpecialization
        ?.toLowerCase()
        .includes(subject.toLowerCase())
    );
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
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
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
                  {getAvailableTeachers(editingEntry.subject).map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

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

      {/* Weekly Timetable Grid */}
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
                    Period
                  </th>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <th
                      key={index}
                      className="border border-gray-300 px-4 py-2 text-center font-medium min-w-[150px]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                      Period {period}
                    </td>
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const entry = getEntryForSlot(dayIndex, period);
                      return (
                        <td
                          key={dayIndex}
                          className="border border-gray-300 px-2 py-2"
                        >
                          {entry ? (
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
                                  onClick={() => handleDeleteEntry(entry._id!)}
                                  className="h-6 px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
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
