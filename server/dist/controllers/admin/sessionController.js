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
exports.deleteSession = exports.deactivateSession = exports.activateSession = exports.updateSession = exports.createSession = exports.getSessionById = exports.getSessions = void 0;
const Session_1 = __importDefault(require("../../models/Session"));
// Get all sessions
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessions = yield Session_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: sessions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching sessions",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSessions = getSessions;
// Get session by ID
const getSessionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield Session_1.default.findById(req.params.id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }
        res.status(200).json({
            success: true,
            data: session,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching session",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSessionById = getSessionById;
// Create new session
const createSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, startYear, endYear, isActive } = req.body;
        // Validate required fields
        if (!name || !startYear || !endYear) {
            return res.status(400).json({
                success: false,
                message: "Name, start year, and end year are required",
            });
        }
        // Validate year format
        if (startYear >= endYear) {
            return res.status(400).json({
                success: false,
                message: "Start year must be less than end year",
            });
        }
        // If setting as active, deactivate all other sessions
        if (isActive) {
            yield Session_1.default.updateMany({}, { isActive: false });
        }
        const session = yield Session_1.default.create({
            name,
            startYear,
            endYear,
            isActive: isActive || false,
        });
        res.status(201).json({
            success: true,
            data: session,
            message: "Session created successfully",
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Session name already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: "Error creating session",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.createSession = createSession;
// Update session
const updateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, startYear, endYear, isActive } = req.body;
        // If setting as active, deactivate all other sessions
        if (isActive) {
            yield Session_1.default.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
        }
        const session = yield Session_1.default.findByIdAndUpdate(req.params.id, { name, startYear, endYear, isActive }, { new: true, runValidators: true });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }
        res.status(200).json({
            success: true,
            data: session,
            message: "Session updated successfully",
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Session name already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: "Error updating session",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.updateSession = updateSession;
// Activate session
const activateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Deactivate all sessions first
        yield Session_1.default.updateMany({}, { isActive: false });
        // Activate the specific session
        const session = yield Session_1.default.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }
        res.status(200).json({
            success: true,
            data: session,
            message: "Session activated successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error activating session",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.activateSession = activateSession;
// Deactivate session
const deactivateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield Session_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }
        res.status(200).json({
            success: true,
            data: session,
            message: "Session deactivated successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deactivating session",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.deactivateSession = deactivateSession;
// Delete session
const deleteSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield Session_1.default.findByIdAndDelete(req.params.id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Session deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting session",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.deleteSession = deleteSession;
