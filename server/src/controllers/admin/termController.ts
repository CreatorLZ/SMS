import { Request, Response } from "express";
import { Term } from "../../models/Term";
import { AuditLog } from "../../models/AuditLog";

// @desc    Create a new term
// @route   POST /api/admin/terms
// @access  Private/Admin
export const createTerm = async (req: Request, res: Response) => {
  try {
    const { name, year, startDate, endDate, holidays } = req.body;

    const term = await Term.create({
      name,
      year,
      startDate,
      endDate,
      holidays: holidays || [],
      isActive: false,
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_CREATE",
      description: `Created new term: ${name} ${year}`,
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

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_ACTIVATE",
      description: `Activated term: ${term.name} ${term.year}`,
      targetId: term._id,
    });

    res.json(term);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update term
// @route   PUT /api/admin/terms/:id
// @access  Private/Admin
export const updateTerm = async (req: Request, res: Response) => {
  try {
    const { name, year, startDate, endDate, holidays } = req.body;

    const term = await Term.findById(req.params.id);

    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Check if new term name/year combination conflicts with existing term
    if ((name && name !== term.name) || (year && year !== term.year)) {
      const existingTerm = await Term.findOne({
        name: name || term.name,
        year: year || term.year,
        _id: { $ne: req.params.id },
      });
      if (existingTerm) {
        return res.status(400).json({
          message: `Term "${name || term.name} ${
            year || term.year
          }" already exists`,
        });
      }
    }

    const updatedTerm = await Term.findByIdAndUpdate(
      req.params.id,
      { name, year, startDate, endDate, holidays },
      { new: true, runValidators: true }
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_UPDATE",
      description: `Updated term: ${term.name} ${term.year}`,
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

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "TERM_DEACTIVATE",
      description: `Deactivated term: ${term.name} ${term.year}`,
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
    const terms = await Term.find().sort({ year: -1, name: 1 });
    res.json(terms);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
