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
} from "../../controllers/admin/classroomController";
import attendanceRoutes from "./attendance.routes";
import timetableRoutes from "./timetable.routes";
import reportsRoutes from "./reports.routes";

const router = express.Router();

// Protect all routes and restrict to admin only
router.use(protect);
router.use(authorize("admin", "superadmin"));

// User routes
router.route("/users").post(registerUser).get(getUsers);
router
  .route("/users/:id")
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

// Student routes
router.route("/students").get(getStudents).post(createStudent);

router.route("/students/:id").get(getStudentById).put(updateStudent);

router.patch("/students/:id/status", toggleStudentStatus);

router.get("/logs", getAuditLogs);

// Term routes
router.route("/terms").post(createTerm).get(getTerms);

router.patch("/terms/:id/activate", activateTerm);

// Classroom routes
router.route("/classrooms").post(createClassroom).get(getClassrooms);

router.post("/classrooms/:id/students", assignStudents);

router.get("/classrooms/:id/students", getClassroomStudents);

router.delete(
  "/classrooms/:classroomId/students/:studentId",
  removeStudentFromClassroom
);

// Teacher routes
router.route("/teachers").post(createTeacher).get(getTeachers);

router
  .route("/teachers/:id")
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

// Mount modular routes
router.use("/attendance", attendanceRoutes);
router.use("/timetable", timetableRoutes);
router.use("/reports", reportsRoutes);

export default router;
