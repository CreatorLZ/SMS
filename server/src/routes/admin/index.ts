import express from "express";
import {
  protect,
  authorize,
  requirePermission,
  requireAnyPermission,
} from "../../middleware/auth";
import {
  registerUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getAuditLogs,
} from "../../controllers/admin/userController";
import {
  createTerm,
  activateTerm,
  getTerms,
} from "../../controllers/admin/termController";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deactivateSubject,
  activateSubject,
} from "../../controllers/admin/subjectController";
import {
  assignSubjects,
  removeSubject,
  getClassroomSubjects,
  getAvailableSubjects,
} from "../../controllers/admin/classroomSubjectController";
import { previewNextStudentId } from "../../utils/studentIdGenerator";
import {
  createClassroom,
  assignStudents,
  addStudentsToClassroom,
  removeStudentsFromClassroom,
  removeStudentFromClassroom,
  getClassroomStudents,
  getClassrooms,
  getSchoolDays,
  getAttendanceComparison,
  getRecentActivity,
} from "../../controllers/admin/classroomController";
import attendanceRoutes from "./attendance.routes";
import timetableRoutes from "./timetable.routes";
import reportsRoutes from "./reports.routes";

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router
  .route("/users")
  .post(requirePermission("users.create"), registerUser)
  .get(requirePermission("users.read"), getUsers);
router
  .route("/users/:id")
  .get(requirePermission("users.read"), getUserById)
  .patch(
    requireAnyPermission(
      "users.update",
      "users.manage_admins",
      "users.manage_superadmins"
    ),
    updateUser
  )
  .delete(
    requireAnyPermission(
      "users.delete",
      "users.manage_admins",
      "users.manage_superadmins"
    ),
    deleteUser
  );

// Student routes
router
  .route("/students")
  .get(requirePermission("students.read"), getStudents)
  .post(requirePermission("students.create"), createStudent);

router
  .route("/students/:id")
  .get(requirePermission("students.read"), getStudentById)
  .put(requirePermission("students.update"), updateStudent);

router.patch(
  "/students/:id/status",
  requirePermission("students.update"),
  toggleStudentStatus
);

router.get("/logs", requirePermission("audit.read"), getAuditLogs);

// Student ID preview endpoint
router.get(
  "/students/preview-id/:className",
  requirePermission("students.create"),
  async (req, res) => {
    try {
      const { className } = req.params;
      if (!className) {
        return res.status(400).json({ message: "Class name is required" });
      }

      const previewId = await previewNextStudentId(className);
      res.json({ previewId });
    } catch (error) {
      res.status(500).json({
        message: "Error generating student ID preview",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Term routes
router
  .route("/terms")
  .post(requirePermission("terms.create"), createTerm)
  .get(requirePermission("terms.read"), getTerms);

router.patch(
  "/terms/:id/activate",
  requirePermission("terms.activate"),
  activateTerm
);

// Classroom routes
router
  .route("/classrooms")
  .post(requirePermission("classrooms.create"), createClassroom)
  .get(requirePermission("classrooms.read"), getClassrooms);

router.post(
  "/classrooms/:id/students",
  requirePermission("classrooms.assign_students"),
  assignStudents
);

router.post(
  "/classrooms/:id/students/add",
  requirePermission("classrooms.assign_students"),
  addStudentsToClassroom
);

router.post(
  "/classrooms/:id/students/remove",
  requirePermission("classrooms.assign_students"),
  removeStudentsFromClassroom
);

router.get(
  "/classrooms/:id/students",
  authorize("admin", "superadmin", "teacher"),
  getClassroomStudents
);

router.delete(
  "/classrooms/:classroomId/students/:studentId",
  requirePermission("classrooms.assign_students"),
  removeStudentFromClassroom
);

// New classroom data routes
router.get(
  "/classrooms/:id/school-days",
  requireAnyPermission("classrooms.read", "attendance.read"),
  getSchoolDays
);

router.get(
  "/classrooms/:id/attendance-comparison",
  requireAnyPermission("classrooms.read", "attendance.read"),
  getAttendanceComparison
);

router.get(
  "/classrooms/:id/recent-activity",
  requireAnyPermission("classrooms.read", "attendance.read"),
  getRecentActivity
);

// Subject routes
router
  .route("/subjects")
  .post(requirePermission("subjects.create"), createSubject)
  .get(requirePermission("subjects.read"), getSubjects);

router
  .route("/subjects/:id")
  .get(requirePermission("subjects.read"), getSubjectById)
  .put(requirePermission("subjects.update"), updateSubject)
  .delete(requirePermission("subjects.delete"), deactivateSubject);

router.patch(
  "/subjects/:id/activate",
  requirePermission("subjects.update"),
  activateSubject
);

// Classroom subject routes
router.post(
  "/classrooms/:id/subjects",
  requirePermission("classrooms.assign_subjects"),
  assignSubjects
);

router.delete(
  "/classrooms/:id/subjects/:subjectId",
  requirePermission("classrooms.assign_subjects"),
  removeSubject
);

router.get(
  "/classrooms/:id/subjects",
  authorize("admin", "superadmin", "teacher"),
  getClassroomSubjects
);

router.get(
  "/classrooms/:id/available-subjects",
  requirePermission("classrooms.read"),
  getAvailableSubjects
);

// Teacher routes
router
  .route("/teachers")
  .post(requirePermission("teachers.create"), createTeacher)
  .get(requirePermission("teachers.read"), getTeachers);

router
  .route("/teachers/:id")
  .get(requirePermission("teachers.read"), getTeacherById)
  .put(requirePermission("teachers.update"), updateTeacher)
  .delete(requirePermission("teachers.delete"), deleteTeacher);

// Mount modular routes
router.use("/attendance", attendanceRoutes);
router.use("/timetable", timetableRoutes);
router.use("/reports", reportsRoutes);

export default router;
