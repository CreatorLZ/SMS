"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const studentController_1 = require("../../controllers/student/studentController");
const router = express_1.default.Router();
// Public route for verifying PIN and viewing results
router.post("/results/verify", studentController_1.verifyAndGetResults);
// Protected routes
router.use(auth_1.protect, (0, auth_1.authorize)("student", "parent"));
router.get("/attendance", studentController_1.getAttendanceHistory);
exports.default = router;
