import express from "express";
import { protect, authorize } from "../../middleware/auth";
import {
  verifyAndGetResults,
  getAttendanceHistory,
} from "../../controllers/student/studentController";

const router = express.Router();

// Public route for verifying PIN and viewing results
router.post("/results/verify", verifyAndGetResults);

// Protected routes
router.use(protect, authorize("student", "parent"));
router.get("/attendance", getAttendanceHistory);

export default router;
