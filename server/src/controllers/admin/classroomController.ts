import { Request, Response } from "express";
import { Classroom, ALLOWED_CLASSROOMS } from "../../models/Classroom";
import { User } from "../../models/User";
import { Student } from "../../models/Student";
import { AuditLog } from "../../models/AuditLog";
import { Term } from "../../models/Term";
import { Attendance } from "../../models/Attendance";

// @desc    Create a new classroom
// @route   POST /api/admin/classrooms
// @access  Private/Admin
export const createClassroom = async (req: Request, res: Response) => {
  try {
    const { name, teacherId, timetable } = req.body;

    //  Step 1: Validate classroom name
    if (!ALLOWED_CLASSROOMS.includes(name)) {
      return res.status(400).json({
        message: `Invalid class name. Allowed: ${ALLOWED_CLASSROOMS.join(
          ", "
        )}`,
      });
    }

    //  Check if classroom name already exists
    const existingClassroom = await Classroom.findOne({ name });
    if (existingClassroom) {
      return res
        .status(400)
        .json({ message: `Classroom "${name}" already exists` });
    }

    // Check if teacher exists and is actually a teacher
    const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "Teacher not found or invalid role" });
    }

    const classroom = await Classroom.create({
      name,
      teacherId,
      timetable: timetable || [],
      students: [],
    });

    // Update teacher's assigned class
    await User.findByIdAndUpdate(teacherId, { assignedClassId: classroom._id });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "CLASSROOM_CREATE",
      description: `Created new classroom ${name} with teacher ${teacher.name}`,
      targetId: classroom._id,
    });

    res.status(201).json(classroom);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Classroom name already exists (duplicate)" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
    console.log(error.message);
  }
};

// @desc    Assign students to classroom (complete replacement)
// @route   POST /api/admin/classrooms/:id/students
// @access  Private/Admin
export const assignStudents = async (req: Request, res: Response) => {
  try {
    const { studentIds } = req.body;
    const classroomId: string = req.params.id;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Verify all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more students not found" });
    }

    // Check if any students are already assigned to other classrooms
    const studentsWithOtherAssignments = await Student.find({
      _id: { $in: studentIds },
      $and: [
        { classroomId: { $exists: true } },
        { classroomId: { $ne: null } },
        { classroomId: { $ne: classroomId } },
      ],
    });

    if (studentsWithOtherAssignments.length > 0) {
      const studentNames = studentsWithOtherAssignments
        .map((s) => s.fullName)
        .join(", ");
      return res.status(400).json({
        message: `Students already assigned to other classrooms: ${studentNames}. Please remove them from their current classrooms first.`,
      });
    }

    // Get previously assigned students for audit log
    const previousStudentIds = classroom.students.map((id) => id.toString());

    // Update classroom students
    classroom.students = studentIds;
    await classroom.save();

    // Update each student's current class and classroomId
    await Student.updateMany(
      { _id: { $in: studentIds } },
      {
        currentClass: classroom.name,
        classroomId: classroomId,
      }
    );

    // Clear currentClass and classroomId for students no longer in this classroom
    const removedStudentIds = previousStudentIds.filter(
      (id) => !studentIds.includes(id)
    );
    if (removedStudentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: removedStudentIds } },
        {
          currentClass: "",
          classroomId: null,
        }
      );
    }

    // Create audit log
    const addedCount = studentIds.filter(
      (id: string) => !previousStudentIds.includes(id)
    ).length;
    const removedCount = removedStudentIds.length;

    let description = `Updated classroom ${classroom.name} student assignments`;
    if (addedCount > 0) description += ` - Added ${addedCount} students`;
    if (removedCount > 0) description += ` - Removed ${removedCount} students`;

    await AuditLog.create({
      userId: req.user?._id,
      actionType: "STUDENTS_ASSIGN",
      description,
      targetId: classroom._id,
    });

    res.json(classroom);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add students to classroom (individual add operation)
