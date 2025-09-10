import { Request, Response } from "express";
import { Subject } from "../../models/Subject";
import { AuditLog } from "../../models/AuditLog";

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, category, level } = req.body;

    // Check if subject name already exists
    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      return res.status(400).json({
        message: `Subject "${name}" already exists`,
      });
    }

    const subject = await Subject.create({
      name,
      category,
      level,
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "SUBJECT_CREATE",
      description: `Created new subject ${name} (${category} - ${level})`,
      targetId: subject._id,
    });

    res.status(201).json(subject);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Subject name already exists (duplicate)",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
    console.log(error.message);
  }
};

// @desc    Get all subjects with optional filters
// @route   GET /api/subjects
// @access  Private/Admin
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const { category, level, isActive, search } = req.query;

    let filter: any = {};

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const subjects = await Subject.find(filter)
      .sort({ name: 1 })
      .select("name category level isActive createdAt updatedAt");

    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private/Admin
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json(subject);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { name, category, level, isActive } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if new name conflicts with existing subject
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ name });
      if (existingSubject) {
        return res.status(400).json({
          message: `Subject "${name}" already exists`,
        });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, category, level, isActive },
      { new: true, runValidators: true }
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "SUBJECT_UPDATE",
      description: `Updated subject ${subject.name}`,
      targetId: subject._id,
    });

    res.json(updatedSubject);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Subject name already exists (duplicate)",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Deactivate subject (soft delete)
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
export const deactivateSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Deactivate the subject
    subject.isActive = false;
    await subject.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "SUBJECT_DEACTIVATE",
      description: `Deactivated subject ${subject.name}`,
      targetId: subject._id,
    });

    res.json({ message: "Subject deactivated successfully", subject });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Activate subject
// @route   PATCH /api/subjects/:id/activate
// @access  Private/Admin
export const activateSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Activate the subject
    subject.isActive = true;
    await subject.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "SUBJECT_ACTIVATE",
      description: `Activated subject ${subject.name}`,
      targetId: subject._id,
    });

    res.json({ message: "Subject activated successfully", subject });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
