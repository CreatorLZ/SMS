import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(helmet());
app.use(express.json());

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    await connectDB();
    res.status(200).json({
      status: "OK",
      message: "Treasure Land SchoolSync API is running",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "ERROR", message: "Database connection failed" });
  }
});

// Start server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
