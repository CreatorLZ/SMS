"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../../middleware/auth");
const userController_1 = require("../../controllers/admin/userController");
const termController_1 = require("../../controllers/admin/termController");
const subjectController_1 = require("../../controllers/admin/subjectController");
const classroomSubjectController_1 = require("../../controllers/admin/classroomSubjectController");
const studentIdGenerator_1 = require("../../utils/studentIdGenerator");
const classroomController_1 = require("../../controllers/admin/classroomController");
const attendance_routes_1 = __importDefault(require("./attendance.routes"));
const timetable_routes_1 = __importDefault(require("./timetable.routes"));
const reports_routes_1 = __importDefault(require("./reports.routes"));
const fees_routes_1 = __importDefault(require("./fees.routes"));
// Configure multer for Excel file uploads
const upload = (0, multer_1.default)({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only Excel files
        const allowedMimes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only Excel files are allowed"));
        }
    },
});
const router = express_1.default.Router();
// Protect all routes
router.use(auth_1.protect);
// User routes
router
    .route("/users")
    .post((0, auth_1.requirePermission)("users.create"), userController_1.registerUser)
    .get((0, auth_1.requirePermission)("users.read"), userController_1.getUsers);
router
    .route("/users/:id")
    .get((0, auth_1.requirePermission)("users.read"), userController_1.getUserById)
    .patch((0, auth_1.requireAnyPermission)("users.update", "users.manage_admins", "users.manage_superadmins"), userController_1.updateUser)
    .delete((0, auth_1.requireAnyPermission)("users.delete", "users.manage_admins", "users.manage_superadmins"), userController_1.deleteUser);
// Student routes
router
    .route("/students")
    .get((0, auth_1.requirePermission)("students.read"), userController_1.getStudents)
    .post((0, auth_1.requirePermission)("students.create"), userController_1.createStudent);
router
    .route("/students/:id")
    .get((0, auth_1.requirePermission)("students.read"), userController_1.getStudentById)
    .put((0, auth_1.requirePermission)("students.update"), userController_1.updateStudent);
router.patch("/students/:id/status", (0, auth_1.requirePermission)("students.update"), userController_1.toggleStudentStatus);
// Passport photo update route
router.put("/students/:studentId/passport-photo", (0, auth_1.requirePermission)("students.update"), userController_1.updateStudentPassportPhoto);
router.get("/logs", (0, auth_1.requirePermission)("audit.read"), userController_1.getAuditLogs);
// Student ID preview endpoint
router.get("/students/preview-id/:className", (0, auth_1.requirePermission)("students.create"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { className } = req.params;
        if (!className) {
            return res.status(400).json({ message: "Class name is required" });
        }
        const previewId = yield (0, studentIdGenerator_1.previewNextStudentId)(className);
        res.json({ previewId });
    }
    catch (error) {
        res.status(500).json({
            message: "Error generating student ID preview",
            error: error instanceof Error ? error.message : String(error),
        });
    }
}));
// Term routes
router
    .route("/terms")
    .post((0, auth_1.requirePermission)("terms.create"), termController_1.createTerm)
    .get((0, auth_1.requirePermission)("terms.read"), termController_1.getTerms);
router.route("/terms/:id").put((0, auth_1.requirePermission)("terms.update"), termController_1.updateTerm);
router.patch("/terms/:id/activate", (0, auth_1.requirePermission)("terms.activate"), termController_1.activateTerm);
router.patch("/terms/:id/deactivate", (0, auth_1.requirePermission)("terms.update"), termController_1.deactivateTerm);
// Classroom routes
router
    .route("/classrooms")
    .post((0, auth_1.requirePermission)("classrooms.create"), classroomController_1.createClassroom)
    .get((0, auth_1.requirePermission)("classrooms.read"), classroomController_1.getClassrooms);
