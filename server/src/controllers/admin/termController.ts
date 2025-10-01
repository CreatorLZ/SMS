import { Request, Response } from "express";
import { Term } from "../../models/Term";
import { AuditLog } from "../../models/AuditLog";

// @desc    Create a new term
// @route   POST /api/admin/terms
// @access  Private/Admin
export const createTerm = async (req: Request, res: Response) => {
  try {
    const { name, sessionId, startDate, endDate, holidays } = req.body;

    const term = await Term.create({
      name,
      sessionId,
      startDate,
      endDate,
      holidays: holidays || [],
      isActive: false,
    });

    // Populate session data for audit log
    await term.populate("sessionId");

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_CREATE",
      description: `Created new term: ${name} ${(term.sessionId as any).name}`,
      targetId: term._id,
    });

    res.status(201).json(term);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Set term as active
// @route   PATCH /api/admin/terms/:id/activate
// @access  Private/Admin
export const activateTerm = async (req: Request, res: Response) => {
  try {
    // First, deactivate any currently active term
    await Term.updateMany({}, { isActive: false });

    // Then activate the specified term
    const term = await Term.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Activate all fee structures for this term
    const { FeeStructure } = await import("../../models/FeeStructure");
    const { syncStudentFeesForClassroomBatched } = await import(
      "../../services/feeSync.service"
    );
    const { FeeSyncLog } = await import("../../models/FeeSyncLog");

    const feeStructuresUpdated = await FeeStructure.updateMany(
      { termId: term._id },
      { isActive: true, updatedBy: req.user?._id }
    );

    // Return a response immediately while syncing in background
    let syncResult: any = null;
    if (feeStructuresUpdated.modifiedCount > 0) {
      try {
        // Sync fees for classrooms that have fee structures for this term
        const affectedFeeStructures = await FeeStructure.find({
          termId: term._id,
        }).select("classroomId");

        const processedClassrooms = new Set();
        for (const fs of affectedFeeStructures) {
          const classroomId = (fs.classroomId as any).toString();
          if (!processedClassrooms.has(classroomId)) {
            processedClassrooms.add(classroomId);
            await syncStudentFeesForClassroomBatched(
              classroomId,
              req.user?._id?.toString()
            );
          }
        }
      } catch (syncError: any) {
        console.error("Error syncing fees for activated term:", syncError);
        // Don't fail the activation if sync fails
      }
    }

    // Populate session data for audit log
    await term.populate("sessionId");

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_ACTIVATE",
      description: `Activated term: ${term.name} ${
        (term.sessionId as any).name
      }${
        feeStructuresUpdated.modifiedCount > 0
          ? ` and synced fees for ${feeStructuresUpdated.modifiedCount} fee structures`
          : ""
      }`,
      targetId: term._id,
    });

    res.json({
      term,
      message:
        feeStructuresUpdated.modifiedCount > 0
          ? `Term activated successfully. Fees for ${feeStructuresUpdated.modifiedCount} fee structures have been synced to students.`
          : "Term activated successfully. No new fee structures to sync.",
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update term
// @route   PUT /api/admin/terms/:id
// @access  Private/Admin
export const updateTerm = async (req: Request, res: Response) => {
  try {
    const { name, sessionId, startDate, endDate, holidays } = req.body;

    const term = await Term.findById(req.params.id);

    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Check if new term name/sessionId combination conflicts with existing term
    if (
      (name && name !== term.name) ||
      (sessionId && sessionId !== term.sessionId.toString())
    ) {
      const existingTerm = await Term.findOne({
        name: name || term.name,
        sessionId: sessionId || term.sessionId,
        _id: { $ne: req.params.id },
      });
      if (existingTerm) {
        return res.status(400).json({
          message: `Term "${
            name || term.name
          }" already exists for this session`,
        });
      }
    }

    const updatedTerm = await Term.findByIdAndUpdate(
      req.params.id,
      { name, sessionId, startDate, endDate, holidays },
      { new: true, runValidators: true }
    ).populate("sessionId");

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_UPDATE",
      description: `Updated term: ${term.name} ${(term.sessionId as any).name}`,
      targetId: term._id,
    });

    res.json(updatedTerm);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Term name and year combination already exists (duplicate)",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Deactivate term
// @route   PATCH /api/admin/terms/:id/deactivate
// @access  Private/Admin
export const deactivateTerm = async (req: Request, res: Response) => {
  try {
    const term = await Term.findById(req.params.id);

    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Deactivate the term
    term.isActive = false;
    await term.save();

    // Populate session data for audit log
    await term.populate("sessionId");

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_DEACTIVATE",
      description: `Deactivated term: ${term.name} ${
        (term.sessionId as any).name
      }`,
      targetId: term._id,
    });

    res.json(term);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all terms
// @route   GET /api/admin/terms
// @access  Private/Admin
export const getTerms = async (req: Request, res: Response) => {
  try {
    const terms = await Term.find()
      .populate("sessionId")
      .sort({ "sessionId.startYear": -1, name: 1 });
    res.json(terms);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
