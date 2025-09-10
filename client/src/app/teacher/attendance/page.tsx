"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  UserCheck,
  UserX,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Save,
  RotateCcw,
  Users,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { useTeacherClassroomsQuery } from "../../../hooks/useTeacherClassroomsQuery";
import {
  useMarkAttendance,
  useUpdateAttendance,
  useGetClassAttendance,
} from "../../../hooks/useAttendance";
import { useToast } from "../../../components/ui/use-toast";

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState<{
    [studentId: string]: "present" | "absent" | "late";
  }>({});

  // Enhanced state for better UX
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [bulkOperationLoading, setBulkOperationLoading] = useState<
    string | null
  >(null);

  const { toast } = useToast();
  const { data: classrooms, isLoading: classroomsLoading } =
    useTeacherClassroomsQuery();
  const { data: existingAttendance, isLoading: attendanceLoading } =
    useGetClassAttendance(selectedClass, selectedDate);
  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();

  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we've already marked as having unsaved changes to prevent infinite loops
  const hasUnsavedChangesRef = useRef(false);
  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  // Get selected classroom data - use useMemo to prevent unnecessary recalculations
  const selectedClassroom = useMemo(() => {
    return classrooms?.find((c) => c._id === selectedClass);
  }, [classrooms, selectedClass]);

  // Initialize attendance data when existing attendance loads
  useEffect(() => {
    if (existingAttendance?.records) {
      const attendanceMap: {
        [studentId: string]: "present" | "absent" | "late";
      } = {};
      existingAttendance.records.forEach((record: any) => {
        attendanceMap[record.studentId._id] = record.status;
      });
      setAttendanceData(attendanceMap);
      // Reset unsaved changes flag when loading existing data
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
    } else if (selectedClassroom?.students) {
      // Initialize with unmarked status for all students
      const attendanceMap: {
        [studentId: string]: "present" | "absent" | "late";
      } = {};
      selectedClassroom.students.forEach((student) => {
        attendanceMap[student._id] = "present"; // Default to present
      });
      setAttendanceData(attendanceMap);
      // Reset unsaved changes flag when initializing new data
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
    }
  }, [existingAttendance, selectedClassroom]);

  // Track unsaved changes - improved logic to prevent false positives
  useEffect(() => {
    // Skip if no classroom is selected or no data exists
    if (!selectedClassroom || Object.keys(attendanceData).length === 0) {
      return;
    }

    // Check if this is a meaningful change (not just initialization)
    const hasExistingData =
      existingAttendance?.records && existingAttendance.records.length > 0;
    const isInitialized = selectedClassroom.students.every(
      (student) => attendanceData[student._id] !== undefined
    );

    // Only mark as unsaved if we have initialized data and it's different from existing
    if (isInitialized && !hasUnsavedChangesRef.current) {
      // For existing attendance, check if data has actually changed
      if (hasExistingData && existingAttendance?.records) {
        const hasChanges = existingAttendance.records.some((record: any) => {
          const currentStatus = attendanceData[record.studentId._id];
          return currentStatus && currentStatus !== record.status;
        });

        if (hasChanges) {
          hasUnsavedChangesRef.current = true;
          setHasUnsavedChanges(true);
        }
      } else {
        // For new attendance, any data means unsaved changes
        hasUnsavedChangesRef.current = true;
        setHasUnsavedChanges(true);
      }
    }
  }, [attendanceData, selectedClassroom, existingAttendance]);

  // Auto-save effect - separate from change tracking
  useEffect(() => {
    // Reset auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Only set up auto-save if we have data and a selected class
    if (selectedClass && Object.keys(attendanceData).length > 0) {
      autoSaveTimerRef.current = setTimeout(() => {
        // Check if component is still mounted before saving
        if (isMountedRef.current) {
          try {
            const draftKey = `attendance-draft-${selectedClass}-${selectedDate}`;
            localStorage.setItem(draftKey, JSON.stringify(attendanceData));
            console.log("Auto-saved draft:", draftKey);
          } catch (error) {
            console.error("Error auto-saving draft:", error);
          }
        }
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [attendanceData, selectedClass, selectedDate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Load draft on component mount - only when no existing attendance and class/date are selected
  useEffect(() => {
    if (
      selectedClass &&
      selectedDate &&
      !existingAttendance &&
      !attendanceLoading
    ) {
      const draftKey = `attendance-draft-${selectedClass}-${selectedDate}`;
      try {
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          const draftData = JSON.parse(draft);
          // Validate draft data structure
          if (typeof draftData === "object" && draftData !== null) {
            setAttendanceData(draftData);
            toast({
              title: "Draft Loaded",
              description: "Previous unsaved changes have been restored",
            });
          }
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        // Remove corrupted draft
        localStorage.removeItem(draftKey);
      }
    }
  }, [
    selectedClass,
    selectedDate,
    existingAttendance,
    attendanceLoading,
    toast,
  ]);

  const handleAttendanceChange = useCallback(
    (studentId: string, status: "present" | "absent" | "late") => {
      setAttendanceData((prev) => ({
        ...prev,
        [studentId]: status,
      }));
    },
    []
  );

  // Bulk operations
  const markAllPresent = useCallback(async () => {
    if (!selectedClassroom) return;

    setBulkOperationLoading("present");
    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 100));

      const newData: { [studentId: string]: "present" | "absent" | "late" } =
        {};
      selectedClassroom.students.forEach((student) => {
        newData[student._id] = "present";
      });
      setAttendanceData(newData);
      toast({
        title: "All Marked Present",
        description: "All students have been marked as present",
      });
    } catch (error) {
      console.error("Error marking all present:", error);
      toast({
        title: "Error",
        description: "Failed to mark all students as present",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(null);
    }
  }, [selectedClassroom, toast]);

  const markAllAbsent = useCallback(async () => {
    if (!selectedClassroom) return;

    setBulkOperationLoading("absent");
    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 100));

      const newData: { [studentId: string]: "present" | "absent" | "late" } =
        {};
      selectedClassroom.students.forEach((student) => {
        newData[student._id] = "absent";
      });
      setAttendanceData(newData);
      toast({
        title: "All Marked Absent",
        description: "All students have been marked as absent",
      });
    } catch (error) {
      console.error("Error marking all absent:", error);
      toast({
        title: "Error",
        description: "Failed to mark all students as absent",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(null);
    }
  }, [selectedClassroom, toast]);

  const resetAttendance = useCallback(async () => {
    if (!selectedClassroom) return;

    setBulkOperationLoading("reset");
    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 100));

      const newData: { [studentId: string]: "present" | "absent" | "late" } =
        {};
      selectedClassroom.students.forEach((student) => {
        newData[student._id] = "present"; // Default to present
      });
      setAttendanceData(newData);
      toast({
        title: "Attendance Reset",
        description: "All students reset to present",
      });
    } catch (error) {
      console.error("Error resetting attendance:", error);
      toast({
        title: "Error",
        description: "Failed to reset attendance",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(null);
    }
  }, [selectedClassroom, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "p":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            markAllPresent();
          }
          break;
        case "a":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            markAllAbsent();
          }
          break;
        case "r":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetAttendance();
          }
          break;
        case "s":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowSaveDialog(true);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [markAllPresent, markAllAbsent, resetAttendance]);

  const handleSaveAttendance = async () => {
    if (!selectedClassroom) return;

    setIsSaving(true);
    try {
      const records = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      );

      if (existingAttendance?._id) {
        // Update existing attendance
        await updateAttendance.mutateAsync({
          attendanceId: existingAttendance._id,
          records,
        });
      } else {
        // Create new attendance
        await markAttendance.mutateAsync({
          classroomId: selectedClass,
          date: selectedDate,
          records,
        });
      }

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    } catch (error: any) {
      console.error("Save attendance error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <UserX className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      default:
        return <Badge variant="secondary">Not Marked</Badge>;
    }
  };

  const attendanceStats = {
    total: selectedClassroom?.students.length || 0,
    present: Object.values(attendanceData).filter(
      (status) => status === "present"
    ).length,
    late: Object.values(attendanceData).filter((status) => status === "late")
      .length,
    absent: Object.values(attendanceData).filter(
      (status) => status === "absent"
    ).length,
    unmarked:
      (selectedClassroom?.students.length || 0) -
      Object.keys(attendanceData).length,
  };

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Attendance Management
              </h1>
              <p className="text-muted-foreground">
                Mark and manage student attendance for your classes.
              </p>
            </div>
          </div>

          {/* Class and Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Class and Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Choose a class...</option>
                    {classrooms?.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedClass && (
            <>
              {/* Attendance Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Students
                        </p>
                        <p className="text-2xl font-bold">
                          {attendanceStats.total}
                        </p>
                      </div>
                      <UserCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Present
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {attendanceStats.present}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Late
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {attendanceStats.late}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Absent
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {attendanceStats.absent}
                        </p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bulk Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bulk Actions</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">
                        Ctrl+P
                      </kbd>
                      <span>Mark All Present</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs ml-4">
                        Ctrl+A
                      </kbd>
                      <span>Mark All Absent</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs ml-4">
                        Ctrl+R
                      </kbd>
                      <span>Reset</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={markAllPresent}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={bulkOperationLoading === "present"}
                    >
                      {bulkOperationLoading === "present" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {bulkOperationLoading === "present"
                        ? "Marking..."
                        : "Mark All Present"}
                    </Button>
                    <Button
                      onClick={markAllAbsent}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={bulkOperationLoading === "absent"}
                    >
                      {bulkOperationLoading === "absent" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {bulkOperationLoading === "absent"
                        ? "Marking..."
                        : "Mark All Absent"}
                    </Button>
                    <Button
                      onClick={resetAttendance}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={bulkOperationLoading === "reset"}
                    >
                      {bulkOperationLoading === "reset" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {bulkOperationLoading === "reset"
                        ? "Resetting..."
                        : "Reset to Present"}
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Unsaved changes</span>
                        </div>
                      )}
                      {lastSaved && (
                        <div className="text-sm text-muted-foreground">
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                      )}
                      <Button
                        onClick={() => setShowSaveDialog(true)}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSaving ? "Saving..." : "Save Attendance"}
                        <kbd className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                          Ctrl+S
                        </kbd>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mark Attendance</span>
                    {attendanceLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading attendance data...
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Student
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Student ID
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Time Marked
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClassroom?.students.map((student) => (
                          <tr
                            key={student._id}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle font-medium">
                              {student.fullName}
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                              {student.studentId}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(
                                  attendanceData[student._id] || null
                                )}
                                {getStatusBadge(
                                  attendanceData[student._id] || null
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                              {existingAttendance
                                ? new Date(
                                    existingAttendance.updatedAt ||
                                      existingAttendance.createdAt
                                  ).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={
                                    attendanceData[student._id] === "present"
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    handleAttendanceChange(
                                      student._id,
                                      "present"
                                    )
                                  }
                                  className="text-xs"
                                >
                                  P
                                </Button>
                                <Button
                                  size="sm"
                                  variant={
                                    attendanceData[student._id] === "late"
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    handleAttendanceChange(student._id, "late")
                                  }
                                  className="text-xs"
                                >
                                  L
                                </Button>
                                <Button
                                  size="sm"
                                  variant={
                                    attendanceData[student._id] === "absent"
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    handleAttendanceChange(
                                      student._id,
                                      "absent"
                                    )
                                  }
                                  className="text-xs"
                                >
                                  A
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Save Confirmation Dialog */}
              <ConfirmDialog
                isOpen={showSaveDialog}
                onCancel={() => setShowSaveDialog(false)}
                onConfirm={async () => {
                  setShowSaveDialog(false);
                  await handleSaveAttendance();
                  setLastSaved(new Date());
                  setHasUnsavedChanges(false);
                  // Reset the ref to allow new change tracking
                  hasUnsavedChangesRef.current = false;
                  // Clear draft after successful save
                  const draftKey = `attendance-draft-${selectedClass}-${selectedDate}`;
                  localStorage.removeItem(draftKey);
                }}
                title="Save Attendance"
                message={`Are you sure you want to save attendance for ${
                  selectedClassroom?.name
                } on ${new Date(
                  selectedDate
                ).toLocaleDateString()}? This will ${
                  existingAttendance ? "update" : "create"
                } the attendance record.`}
                confirmText={
                  existingAttendance ? "Update Attendance" : "Save Attendance"
                }
              />
            </>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
