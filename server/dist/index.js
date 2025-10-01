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
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Load env vars
dotenv_1.default.config();
// Import models
require("./models/User");
require("./models/Student");
require("./models/Classroom");
require("./models/Attendance");
require("./models/AuditLog");
require("./models/Term");
require("./models/Timetable");
require("./models/GradingScale");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_1 = __importDefault(require("./routes/admin"));
const teacher_1 = __importDefault(require("./routes/teacher"));
const student_1 = __importDefault(require("./routes/student"));
// Import seed utility
const seed_1 = require("./utils/seed");
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Mount routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/teacher", teacher_1.default);
app.use("/api/student", student_1.default);
// Connect to MongoDB
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("MongoDB Connected");
    // Seed super admin on first run
    yield (0, seed_1.seedSuperAdmin)();
}))
    .catch((err) => console.log("MongoDB connection error:", err));
// Basic health check route
app.get("/", (req, res) => {
    res.send("Treasure Land School Management System API");
});
// Basic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
