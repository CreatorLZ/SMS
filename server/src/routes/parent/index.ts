import express from "express";
import { protect, authorize } from "../../middleware/auth";
import {
  getDashboard,
  getChildGrades,
  getChildAttendance,
  getChildResults,
  getChildProfile,
  getChildrenOverview,
  getProgressReports,
  getFamilyAttendance,
  getMessages,
} from "../../controllers/parent/parentController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect, authorize("parent"));

// Dashboard route
router.get("/dashboard", getDashboard);

// Overview routes
router.get("/children", getChildrenOverview);
router.get("/progress", getProgressReports);
router.get("/attendance", getFamilyAttendance);
router.get("/messages", getMessages);

// Child-specific routes
router.get("/children/:studentId/grades", getChildGrades);
router.get("/children/:studentId/attendance", getChildAttendance);
router.get("/children/:studentId/results", getChildResults);
router.get("/children/:studentId/profile", getChildProfile);

export default router;
