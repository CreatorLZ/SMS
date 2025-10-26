import express from "express";
import { protect, authorize } from "../middleware/auth";
import { checkTokenBlacklist } from "../middleware/tokenBlacklist";
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
router.post(
  "/register",
  protect,
  checkTokenBlacklist,
  authorize("admin", "superadmin"),
  register
);
router.post("/logout", protect, checkTokenBlacklist, logout);
router.get("/me", protect, checkTokenBlacklist, getCurrentUser);

export default router;
