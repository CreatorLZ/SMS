import { Request, Response } from "express";
import Session from "../../models/Session";

// Get all sessions
export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get session by ID
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching session",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Create new session
export const createSession = async (req: Request, res: Response) => {
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
      await Session.updateMany({}, { isActive: false });
    }

    const session = await Session.create({
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
  } catch (error: any) {
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
};

// Update session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { name, startYear, endYear, isActive } = req.body;

    // If setting as active, deactivate all other sessions
    if (isActive) {
      await Session.updateMany(
        { _id: { $ne: req.params.id } },
        { isActive: false }
      );
    }

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { name, startYear, endYear, isActive },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
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
};

// Activate session
export const activateSession = async (req: Request, res: Response) => {
  try {
    // Deactivate all sessions first
    await Session.updateMany({}, { isActive: false });

    // Activate the specific session
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error activating session",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Deactivate session
export const deactivateSession = async (req: Request, res: Response) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deactivating session",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete session
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting session",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