router.post("/classrooms/:id/students", (0, auth_1.requirePermission)("classrooms.assign_students"), classroomController_1.assignStudents);
router.post("/classrooms/:id/students/add", (0, auth_1.requirePermission)("classrooms.assign_students"), classroomController_1.addStudentsToClassroom);
router.post("/classrooms/:id/students/remove", (0, auth_1.requirePermission)("classrooms.assign_students"), classroomController_1.removeStudentsFromClassroom);
router.get("/classrooms/:id/students", (0, auth_1.authorize)("admin", "superadmin", "teacher"), classroomController_1.getClassroomStudents);
router.delete("/classrooms/:classroomId/students/:studentId", (0, auth_1.requirePermission)("classrooms.assign_students"), classroomController_1.removeStudentFromClassroom);
// New classroom data routes
router.get("/classrooms/:id/school-days", (0, auth_1.requireAnyPermission)("classrooms.read", "attendance.read"), classroomController_1.getSchoolDays);
router.get("/classrooms/:id/attendance-comparison", (0, auth_1.requireAnyPermission)("classrooms.read", "attendance.read"), classroomController_1.getAttendanceComparison);
router.get("/classrooms/:id/recent-activity", (0, auth_1.requireAnyPermission)("classrooms.read", "attendance.read"), classroomController_1.getRecentActivity);
router.put("/classrooms/:id/reassign-teacher", (0, auth_1.requirePermission)("classrooms.assign_students"), // Same permission as student assignment
classroomController_1.reassignTeacher);
// Results publication routes
router.patch("/classrooms/:id/results/publish", (0, auth_1.requirePermission)("students.update"), classroomController_1.publishClassroomResults);
router.get("/classrooms/:id/results/publication-status", (0, auth_1.requirePermission)("students.read"), classroomController_1.getResultsPublicationStatus);
// Subject routes
router
    .route("/subjects")
    .post((0, auth_1.requirePermission)("subjects.create"), subjectController_1.createSubject)
    .get((0, auth_1.requirePermission)("subjects.read"), subjectController_1.getSubjects);
router
    .route("/subjects/:id")
    .get((0, auth_1.requirePermission)("subjects.read"), subjectController_1.getSubjectById)
    .put((0, auth_1.requirePermission)("subjects.update"), subjectController_1.updateSubject)
    .delete((0, auth_1.requirePermission)("subjects.delete"), subjectController_1.deactivateSubject);
router.patch("/subjects/:id/activate", (0, auth_1.requirePermission)("subjects.update"), subjectController_1.activateSubject);
// Classroom subject routes
router.post("/classrooms/:id/subjects", (0, auth_1.requirePermission)("classrooms.assign_subjects"), classroomSubjectController_1.assignSubjects);
router.delete("/classrooms/:id/subjects/:subjectId", (0, auth_1.requirePermission)("classrooms.assign_subjects"), classroomSubjectController_1.removeSubject);
router.get("/classrooms/:id/subjects", (0, auth_1.authorize)("admin", "superadmin", "teacher"), classroomSubjectController_1.getClassroomSubjects);
router.get("/classrooms/:id/available-subjects", (0, auth_1.requirePermission)("classrooms.read"), classroomSubjectController_1.getAvailableSubjects);
// Grading scales route
router.get("/grading-scales", (0, auth_1.authorize)("admin", "superadmin", "teacher"), userController_1.getGradingScales);
// Excel template and bulk upload routes
router.get("/results/template", (0, auth_1.requirePermission)("students.update"), userController_1.downloadResultsTemplate);
router.post("/results/bulk-upload", (0, auth_1.requirePermission)("students.update"), upload.single("excelFile"), userController_1.uploadBulkResults);
// Teacher routes
router
    .route("/teachers")
    .post((0, auth_1.requirePermission)("teachers.create"), userController_1.createTeacher)
    .get((0, auth_1.requirePermission)("teachers.read"), userController_1.getTeachers);
router
    .route("/teachers/:id")
    .get((0, auth_1.requirePermission)("teachers.read"), userController_1.getTeacherById)
    .put((0, auth_1.requirePermission)("teachers.update"), userController_1.updateTeacher)
    .delete((0, auth_1.requirePermission)("teachers.delete"), userController_1.deleteTeacher);
// Mount modular routes
router.use("/attendance", attendance_routes_1.default);
router.use("/timetable", timetable_routes_1.default);
router.use("/reports", reports_routes_1.default);
router.use("/fees", fees_routes_1.default);
exports.default = router;
