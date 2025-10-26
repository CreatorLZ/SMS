"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const parentController_1 = require("../../controllers/parent/parentController");
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_1.protect, (0, auth_1.authorize)("parent"));
// Dashboard route
router.get("/dashboard", parentController_1.getDashboard);
// Overview routes
router.get("/children", parentController_1.getChildrenOverview);
router.get("/progress", parentController_1.getProgressReports);
router.get("/attendance", parentController_1.getFamilyAttendance);
router.get("/messages", parentController_1.getMessages);
// Child-specific routes
router.get("/children/:studentId/grades", parentController_1.getChildGrades);
router.get("/children/:studentId/attendance", parentController_1.getChildAttendance);
router.get("/children/:studentId/results", parentController_1.getChildResults);
router.get("/children/:studentId/profile", parentController_1.getChildProfile);
exports.default = router;
