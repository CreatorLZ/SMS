import express from "express";
import { protect, authorize } from "../../middleware/auth";
import {
  registerUser,
  getUsers,
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
  getClassrooms,
} from "../../controllers/admin/classroomController";

const router = express.Router();

// Protect all routes and restrict to admin only
router.use(protect);
router.use(authorize("admin"));

// User routes
router.route("/users").post(registerUser).get(getUsers);

router.get("/logs", getAuditLogs);

// Term routes
router.route("/terms").post(createTerm).get(getTerms);

router.patch("/terms/:id/activate", activateTerm);

// Classroom routes
router.route("/classrooms").post(createClassroom).get(getClassrooms);

router.post("/classrooms/:id/students", assignStudents);

export default router;
