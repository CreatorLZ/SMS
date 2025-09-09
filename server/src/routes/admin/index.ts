import express from "express";
import { protect, authorize } from "../../middleware/auth";
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
  createClassroom,
  assignStudents,
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
  .post(authorize("admin", "superadmin"), registerUser)
  .get(getUsers);
router
  .route("/users/:id")
  .get(getUserById)
  .patch(authorize("admin", "superadmin"), updateUser)
  .delete(authorize("admin", "superadmin"), deleteUser);

// Student routes
router
  .route("/students")
  .get(getStudents)
  .post(authorize("admin", "superadmin"), createStudent);

router
  .route("/students/:id")
  .get(getStudentById)
  .put(authorize("admin", "superadmin"), updateStudent);

router.patch(
  "/students/:id/status",
  authorize("admin", "superadmin"),
  toggleStudentStatus
);

router.get("/logs", getAuditLogs);

// Term routes
router
  .route("/terms")
  .post(authorize("admin", "superadmin"), createTerm)
  .get(getTerms);

router.patch(
  "/terms/:id/activate",
  authorize("admin", "superadmin"),
  activateTerm
);

// Classroom routes
router
  .route("/classrooms")
  .post(authorize("admin", "superadmin"), createClassroom)
  .get(getClassrooms);

router.post(
  "/classrooms/:id/students",
  authorize("admin", "superadmin"),
  assignStudents
);

router.get("/classrooms/:id/students", getClassroomStudents);

router.delete(
  "/classrooms/:classroomId/students/:studentId",
  authorize("admin", "superadmin"),
  removeStudentFromClassroom
);

// New classroom data routes
router.get(
  "/classrooms/:id/school-days",
  authorize("admin", "superadmin", "teacher"),
  getSchoolDays
);

router.get(
  "/classrooms/:id/attendance-comparison",
  authorize("admin", "superadmin", "teacher"),
  getAttendanceComparison
);

router.get(
  "/classrooms/:id/recent-activity",
  authorize("admin", "superadmin", "teacher"),
  getRecentActivity
);

// Teacher routes
router
  .route("/teachers")
  .post(authorize("admin", "superadmin"), createTeacher)
  .get(getTeachers);

router
  .route("/teachers/:id")
  .get(getTeacherById)
  .put(authorize("admin", "superadmin"), updateTeacher)
  .delete(authorize("admin", "superadmin"), deleteTeacher);

// Mount modular routes
router.use("/attendance", attendanceRoutes);
router.use("/timetable", timetableRoutes);
router.use("/reports", reportsRoutes);

export default router;
