"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
// Public routes
router.post("/login", auth_controller_1.login);
router.post("/refresh", auth_controller_1.refresh);
// Development only route
if (process.env.NODE_ENV !== "production") {
    router.post("/dev-super-admin-login", auth_controller_1.devSuperAdminLogin);
}
// Protected routes
router.post("/register", auth_1.protect, (0, auth_1.authorize)("admin", "superadmin"), auth_controller_1.register);
router.post("/logout", auth_1.protect, auth_controller_1.logout);
router.get("/me", auth_1.protect, auth_controller_1.getCurrentUser);
exports.default = router;
