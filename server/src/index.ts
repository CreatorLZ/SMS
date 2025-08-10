import "module-alias/register";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Load env vars
dotenv.config();

// Import models
import "./models/User";
import "./models/Student";
import "./models/Classroom";
import "./models/AuditLog";
import "./models/Term";

// Import routes
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin";
import teacherRoutes from "./routes/teacher";
import studentRoutes from "./routes/student";

// Import seed utility
import { seedSuperAdmin } from "./utils/seed";

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(async () => {
    console.log("MongoDB Connected");
    // Seed super admin on first run
    await seedSuperAdmin();
  })
  .catch((err) => console.log("MongoDB connection error:", err));

// Basic health check route
app.get("/", (req, res) => {
  res.send("Treasure Land School Management System API");
});

// Basic error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
