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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildProfile = exports.getMessages = exports.getFamilyAttendance = exports.getProgressReports = exports.getChildrenOverview = exports.getChildResults = exports.getChildAttendance = exports.getChildGrades = exports.getDashboard = void 0;
const User_1 = require("../../models/User");
const Student_1 = require("../../models/Student");
const Attendance_1 = require("../../models/Attendance");
const Term_1 = require("../../models/Term");
const studentCalculations_1 = require("../../utils/studentCalculations");
// Cache for parent authorization data to avoid repeated DB queries
const parentAuthCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Helper function to check if parent is authorized for student
const checkParentAuthorization = (parentId, studentId) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = parentId;
    const now = Date.now();
    // Check cache first
    const cached = parentAuthCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.linkedStudentIds.some((id) => id.toString() === studentId);
    }
    // Fetch from DB and cache
    const parent = yield User_1.User.findById(parentId).select("linkedStudentIds");
    if (!parent || !parent.linkedStudentIds) {
        parentAuthCache.set(cacheKey, { linkedStudentIds: [], timestamp: now });
        return false;
    }
    parentAuthCache.set(cacheKey, {
        linkedStudentIds: parent.linkedStudentIds,
        timestamp: now,
    });
    return parent.linkedStudentIds.some((id) => id.toString() === studentId);
});
const getDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userId = req.user._id;
        // Fetch parent user with linked student IDs
        const parent = yield User_1.User.findById(userId).select("name email linkedStudentIds");
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
            return res.json({
                parent: {
                    name: parent.name,
                    email: parent.email,
                },
                linkedStudents: [],
                notifications: [],
                upcomingEvents: [],
            });
        }
        // Fetch linked students with relevant information
        const linkedStudents = yield Student_1.Student.find({
            _id: { $in: parent.linkedStudentIds },
        })
            .select("studentId fullName currentClass status parentName parentPhone relationshipToStudent classroomId results")
            .populate("classroomId", "name");
        // Pre-fetch active term (Fix N+1)
        const activeTerm = yield Term_1.Term.findOne({ isActive: true });
        // Group students by classroom for batch attendance queries
        const classroomGroups = linkedStudents.reduce((acc, student) => {
            var _a;
            const classroomId = (_a = student.classroomId) === null || _a === void 0 ? void 0 : _a.toString();
            if (classroomId) {
                if (!acc[classroomId])
                    acc[classroomId] = [];
                acc[classroomId].push(student);
            }
            return acc;
        }, {});
        // Batch fetch attendance records for all classrooms (Fix N+1)
        const classroomIds = Object.keys(classroomGroups);
        let allAttendanceRecords = [];
        if (activeTerm && classroomIds.length > 0) {
            allAttendanceRecords = yield Attendance_1.Attendance.find({
                classroomId: { $in: classroomIds },
                date: { $gte: activeTerm.startDate, $lte: activeTerm.endDate },
            });
        }
        // Create attendance lookup map for efficient access
        const attendanceMap = new Map();
        allAttendanceRecords.forEach((record) => {
            const key = `${record.classroomId}-${record.date.toISOString().split("T")[0]}`;
            if (!attendanceMap.has(key))
                attendanceMap.set(key, []);
            attendanceMap.get(key).push(record);
        });
        // Calculate GPA and attendance for each student
        const studentsWithStats = yield Promise.all(linkedStudents.map((student) => __awaiter(void 0, void 0, void 0, function* () {
            const gpa = (0, studentCalculations_1.calculateGPA)(student);
            const { percentage: attendance } = (0, studentCalculations_1.calculateAttendance)(student, activeTerm, attendanceMap);
            // Determine status based on GPA and attendance
            let status = "good";
            if (gpa >= 3.5 && attendance >= 90) {
                status = "excellent";
            }
            else if (gpa < 2.0 || attendance < 80) {
                status = "concerning";
            }
            else if (gpa < 2.5 || attendance < 85) {
                status = "needs_attention";
            }
            return {
                id: student._id.toString(),
                name: student.fullName,
                grade: student.currentClass,
                gpa: Math.round(gpa * 10) / 10,
                attendance: Math.round(attendance),
                status,
            };
        })));
        // Generate mock notifications and events (in a real app, these would come from separate models)
        const notifications = [
            {
                id: "1",
                type: "grade",
                child: ((_a = studentsWithStats[0]) === null || _a === void 0 ? void 0 : _a.name) || "Your Child",
                message: "New grade posted in Mathematics",
                date: new Date().toISOString().split("T")[0],
                priority: "normal",
            },
            {
                id: "2",
                type: "attendance",
                child: ((_b = studentsWithStats[0]) === null || _b === void 0 ? void 0 : _b.name) || "Your Child",
                message: "Attendance below 90% this week",
                date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
                priority: "warning",
            },
        ];
        const upcomingEvents = [
            {
                title: "Parent-Teacher Conference",
                child: studentsWithStats.length > 1
                    ? "All Children"
                    : ((_c = studentsWithStats[0]) === null || _c === void 0 ? void 0 : _c.name) || "Your Child",
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                time: "14:00",
                type: "meeting",
            },
            {
                title: "Report Card Distribution",
                child: studentsWithStats.length > 1
                    ? "All Children"
                    : ((_d = studentsWithStats[0]) === null || _d === void 0 ? void 0 : _d.name) || "Your Child",
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                time: "16:00",
                type: "academic",
            },
        ];
        res.json({
            parent: {
                name: parent.name,
                email: parent.email,
            },
            linkedStudents: studentsWithStats,
            notifications,
            upcomingEvents,
        });
    }
    catch (error) {
        console.error("Error fetching parent dashboard:", error);
        res.status(500).json({
            message: "Error fetching dashboard data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getDashboard = getDashboard;
// Get child grades
const getChildGrades = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { studentId } = req.params;
        const parentId = req.user._id;
        // Check authorization
        const isAuthorized = yield checkParentAuthorization(parentId, studentId);
        if (!isAuthorized) {
            return res
                .status(403)
                .json({ message: "Not authorized to access this student's data" });
        }
        // Fetch student with results
        const student = yield Student_1.Student.findById(studentId)
            .select("fullName currentClass results")
            .populate("results.updatedBy", "name");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Format grades data
        const grades = student.results.map((result) => ({
            term: result.term,
            year: result.year,
            subjects: result.scores.map((score) => ({
                subject: score.subject,
                ca1: score.assessments.ca1,
                ca2: score.assessments.ca2,
                exam: score.assessments.exam,
                totalScore: score.totalScore,
                grade: score.totalScore >= 70
                    ? "A"
                    : score.totalScore >= 60
                        ? "B"
                        : score.totalScore >= 50
                            ? "C"
                            : score.totalScore >= 40
                                ? "D"
                                : "F",
            })),
            comment: result.comment,
            updatedBy: result.updatedBy,
            updatedAt: result.updatedAt,
        }));
        res.json({
            student: {
                id: student._id,
                name: student.fullName,
                currentClass: student.currentClass,
            },
            grades,
        });
    }
    catch (error) {
        console.error("Error fetching child grades:", error);
        res.status(500).json({
            message: "Error fetching grades data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getChildGrades = getChildGrades;
// Get child attendance
const getChildAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { studentId } = req.params;
        const parentId = req.user._id;
        const { term, year, page = 1, limit = 20 } = req.query;
        // Check authorization
        const isAuthorized = yield checkParentAuthorization(parentId, studentId);
        if (!isAuthorized) {
            return res
                .status(403)
                .json({ message: "Not authorized to access this student's data" });
        }
        // Fetch student
        const student = yield Student_1.Student.findById(studentId).select("fullName currentClass classroomId");
        if (!student || !student.classroomId) {
            return res
                .status(404)
                .json({ message: "Student not found or not assigned to a classroom" });
        }
        // Get term dates if term and year provided
        let dateFilter = {};
        if (term && year) {
            const activeTerm = yield Term_1.Term.findOne({
                name: term,
                year: parseInt(year),
            });
            if (activeTerm) {
                dateFilter = {
                    date: { $gte: activeTerm.startDate, $lte: activeTerm.endDate },
                };
            }
        }
        // Validate and parse pagination parameters
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ message: "Invalid page parameter" });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res
                .status(400)
                .json({ message: "Invalid limit parameter (1-100)" });
        }
        const skip = (pageNum - 1) * limitNum;
        // Fetch attendance records with pagination
        const attendanceRecords = yield Attendance_1.Attendance.find(Object.assign(Object.assign({ classroomId: student.classroomId }, dateFilter), { "records.studentId": studentId }))
            .select("date records")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);
        // Get total count for pagination
        const totalRecords = yield Attendance_1.Attendance.countDocuments(Object.assign(Object.assign({ classroomId: student.classroomId }, dateFilter), { "records.studentId": studentId }));
        // Calculate attendance statistics using MongoDB aggregation
        const attendanceStats = yield Attendance_1.Attendance.aggregate([
            { $match: Object.assign({ classroomId: student.classroomId }, dateFilter) },
            { $unwind: "$records" },
            { $match: { "records.studentId": studentId } },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: 1 },
                    presentDays: {
                        $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] },
                    },
                    absentDays: {
                        $sum: { $cond: [{ $eq: ["$records.status", "absent"] }, 1, 0] },
                    },
                    lateDays: {
                        $sum: { $cond: [{ $eq: ["$records.status", "late"] }, 1, 0] },
                    },
                },
            },
        ]);
        const stats = attendanceStats[0] || {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
        };
        let totalDays = stats.totalDays;
        let presentDays = stats.presentDays;
        let absentDays = stats.absentDays;
        let lateDays = stats.lateDays;
        const attendanceDetails = attendanceRecords.map((record) => {
            var _a;
            const studentRecord = (_a = record.records) === null || _a === void 0 ? void 0 : _a.find((r) => r.studentId.toString() === studentId);
            return {
                date: record.date,
                status: (studentRecord === null || studentRecord === void 0 ? void 0 : studentRecord.status) || "not_recorded",
            };
        });
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        res.json({
            student: {
                id: student._id,
                name: student.fullName,
                currentClass: student.currentClass,
            },
            attendance: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                percentage: attendancePercentage,
                details: attendanceDetails,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalRecords,
                    pages: Math.ceil(totalRecords / limitNum),
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching child attendance:", error);
        res.status(500).json({
            message: "Error fetching attendance data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getChildAttendance = getChildAttendance;
// Get child results
const getChildResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { studentId } = req.params;
        const parentId = req.user._id;
        // Check authorization
        const isAuthorized = yield checkParentAuthorization(parentId, studentId);
        if (!isAuthorized) {
            return res
                .status(403)
                .json({ message: "Not authorized to access this student's data" });
        }
        // Fetch student with results
        const student = yield Student_1.Student.findById(studentId)
            .select("fullName currentClass results")
            .populate("results.updatedBy", "name");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Format results data
        const results = student.results.map((result) => ({
            term: result.term,
            year: result.year,
            subjects: result.scores.map((score) => ({
                subject: score.subject,
                assessments: score.assessments,
                totalScore: score.totalScore,
                grade: score.totalScore >= 70
                    ? "A"
                    : score.totalScore >= 60
                        ? "B"
                        : score.totalScore >= 50
                            ? "C"
                            : score.totalScore >= 40
                                ? "D"
                                : "F",
            })),
            overallAverage: result.scores.length > 0
                ? result.scores.reduce((sum, score) => sum + score.totalScore, 0) /
                    result.scores.length
                : 0,
            comment: result.comment,
            updatedBy: result.updatedBy,
            updatedAt: result.updatedAt,
        }));
        res.json({
            student: {
                id: student._id,
                name: student.fullName,
                currentClass: student.currentClass,
            },
            results,
        });
    }
    catch (error) {
        console.error("Error fetching child results:", error);
        res.status(500).json({
            message: "Error fetching results data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getChildResults = getChildResults;
// Get children overview
const getChildrenOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userId = req.user._id;
        // Fetch parent user with linked student IDs
        const parent = yield User_1.User.findById(userId).select("name email linkedStudentIds");
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
            return res.json({
                parent: {
                    name: parent.name,
                    email: parent.email,
                },
                children: [],
                summary: {
                    totalChildren: 0,
                    averageGPA: 0,
                    averageAttendance: 0,
                },
            });
        }
        // Fetch linked students with relevant information
        const linkedStudents = yield Student_1.Student.find({
            _id: { $in: parent.linkedStudentIds },
        })
            .select("studentId fullName currentClass status parentName parentPhone relationshipToStudent classroomId results")
            .populate("classroomId", "name");
        // Pre-fetch active term (Fix N+1)
        const activeTerm = yield Term_1.Term.findOne({ isActive: true });
        // Group students by classroom for batch attendance queries
        const classroomGroups = linkedStudents.reduce((acc, student) => {
            var _a;
            const classroomId = (_a = student.classroomId) === null || _a === void 0 ? void 0 : _a.toString();
            if (classroomId) {
                if (!acc[classroomId])
                    acc[classroomId] = [];
                acc[classroomId].push(student);
            }
            return acc;
        }, {});
        // Batch fetch attendance records for all classrooms (Fix N+1)
        const classroomIds = Object.keys(classroomGroups);
        let allAttendanceRecords = [];
        if (activeTerm && classroomIds.length > 0) {
            allAttendanceRecords = yield Attendance_1.Attendance.find({
                classroomId: { $in: classroomIds },
                date: { $gte: activeTerm.startDate, $lte: activeTerm.endDate },
            });
        }
        // Create attendance lookup map for efficient access
        const attendanceMap = new Map();
        allAttendanceRecords.forEach((record) => {
            const key = `${record.classroomId}-${record.date.toISOString().split("T")[0]}`;
            if (!attendanceMap.has(key))
                attendanceMap.set(key, []);
            attendanceMap.get(key).push(record);
        });
        // Calculate GPA and attendance for each student (same logic as dashboard)
        const childrenWithStats = yield Promise.all(linkedStudents.map((student) => __awaiter(void 0, void 0, void 0, function* () {
            const gpa = (0, studentCalculations_1.calculateGPA)(student);
            const { percentage: attendance } = (0, studentCalculations_1.calculateAttendance)(student, activeTerm, attendanceMap);
            // Determine status based on GPA and attendance
            let status = "good";
            if (gpa >= 3.5 && attendance >= 90) {
                status = "excellent";
            }
            else if (gpa < 2.0 || attendance < 80) {
                status = "concerning";
            }
            else if (gpa < 2.5 || attendance < 85) {
                status = "needs_attention";
            }
            return {
                id: student._id.toString(),
                name: student.fullName,
                grade: student.currentClass,
                gpa: Math.round(gpa * 10) / 10,
                attendance: Math.round(attendance),
                status,
            };
        })));
        // Calculate summary statistics
        const summary = {
            totalChildren: childrenWithStats.length,
            averageGPA: childrenWithStats.length > 0
                ? Math.round((childrenWithStats.reduce((sum, child) => sum + child.gpa, 0) /
                    childrenWithStats.length) *
                    10) / 10
                : 0,
            averageAttendance: childrenWithStats.length > 0
                ? Math.round(childrenWithStats.reduce((sum, child) => sum + child.attendance, 0) / childrenWithStats.length)
                : 0,
        };
        res.json({
            parent: {
                name: parent.name,
                email: parent.email,
            },
            children: childrenWithStats,
            summary,
        });
    }
    catch (error) {
        console.error("Error fetching children overview:", error);
        res.status(500).json({
            message: "Error fetching children overview data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getChildrenOverview = getChildrenOverview;
// Get progress reports
const getProgressReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userId = req.user._id;
        const { child: selectedChildId } = req.query;
        // Fetch parent user with linked student IDs
        const parent = yield User_1.User.findById(userId).select("name email linkedStudentIds");
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
            return res.json({
                parent: {
                    name: parent.name,
                    email: parent.email,
                },
                children: [],
                selectedChild: null,
                progressData: null,
            });
        }
        // Fetch linked students with relevant information
        const linkedStudents = yield Student_1.Student.find({
            _id: { $in: parent.linkedStudentIds },
        }).select("studentId fullName currentClass status results");
        // Calculate progress data for each child
        const childrenProgress = yield Promise.all(linkedStudents.map((student) => __awaiter(void 0, void 0, void 0, function* () {
            // Calculate GPA from results
            let gpa = 0;
            let trend = "stable";
            if (student.results && student.results.length > 0) {
                let validResultsCount = 0;
                const totalScore = student.results.reduce((sum, result) => {
                    if (result.scores && result.scores.length > 0) {
                        const subjectAverage = result.scores.reduce((subjectSum, score) => {
                            return subjectSum + score.totalScore;
                        }, 0) / result.scores.length;
                        validResultsCount++;
                        return sum + subjectAverage;
                    }
                    else {
                        console.warn(`Student ${student._id}: Result for term ${result.term} year ${result.year} has empty scores array`);
                        return sum; // Skip this result, treat as 0
                    }
                }, 0);
                gpa = validResultsCount > 0 ? totalScore / validResultsCount : 0;
                // Simple trend calculation (in a real app, this would compare with previous terms)
                trend = Math.random() > 0.5 ? "up" : "stable";
            }
            return {
                id: student._id.toString(),
                name: student.fullName,
                grade: student.currentClass,
                gpa: Math.round(gpa * 10) / 10,
                trend,
                subjects: [
                    { subject: "Mathematics", grade: "A", trend: "up" },
                    { subject: "English", grade: "B+", trend: "stable" },
                    { subject: "Science", grade: "A-", trend: "up" },
                ],
            };
        })));
        let selectedChild = null;
        let progressData = null;
        if (selectedChildId && typeof selectedChildId === "string") {
            // Check authorization using the centralized helper
            const isAuthorized = yield checkParentAuthorization(userId, selectedChildId);
            if (!isAuthorized) {
                return res
                    .status(403)
                    .json({ message: "Not authorized to access this student's data" });
            }
            const child = childrenProgress.find((c) => c.id === selectedChildId);
            if (child) {
                selectedChild = child;
                progressData = {
                    performanceTrends: {
                        gpa: {
                            current: child.gpa,
                            previous: child.gpa - 0.1,
                            trend: child.trend,
                        },
                        attendance: { current: 95, previous: 93, trend: "up" },
                        subjects: child.subjects,
                    },
                    achievements: [
                        {
                            title: "Mathematics Excellence",
                            description: "Scored 95% in recent mathematics assessment",
                            date: new Date().toISOString(),
                        },
                        {
                            title: "Perfect Attendance",
                            description: "Maintained 100% attendance for the month",
                            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        },
                    ],
                };
            }
        }
        res.json({
            parent: {
                name: parent.name,
                email: parent.email,
            },
            children: childrenProgress,
            selectedChild,
            progressData,
        });
    }
    catch (error) {
        console.error("Error fetching progress reports:", error);
        res.status(500).json({
            message: "Error fetching progress reports data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getProgressReports = getProgressReports;
// Get family attendance
const getFamilyAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userId = req.user._id;
        // Fetch parent user with linked student IDs
        const parent = yield User_1.User.findById(userId).select("name email linkedStudentIds");
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
            return res.json({
                parent: {
                    name: parent.name,
                    email: parent.email,
                },
                children: [],
                summary: {
                    averageAttendance: 0,
                    excellentCount: 0,
                    goodCount: 0,
                    needsAttentionCount: 0,
                },
            });
        }
        // Fetch linked students with classroom information
        const linkedStudents = yield Student_1.Student.find({
            _id: { $in: parent.linkedStudentIds },
        })
            .select("studentId fullName currentClass classroomId results")
            .populate("classroomId", "name");
        // Pre-fetch active term (Fix N+1)
        const activeTerm = yield Term_1.Term.findOne({ isActive: true });
        // Group students by classroom for batch attendance queries
        const classroomGroups = linkedStudents.reduce((acc, student) => {
            var _a;
            const classroomId = (_a = student.classroomId) === null || _a === void 0 ? void 0 : _a.toString();
            if (classroomId) {
                if (!acc[classroomId])
                    acc[classroomId] = [];
                acc[classroomId].push(student);
            }
            return acc;
        }, {});
        // Batch fetch attendance records for all classrooms (Fix N+1)
        const classroomIds = Object.keys(classroomGroups);
        let allAttendanceRecords = [];
        if (activeTerm && classroomIds.length > 0) {
            allAttendanceRecords = yield Attendance_1.Attendance.find({
                classroomId: { $in: classroomIds },
                date: { $gte: activeTerm.startDate, $lte: activeTerm.endDate },
            });
        }
        // Create attendance lookup map for efficient access
        const attendanceMap = new Map();
        allAttendanceRecords.forEach((record) => {
            const key = `${record.classroomId}-${record.date.toISOString().split("T")[0]}`;
            if (!attendanceMap.has(key))
                attendanceMap.set(key, []);
            attendanceMap.get(key).push(record);
        });
        // Calculate attendance for each student using batched data
        const childrenAttendance = yield Promise.all(linkedStudents.map((student) => __awaiter(void 0, void 0, void 0, function* () {
            const gpa = (0, studentCalculations_1.calculateGPA)(student);
            const { percentage: attendance, breakdown } = (0, studentCalculations_1.calculateAttendance)(student, activeTerm, attendanceMap, true);
            // Determine status based on GPA and attendance
            let status = "good";
            if (gpa >= 3.5 && attendance >= 90) {
                status = "excellent";
            }
            else if (gpa < 2.5 || attendance < 85) {
                status = "needs_attention";
            }
            return {
                id: student._id.toString(),
                name: student.fullName,
                grade: student.currentClass,
                gpa: Math.round(gpa * 10) / 10,
                attendance: Math.round(attendance),
                status,
                breakdown: {
                    present: (breakdown === null || breakdown === void 0 ? void 0 : breakdown.present) || 0,
                    absent: (breakdown === null || breakdown === void 0 ? void 0 : breakdown.absent) || 0,
                    late: (breakdown === null || breakdown === void 0 ? void 0 : breakdown.late) || 0,
                    total: (breakdown === null || breakdown === void 0 ? void 0 : breakdown.total) || 0,
                },
                recentPattern: Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateString = date.toISOString().split("T")[0];
                    // Generate varied status values for realism
                    const statuses = [
                        "present",
                        "present",
                        "present",
                        "late",
                        "absent",
                    ];
                    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                    return { date: dateString, status: randomStatus };
                }).sort((a, b) => b.date.localeCompare(a.date)),
            };
        })));
        // Calculate summary statistics
        const summary = {
            averageAttendance: childrenAttendance.length > 0
                ? Math.round(childrenAttendance.reduce((sum, child) => sum + child.attendance, 0) / childrenAttendance.length)
                : 0,
            excellentCount: childrenAttendance.filter((c) => c.status === "excellent")
                .length,
            goodCount: childrenAttendance.filter((c) => c.status === "good").length,
            needsAttentionCount: childrenAttendance.filter((c) => c.status === "needs_attention").length,
        };
        res.json({
            parent: {
                name: parent.name,
                email: parent.email,
            },
            children: childrenAttendance,
            summary,
        });
    }
    catch (error) {
        console.error("Error fetching family attendance:", error);
        res.status(500).json({
            message: "Error fetching family attendance data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getFamilyAttendance = getFamilyAttendance;
// Get messages
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userId = req.user._id;
        // Fetch parent user
        const parent = yield User_1.User.findById(userId).select("name email");
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
        // Mock messages data (in a real app, this would come from a Messages model)
        const messages = {
            inbox: [
                {
                    id: "1",
                    type: "received",
                    subject: "Parent-Teacher Conference Reminder",
                    from: "Mrs. Johnson (Mathematics Teacher)",
                    to: parent.name,
                    content: "This is a reminder about our upcoming parent-teacher conference scheduled for next Tuesday at 2:00 PM. We'll discuss your child's progress in mathematics and set goals for the next term.",
                    date: new Date().toISOString(),
                    read: false,
                    priority: "normal",
                },
                {
                    id: "2",
                    type: "received",
                    subject: "Excellent Progress Report",
                    from: "Principal Williams",
                    to: parent.name,
                    content: "Congratulations! Your child has shown excellent progress this term. Their attendance, participation, and academic performance have been outstanding. Keep up the great work!",
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    read: true,
                    priority: "high",
                },
            ],
            sent: [
                {
                    id: "3",
                    type: "sent",
                    subject: "Question about homework assignment",
                    from: parent.name,
                    to: "Mr. Smith (Science Teacher)",
                    content: "Hi Mr. Smith, I hope this message finds you well. My child mentioned they were having difficulty with the recent homework assignment on chemical reactions. Could you please provide some additional guidance or resources?",
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    read: true,
                    priority: "normal",
                },
            ],
            teachers: [
                {
                    id: "1",
                    name: "Mrs. Johnson",
                    subject: "Mathematics",
                    email: "johnson@school.edu",
                },
                {
                    id: "2",
                    name: "Mr. Smith",
                    subject: "Science",
                    email: "smith@school.edu",
                },
                {
                    id: "3",
                    name: "Ms. Davis",
                    subject: "English",
                    email: "davis@school.edu",
                },
                {
                    id: "4",
                    name: "Principal Williams",
                    subject: "Administration",
                    email: "williams@school.edu",
                },
            ],
        };
        res.json({
            parent: {
                name: parent.name,
                email: parent.email,
            },
            messages,
        });
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            message: "Error fetching messages data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getMessages = getMessages;
// Get child profile
const getChildProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { studentId } = req.params;
        const parentId = req.user._id;
        // Check authorization
        const isAuthorized = yield checkParentAuthorization(parentId, studentId);
        if (!isAuthorized) {
            return res
                .status(403)
                .json({ message: "Not authorized to access this student's data" });
        }
        // Fetch student profile
        const student = yield Student_1.Student.findById(studentId)
            .select(`
        studentId fullName firstName lastName gender dateOfBirth
        address location email passportPhoto emergencyContact
        parentName parentPhone parentEmail relationshipToStudent
        currentClass classroomId status admissionDate
      `)
            .populate("classroomId", "name");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.json({
            profile: {
                id: student._id,
                studentId: student.studentId,
                fullName: student.fullName,
                firstName: student.firstName,
                lastName: student.lastName,
                gender: student.gender,
                dateOfBirth: student.dateOfBirth,
                address: student.address,
                location: student.location,
                email: student.email,
                passportPhoto: student.passportPhoto,
                emergencyContact: student.emergencyContact,
                parentName: student.parentName,
                parentPhone: student.parentPhone,
                parentEmail: student.parentEmail,
                relationshipToStudent: student.relationshipToStudent,
                currentClass: student.currentClass,
                classroom: student.classroomId,
                status: student.status,
                admissionDate: student.admissionDate,
            },
        });
    }
    catch (error) {
        console.error("Error fetching child profile:", error);
        res.status(500).json({
            message: "Error fetching profile data",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getChildProfile = getChildProfile;
