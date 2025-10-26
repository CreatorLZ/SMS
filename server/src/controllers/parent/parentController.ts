import { Request, Response } from "express";
import { User } from "../../models/User";
import { Student } from "../../models/Student";
import { Attendance } from "../../models/Attendance";
import { Term } from "../../models/Term";

// Helper function to check if parent is authorized for student
const checkParentAuthorization = async (
  parentId: string,
  studentId: string
): Promise<boolean> => {
  const parent = await User.findById(parentId).select("linkedStudentIds");
  if (!parent || !parent.linkedStudentIds) return false;
  return parent.linkedStudentIds.some((id) => id.toString() === studentId);
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user._id;

    // Fetch parent user with linked student IDs
    const parent = await User.findById(userId).select(
      "name email linkedStudentIds"
    );

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
      return res.json({
        parent: {
          name: parent.name,
          email: parent.email,
        },
        linkedStudents: [],
        notifications: [],
        upcomingEvents: [],
      });
    }

    // Fetch linked students with relevant information
    const linkedStudents = await Student.find({
      _id: { $in: parent.linkedStudentIds },
    })
      .select(
        "studentId fullName currentClass status parentName parentPhone relationshipToStudent classroomId results"
      )
      .populate("classroomId", "name");

    // Calculate GPA and attendance for each student
    const studentsWithStats = await Promise.all(
      linkedStudents.map(async (student) => {
        // Calculate GPA from results
        let gpa = 0;
        if (student.results && student.results.length > 0) {
          const totalScore = student.results.reduce((sum, result) => {
            const subjectAverage =
              result.scores.reduce((subjectSum, score) => {
                return subjectSum + score.totalScore;
              }, 0) / result.scores.length;
            return sum + subjectAverage;
          }, 0);
          gpa = totalScore / student.results.length;
        }

        // Calculate attendance percentage
        let attendance = 0;
        if (student.classroomId) {
          const activeTerm = await Term.findOne({ isActive: true });
          if (activeTerm) {
            const termStart = activeTerm.startDate;
            const termEnd = activeTerm.endDate;

            // Count total school days in the term (excluding weekends and holidays)
            const totalDays = Math.ceil(
              (termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24)
            );
            const weekends = Math.floor(totalDays / 7) * 2;
            const holidays = activeTerm.holidays.reduce((sum, holiday) => {
              return (
                sum +
                Math.ceil(
                  (holiday.endDate.getTime() - holiday.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );
            }, 0);
            const schoolDays = totalDays - weekends - holidays;

            // Count present days for this student
            const attendanceRecords = await Attendance.find({
              classroomId: student.classroomId,
              date: { $gte: termStart, $lte: termEnd },
              "records.studentId": student._id,
            });

            let presentDays = 0;
            attendanceRecords.forEach((record) => {
              const studentRecord = record.records.find(
                (r) =>
                  r.studentId.toString() === (student._id as any).toString()
              );
              if (
                studentRecord &&
                (studentRecord.status === "present" ||
                  studentRecord.status === "late")
              ) {
                presentDays++;
              }
            });

            attendance = schoolDays > 0 ? (presentDays / schoolDays) * 100 : 0;
          }
        }

        // Determine status based on GPA and attendance
        let status = "good";
        if (gpa >= 3.5 && attendance >= 90) {
          status = "excellent";
        } else if (gpa < 2.0 || attendance < 80) {
          status = "concerning";
        } else if (gpa < 2.5 || attendance < 85) {
          status = "needs_attention";
        }

        return {
          id: (student._id as any).toString(),
          name: student.fullName,
          grade: student.currentClass,
          gpa: Math.round(gpa * 10) / 10,
          attendance: Math.round(attendance),
          status,
        };
      })
    );

    // Generate mock notifications and events (in a real app, these would come from separate models)
    const notifications = [
      {
        id: "1",
        type: "grade",
        child: studentsWithStats[0]?.name || "Your Child",
        message: "New grade posted in Mathematics",
        date: new Date().toISOString().split("T")[0],
        priority: "normal",
      },
      {
        id: "2",
        type: "attendance",
        child: studentsWithStats[0]?.name || "Your Child",
        message: "Attendance below 90% this week",
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        priority: "warning",
      },
    ];

    const upcomingEvents = [
      {
        title: "Parent-Teacher Conference",
        child:
          studentsWithStats.length > 1
            ? "All Children"
            : studentsWithStats[0]?.name || "Your Child",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        time: "14:00",
        type: "meeting",
      },
      {
        title: "Report Card Distribution",
        child:
          studentsWithStats.length > 1
            ? "All Children"
            : studentsWithStats[0]?.name || "Your Child",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        time: "16:00",
        type: "academic",
      },
    ];

    res.json({
      parent: {
        name: parent.name,
        email: parent.email,
      },
      linkedStudents: studentsWithStats,
      notifications,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Error fetching parent dashboard:", error);
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get child grades
export const getChildGrades = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { studentId } = req.params;
    const parentId = req.user._id;

    // Check authorization
    const isAuthorized = await checkParentAuthorization(parentId, studentId);
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this student's data" });
    }

    // Fetch student with results
    const student = await Student.findById(studentId)
      .select("fullName currentClass results")
      .populate("results.updatedBy", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Format grades data
    const grades = student.results.map((result) => ({
      term: result.term,
      year: result.year,
      subjects: result.scores.map((score) => ({
        subject: score.subject,
        ca1: score.assessments.ca1,
        ca2: score.assessments.ca2,
        exam: score.assessments.exam,
        totalScore: score.totalScore,
        grade:
          score.totalScore >= 70
            ? "A"
            : score.totalScore >= 60
            ? "B"
            : score.totalScore >= 50
            ? "C"
            : score.totalScore >= 40
            ? "D"
            : "F",
      })),
      comment: result.comment,
      updatedBy: result.updatedBy,
      updatedAt: result.updatedAt,
    }));

    res.json({
      student: {
        id: student._id,
        name: student.fullName,
        currentClass: student.currentClass,
      },
      grades,
    });
  } catch (error) {
    console.error("Error fetching child grades:", error);
    res.status(500).json({
      message: "Error fetching grades data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get child attendance
export const getChildAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { studentId } = req.params;
    const parentId = req.user._id;
    const { term, year, page = 1, limit = 20 } = req.query;

    // Check authorization
    const isAuthorized = await checkParentAuthorization(parentId, studentId);
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this student's data" });
    }

    // Fetch student
    const student = await Student.findById(studentId).select(
      "fullName currentClass classroomId"
    );
    if (!student || !student.classroomId) {
      return res
        .status(404)
        .json({ message: "Student not found or not assigned to a classroom" });
    }

    // Get term dates if term and year provided
    let dateFilter = {};
    if (term && year) {
      const activeTerm = await Term.findOne({
        name: term,
        year: parseInt(year as string),
        isActive: true,
      });
      if (activeTerm) {
        dateFilter = {
          date: { $gte: activeTerm.startDate, $lte: activeTerm.endDate },
        };
      }
    }

    // Validate and parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ message: "Invalid page parameter" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res
        .status(400)
        .json({ message: "Invalid limit parameter (1-100)" });
    }

    const skip = (pageNum - 1) * limitNum;

    // Fetch attendance records with pagination
    const attendanceRecords = await Attendance.find({
      classroomId: student.classroomId,
      ...dateFilter,
      "records.studentId": studentId,
    })
      .select("date records")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments({
      classroomId: student.classroomId,
      ...dateFilter,
      "records.studentId": studentId,
    });

    // Calculate attendance statistics (from all records, not just paginated)
    const allAttendanceRecords = await Attendance.find({
      classroomId: student.classroomId,
      ...dateFilter,
      "records.studentId": studentId,
    }).select("records");

    let totalDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    allAttendanceRecords.forEach((record) => {
      const studentRecord = record.records.find(
        (r) => r.studentId.toString() === studentId
      );
      if (studentRecord) {
        totalDays++;
        if (studentRecord.status === "present") presentDays++;
        else if (studentRecord.status === "absent") absentDays++;
        else if (studentRecord.status === "late") lateDays++;
      }
    });

    const attendanceDetails = attendanceRecords.map((record) => {
      const studentRecord = record.records?.find(
        (r) => r.studentId.toString() === studentId
      );

      return {
        date: record.date,
        status: studentRecord?.status || "not_recorded",
      };
    });

    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      student: {
        id: student._id,
        name: student.fullName,
        currentClass: student.currentClass,
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        percentage: attendancePercentage,
        details: attendanceDetails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalRecords,
          pages: Math.ceil(totalRecords / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching child attendance:", error);
    res.status(500).json({
      message: "Error fetching attendance data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get child results
export const getChildResults = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { studentId } = req.params;
    const parentId = req.user._id;

    // Check authorization
    const isAuthorized = await checkParentAuthorization(parentId, studentId);
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this student's data" });
    }

    // Fetch student with results
    const student = await Student.findById(studentId)
      .select("fullName currentClass results")
      .populate("results.updatedBy", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Format results data
    const results = student.results.map((result) => ({
      term: result.term,
      year: result.year,
      subjects: result.scores.map((score) => ({
        subject: score.subject,
        assessments: score.assessments,
        totalScore: score.totalScore,
        grade:
          score.totalScore >= 70
            ? "A"
            : score.totalScore >= 60
            ? "B"
            : score.totalScore >= 50
            ? "C"
            : score.totalScore >= 40
            ? "D"
            : "F",
      })),
      overallAverage:
        result.scores.reduce((sum, score) => sum + score.totalScore, 0) /
        result.scores.length,
      comment: result.comment,
      updatedBy: result.updatedBy,
      updatedAt: result.updatedAt,
    }));

    res.json({
      student: {
        id: student._id,
        name: student.fullName,
        currentClass: student.currentClass,
      },
      results,
    });
  } catch (error) {
    console.error("Error fetching child results:", error);
    res.status(500).json({
      message: "Error fetching results data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get children overview
export const getChildrenOverview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user._id;

    // Fetch parent user with linked student IDs
    const parent = await User.findById(userId).select(
      "name email linkedStudentIds"
    );

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
      return res.json({
        parent: {
          name: parent.name,
          email: parent.email,
        },
        children: [],
        summary: {
          totalChildren: 0,
          averageGPA: 0,
          averageAttendance: 0,
        },
      });
    }

    // Fetch linked students with relevant information
    const linkedStudents = await Student.find({
      _id: { $in: parent.linkedStudentIds },
    })
      .select(
        "studentId fullName currentClass status parentName parentPhone relationshipToStudent classroomId results"
      )
      .populate("classroomId", "name");

    // Calculate GPA and attendance for each student (same logic as dashboard)
    const childrenWithStats = await Promise.all(
      linkedStudents.map(async (student) => {
        // Calculate GPA from results
        let gpa = 0;
        if (student.results && student.results.length > 0) {
          const totalScore = student.results.reduce((sum, result) => {
            const subjectAverage =
              result.scores.reduce((subjectSum, score) => {
                return subjectSum + score.totalScore;
              }, 0) / result.scores.length;
            return sum + subjectAverage;
          }, 0);
          gpa = totalScore / student.results.length;
        }

        // Calculate attendance percentage (same logic as dashboard)
        let attendance = 0;
        if (student.classroomId) {
          const activeTerm = await Term.findOne({ isActive: true });
          if (activeTerm) {
            const termStart = activeTerm.startDate;
            const termEnd = activeTerm.endDate;

            const totalDays = Math.ceil(
              (termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24)
            );
            const weekends = Math.floor(totalDays / 7) * 2;
            const holidays = activeTerm.holidays.reduce((sum, holiday) => {
              return (
                sum +
                Math.ceil(
                  (holiday.endDate.getTime() - holiday.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );
            }, 0);
            const schoolDays = totalDays - weekends - holidays;

            // Count present days for this student
            const attendanceRecords = await Attendance.find({
              classroomId: student.classroomId,
              date: { $gte: termStart, $lte: termEnd },
              "records.studentId": student._id,
            });

            let presentDays = 0;
            attendanceRecords.forEach((record) => {
              const studentRecord = record.records.find(
                (r) =>
                  r.studentId.toString() === (student._id as any).toString()
              );
              if (
                studentRecord &&
                (studentRecord.status === "present" ||
                  studentRecord.status === "late")
              ) {
                presentDays++;
              }
            });

            attendance = schoolDays > 0 ? (presentDays / schoolDays) * 100 : 0;
          }
        }

        // Determine status based on GPA and attendance
        let status = "good";
        if (gpa >= 3.5 && attendance >= 90) {
          status = "excellent";
        } else if (gpa < 2.0 || attendance < 80) {
          status = "concerning";
        } else if (gpa < 2.5 || attendance < 85) {
          status = "needs_attention";
        }

        return {
          id: (student._id as any).toString(),
          name: student.fullName,
          grade: student.currentClass,
          gpa: Math.round(gpa * 10) / 10,
          attendance: Math.round(attendance),
          status,
        };
      })
    );

    // Calculate summary statistics
    const summary = {
      totalChildren: childrenWithStats.length,
      averageGPA:
        childrenWithStats.length > 0
          ? Math.round(
              (childrenWithStats.reduce((sum, child) => sum + child.gpa, 0) /
                childrenWithStats.length) *
                10
            ) / 10
          : 0,
      averageAttendance:
        childrenWithStats.length > 0
          ? Math.round(
              childrenWithStats.reduce(
                (sum, child) => sum + child.attendance,
                0
              ) / childrenWithStats.length
            )
          : 0,
    };

    res.json({
      parent: {
        name: parent.name,
        email: parent.email,
      },
      children: childrenWithStats,
      summary,
    });
  } catch (error) {
    console.error("Error fetching children overview:", error);
    res.status(500).json({
      message: "Error fetching children overview data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get progress reports
export const getProgressReports = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user._id;
    const { child: selectedChildId } = req.query;

    // Fetch parent user with linked student IDs
    const parent = await User.findById(userId).select(
      "name email linkedStudentIds"
    );

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
      return res.json({
        parent: {
          name: parent.name,
          email: parent.email,
        },
        children: [],
        selectedChild: null,
        progressData: null,
      });
    }

    // Fetch linked students with relevant information
    const linkedStudents = await Student.find({
      _id: { $in: parent.linkedStudentIds },
    }).select("studentId fullName currentClass status results");

    // Calculate progress data for each child
    const childrenProgress = await Promise.all(
      linkedStudents.map(async (student) => {
        // Calculate GPA from results
        let gpa = 0;
        let trend = "stable";
        if (student.results && student.results.length > 0) {
          const totalScore = student.results.reduce((sum, result) => {
            const subjectAverage =
              result.scores.reduce((subjectSum, score) => {
                return subjectSum + score.totalScore;
              }, 0) / result.scores.length;
            return sum + subjectAverage;
          }, 0);
          gpa = totalScore / student.results.length;

          // Simple trend calculation (in a real app, this would compare with previous terms)
          trend = Math.random() > 0.5 ? "up" : "stable";
        }

        return {
          id: (student._id as any).toString(),
          name: student.fullName,
          grade: student.currentClass,
          gpa: Math.round(gpa * 10) / 10,
          trend,
          subjects: [
            { subject: "Mathematics", grade: "A", trend: "up" },
            { subject: "English", grade: "B+", trend: "stable" },
            { subject: "Science", grade: "A-", trend: "up" },
          ],
        };
      })
    );

    let selectedChild = null;
    let progressData = null;

    if (selectedChildId) {
      const child = childrenProgress.find((c) => c.id === selectedChildId);
      if (child) {
        selectedChild = child;
        progressData = {
          performanceTrends: {
            gpa: {
              current: child.gpa,
              previous: child.gpa - 0.1,
              trend: child.trend,
            },
            attendance: { current: 95, previous: 93, trend: "up" },
            subjects: child.subjects,
          },
          achievements: [
            {
              title: "Mathematics Excellence",
              description: "Scored 95% in recent mathematics assessment",
              date: new Date().toISOString(),
            },
            {
              title: "Perfect Attendance",
              description: "Maintained 100% attendance for the month",
              date: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ],
        };
      }
    }

    res.json({
      parent: {
        name: parent.name,
        email: parent.email,
      },
      children: childrenProgress,
      selectedChild,
      progressData,
    });
  } catch (error) {
    console.error("Error fetching progress reports:", error);
    res.status(500).json({
      message: "Error fetching progress reports data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get family attendance
export const getFamilyAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user._id;

    // Fetch parent user with linked student IDs
    const parent = await User.findById(userId).select(
      "name email linkedStudentIds"
    );

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
      return res.json({
        parent: {
          name: parent.name,
          email: parent.email,
        },
        children: [],
        summary: {
          averageAttendance: 0,
          excellentCount: 0,
          goodCount: 0,
          needsAttentionCount: 0,
        },
      });
    }

    // Fetch linked students with classroom information
    const linkedStudents = await Student.find({
      _id: { $in: parent.linkedStudentIds },
    })
      .select("studentId fullName currentClass classroomId")
      .populate("classroomId", "name");

    // Calculate attendance for each student
    const childrenAttendance = await Promise.all(
      linkedStudents.map(async (student) => {
        let attendance = 0;
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let totalDays = 0;

        if (student.classroomId) {
          const activeTerm = await Term.findOne({ isActive: true });
          if (activeTerm) {
            const termStart = activeTerm.startDate;
            const termEnd = activeTerm.endDate;

            const totalDaysCalc = Math.ceil(
              (termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24)
            );
            const weekends = Math.floor(totalDaysCalc / 7) * 2;
            const holidays = activeTerm.holidays.reduce((sum, holiday) => {
              return (
                sum +
                Math.ceil(
                  (holiday.endDate.getTime() - holiday.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );
            }, 0);
            const schoolDays = totalDaysCalc - weekends - holidays;

            const attendanceRecords = await Attendance.find({
              classroomId: student.classroomId,
              date: { $gte: termStart, $lte: termEnd },
              "records.studentId": student._id,
            });

            attendanceRecords.forEach((record) => {
              const studentRecord = record.records.find(
                (r) =>
                  r.studentId.toString() === (student._id as any).toString()
              );
              if (studentRecord) {
                totalDays++;
                if (studentRecord.status === "present") presentDays++;
                else if (studentRecord.status === "absent") absentDays++;
                else if (studentRecord.status === "late") lateDays++;
              }
            });

            attendance = schoolDays > 0 ? (presentDays / schoolDays) * 100 : 0;
          }
        }

        // Determine attendance status
        let status = "good";
        if (attendance >= 95) status = "excellent";
        else if (attendance >= 85) status = "good";
        else if (attendance >= 80) status = "fair";
        else status = "concerning";

        return {
          id: (student._id as any).toString(),
          name: student.fullName,
          grade: student.currentClass,
          attendance: Math.round(attendance),
          status,
          breakdown: {
            present: presentDays,
            absent: absentDays,
            late: lateDays,
            total: totalDays,
          },
          recentPattern: [
            { date: "2024-01-15", status: "present" },
            { date: "2024-01-14", status: "present" },
            { date: "2024-01-13", status: "late" },
            { date: "2024-01-12", status: "present" },
            { date: "2024-01-11", status: "present" },
            { date: "2024-01-10", status: "present" },
            { date: "2024-01-09", status: "absent" },
          ],
        };
      })
    );

    // Calculate summary statistics
    const summary = {
      averageAttendance:
        childrenAttendance.length > 0
          ? Math.round(
              childrenAttendance.reduce(
                (sum, child) => sum + child.attendance,
                0
              ) / childrenAttendance.length
            )
          : 0,
      excellentCount: childrenAttendance.filter((c) => c.status === "excellent")
        .length,
      goodCount: childrenAttendance.filter(
        (c) => c.attendance >= 85 && c.attendance < 95
      ).length,
      needsAttentionCount: childrenAttendance.filter((c) => c.attendance < 85)
        .length,
    };

    res.json({
      parent: {
        name: parent.name,
        email: parent.email,
      },
      children: childrenAttendance,
      summary,
    });
  } catch (error) {
    console.error("Error fetching family attendance:", error);
    res.status(500).json({
      message: "Error fetching family attendance data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get messages
export const getMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user._id;

    // Fetch parent user
    const parent = await User.findById(userId).select("name email");

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Mock messages data (in a real app, this would come from a Messages model)
    const messages = {
      inbox: [
        {
          id: "1",
          type: "received",
          subject: "Parent-Teacher Conference Reminder",
          from: "Mrs. Johnson (Mathematics Teacher)",
          to: parent.name,
          content:
            "This is a reminder about our upcoming parent-teacher conference scheduled for next Tuesday at 2:00 PM. We'll discuss your child's progress in mathematics and set goals for the next term.",
          date: new Date().toISOString(),
          read: false,
          priority: "normal",
        },
        {
          id: "2",
          type: "received",
          subject: "Excellent Progress Report",
          from: "Principal Williams",
          to: parent.name,
          content:
            "Congratulations! Your child has shown excellent progress this term. Their attendance, participation, and academic performance have been outstanding. Keep up the great work!",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: "high",
        },
      ],
      sent: [
        {
          id: "3",
          type: "sent",
          subject: "Question about homework assignment",
          from: parent.name,
          to: "Mr. Smith (Science Teacher)",
          content:
            "Hi Mr. Smith, I hope this message finds you well. My child mentioned they were having difficulty with the recent homework assignment on chemical reactions. Could you please provide some additional guidance or resources?",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: "normal",
        },
      ],
      teachers: [
        {
          id: "1",
          name: "Mrs. Johnson",
          subject: "Mathematics",
          email: "johnson@school.edu",
        },
        {
          id: "2",
          name: "Mr. Smith",
          subject: "Science",
          email: "smith@school.edu",
        },
        {
          id: "3",
          name: "Ms. Davis",
          subject: "English",
          email: "davis@school.edu",
        },
        {
          id: "4",
          name: "Principal Williams",
          subject: "Administration",
          email: "williams@school.edu",
        },
      ],
    };

    res.json({
      parent: {
        name: parent.name,
        email: parent.email,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      message: "Error fetching messages data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get child profile
export const getChildProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { studentId } = req.params;
    const parentId = req.user._id;

    // Check authorization
    const isAuthorized = await checkParentAuthorization(parentId, studentId);
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this student's data" });
    }

    // Fetch student profile
    const student = await Student.findById(studentId)
      .select(
        `
        studentId fullName firstName lastName gender dateOfBirth
        address location email passportPhoto emergencyContact
        parentName parentPhone parentEmail relationshipToStudent
        currentClass classroomId status admissionDate
      `
      )
      .populate("classroomId", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      profile: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        address: student.address,
        location: student.location,
        email: student.email,
        passportPhoto: student.passportPhoto,
        emergencyContact: student.emergencyContact,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        relationshipToStudent: student.relationshipToStudent,
        currentClass: student.currentClass,
        classroom: student.classroomId,
        status: student.status,
        admissionDate: student.admissionDate,
      },
    });
  } catch (error) {
    console.error("Error fetching child profile:", error);
    res.status(500).json({
      message: "Error fetching profile data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
