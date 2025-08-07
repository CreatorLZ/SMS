import express from "express";
import { protect, authorize } from "../middleware/auth";
import {
  register,
  login,
  logout,
  getCurrentUser,
  refresh,
  devSuperAdminLogin,
} from "../controllers/auth.controller";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/refresh", refresh);

// Development only route
if (process.env.NODE_ENV !== "production") {
  router.post("/dev-super-admin-login", devSuperAdminLogin);
}

// Protected routes
router.post("/register", protect, authorize("admin", "superadmin"), register);
router.post("/logout", protect, logout);
router.get("/me", protect, getCurrentUser);

export default router;