// @route   POST /api/admin/classrooms/:id/students/add
// @access  Private/Admin
export const addStudentsToClassroom = async (req: Request, res: Response) => {
  try {
    const { studentIds } = req.body;
    const classroomId: string = req.params.id;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Verify all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more students not found" });
    }

    // Check if any students are already assigned to other classrooms
    const studentsWithOtherAssignments = await Student.find({
      _id: { $in: studentIds },
      $and: [
        { classroomId: { $exists: true } },
        { classroomId: { $ne: null } },
        { classroomId: { $ne: classroomId } },
      ],
    });

    if (studentsWithOtherAssignments.length > 0) {
      const studentNames = studentsWithOtherAssignments
        .map((s) => s.fullName)
        .join(", ");
      return res.status(400).json({
        message: `Students already assigned to other classrooms: ${studentNames}. Please remove them from their current classrooms first.`,
      });
    }

    // Filter out students who are already in this classroom
    const currentStudentIds = classroom.students.map((id) => id.toString());
    const newStudentIds = studentIds.filter(
      (id: string) => !currentStudentIds.includes(id)
    );

    if (newStudentIds.length === 0) {
      return res.status(400).json({
        message: "All selected students are already in this classroom",
      });
    }

    // Add new students to classroom
    classroom.students = [...classroom.students, ...newStudentIds];
    await classroom.save();

    // Update each new student's current class and classroomId
    await Student.updateMany(
      { _id: { $in: newStudentIds } },
      {
        currentClass: classroom.name,
        classroomId: classroomId,
      }
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "STUDENTS_ADDED_TO_CLASSROOM",
      description: `Added ${newStudentIds.length} students to classroom ${classroom.name}`,
      targetId: classroom._id,
    });

    res.json({
      message: `${newStudentIds.length} students added to classroom successfully`,
      classroom,
      addedStudents: newStudentIds.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove students from classroom (bulk remove operation)
// @route   POST /api/admin/classrooms/:id/students/remove
// @access  Private/Admin
export const removeStudentsFromClassroom = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentIds } = req.body;
    const classroomId: string = req.params.id;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if students exist and are in this classroom
    const currentStudentIds = classroom.students.map((id) => id.toString());
    const validStudentIds = studentIds.filter((id: string) =>
      currentStudentIds.includes(id)
    );

    if (validStudentIds.length === 0) {
      return res.status(400).json({
        message: "None of the selected students are in this classroom",
      });
    }

    // Remove students from classroom
    classroom.students = classroom.students.filter(
      (id) => !validStudentIds.includes(id.toString())
    );
    await classroom.save();

    // Update students' current class and classroomId to empty
    await Student.updateMany(
      { _id: { $in: validStudentIds } },
      {
        currentClass: "",
        classroomId: null,
      }
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "STUDENTS_REMOVED_FROM_CLASSROOM",
      description: `Removed ${validStudentIds.length} students from classroom ${classroom.name}`,
      targetId: classroom._id,
    });

    res.json({
      message: `${validStudentIds.length} students removed from classroom successfully`,
      classroom,
      removedStudents: validStudentIds.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove student from classroom
// @route   DELETE /api/admin/classrooms/:classroomId/students/:studentId
// @access  Private/Admin
export const removeStudentFromClassroom = async (
  req: Request,
  res: Response
) => {
  try {
    const classroomId: string = req.params.classroomId;
    const studentId: string = req.params.studentId;

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student is actually in this classroom
    if (!classroom.students.includes(studentId as any)) {
      return res
        .status(400)
        .json({ message: "Student is not in this classroom" });
    }

    // Remove student from classroom
    classroom.students = classroom.students.filter(
      (id) => id.toString() !== studentId
    );
    await classroom.save();

    // Update student's current class and classroomId to empty
    await Student.findByIdAndUpdate(studentId, {
      currentClass: "",
      classroomId: null,
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "STUDENT_REMOVED_FROM_CLASSROOM",
      description: `Removed student ${student.fullName} from classroom ${classroom.name}`,
      targetId: classroom._id,
    });

    res.json({
      message: "Student removed from classroom successfully",
      classroom,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get students for a specific classroom
// @route   GET /api/admin/classrooms/:id/students
// @access  Private/Admin
export const getClassroomStudents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if classroom exists
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Get students for this classroom
    const students = await Student.find({ _id: { $in: classroom.students } })
      .select("fullName studentId currentClass status createdAt")
      .sort({ fullName: 1 });

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
      },
      students,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all classrooms with teacher and student details
// @route   GET /api/admin/classrooms
// @access  Private/Admin
export const getClassrooms = async (req: Request, res: Response) => {
  try {
    const classrooms = await Classroom.find()
      .populate("teacherId", "name email")
      .populate("students", "fullName studentId");
    res.json(classrooms);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get school days count for a classroom
// @route   GET /api/admin/classrooms/:id/school-days
// @access  Private/Admin/Teacher
export const getSchoolDays = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if classroom exists
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      !["admin", "superadmin"].includes(req.user.role) &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view classroom data",
      });
    }

    // Get current active term
    const currentTerm = await Term.findOne({ isActive: true });
    if (!currentTerm) {
      return res.status(404).json({ message: "No active term found" });
    }

    // Calculate working days (Monday to Friday)
    const startDate = new Date(currentTerm.startDate);
    const endDate = new Date(currentTerm.endDate);
    let schoolDays = 0;

    // Count weekdays excluding holidays
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Count weekdays (Monday = 1, Friday = 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Check if this date falls within any holiday
        const isHoliday = currentTerm.holidays.some((holiday) => {
          const holidayStart = new Date(holiday.startDate);
          const holidayEnd = new Date(holiday.endDate);
          return date >= holidayStart && date <= holidayEnd;
        });

        if (!isHoliday) {
          schoolDays++;
        }
      }
    }

    res.json({
      classroomId: id,
      term: {
        name: currentTerm.name,
        year: currentTerm.year,
        startDate: currentTerm.startDate,
        endDate: currentTerm.endDate,
      },
      schoolDays,
      totalTermDays: Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    });
  } catch (error: any) {
    console.error("Error calculating school days:", error);
    res.status(500).json({
      message: "Failed to calculate school days",
      error: error.message,
    });
  }
};

// @desc    Get attendance comparison for a classroom
// @route   GET /api/admin/classrooms/:id/attendance-comparison
// @access  Private/Admin/Teacher
export const getAttendanceComparison = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if classroom exists
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      !["admin", "superadmin"].includes(req.user.role) &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view classroom data",
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate current month date range
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59
    );

    // Calculate previous month date range
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthStart = new Date(prevYear, prevMonth, 1);
    const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59);

    // Get attendance records for both months
    const [currentMonthAttendance, prevMonthAttendance] = await Promise.all([
      Attendance.find({
        classroomId: id,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      }),
      Attendance.find({
        classroomId: id,
        date: { $gte: prevMonthStart, $lte: prevMonthEnd },
      }),
    ]);

    // Calculate attendance rates
    const calculateAttendanceRate = (records: any[]) => {
      if (records.length === 0) return 0;

      let totalPresent = 0;
      let totalStudents = 0;

      records.forEach((record) => {
        totalStudents += record.records.length;
        totalPresent += record.records.filter(
          (r: any) => r.status === "present" || r.status === "late"
        ).length;
      });

      return totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
    };

    const currentRate = calculateAttendanceRate(currentMonthAttendance);
    const previousRate = calculateAttendanceRate(prevMonthAttendance);
    const change = currentRate - previousRate;

    res.json({
      classroomId: id,
      currentMonth: {
        month: currentMonth + 1,
        year: currentYear,
        attendanceRate: Math.round(currentRate * 100) / 100,
        totalDays: currentMonthAttendance.length,
      },
      previousMonth: {
        month: prevMonth + 1,
        year: prevYear,
        attendanceRate: Math.round(previousRate * 100) / 100,
        totalDays: prevMonthAttendance.length,
      },
      comparison: {
        change: Math.round(change * 100) / 100,
        changePercent:
          previousRate > 0
            ? Math.round((change / previousRate) * 100 * 100) / 100
            : 0,
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
      },
    });
  } catch (error: any) {
    console.error("Error calculating attendance comparison:", error);
    res.status(500).json({
      message: "Failed to calculate attendance comparison",
      error: error.message,
    });
  }
};

// @desc    Get recent activity for a classroom
// @route   GET /api/admin/classrooms/:id/recent-activity
// @access  Private/Admin/Teacher
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if classroom exists
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check permissions
    if (
      !["admin", "superadmin"].includes(req.user.role) &&
      classroom.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view classroom data",
      });
    }

    // Get recent audit logs for this classroom
    const recentActivity = await AuditLog.find({
      targetId: id,
    })
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .select("actionType description timestamp userId");

    // Transform the data for frontend consumption
    const activities = recentActivity.map((log) => ({
      id: log._id,
      type: log.actionType,
      description: log.description,
      timestamp: log.timestamp,
      user: log.userId
        ? {
            name: (log.userId as any).name,
            email: (log.userId as any).email,
          }
        : null,
    }));

    res.json({
      classroomId: id,
      activities,
      total: activities.length,
    });
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      message: "Failed to fetch recent activity",
      error: error.message,
    });
  }
};
