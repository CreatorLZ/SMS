import express from "express";
import { protect, authorize, requirePermission } from "../../middleware/auth";
import {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
  previewDeleteFeeStructure,
  confirmDeleteFeeStructure,
  markFeePaid,
  getStudentFees,
  getArrears,
  syncAllStudentFees,
  syncIndividualStudentFees,
  getOperationStatus,
  getFeeHealthCheck,
} from "../../controllers/admin/feeController";

const router = express.Router();

// Protect all routes
router.use(protect);

// Fee structure routes
router
  .route("/structures")
  .post(requirePermission("fees.create"), createFeeStructure)
  .get(requirePermission("fees.read"), getFeeStructures);

// Individual fee structure routes
router
  .route("/structures/:id")
  .put(requirePermission("fees.update"), updateFeeStructure)
  .delete(requirePermission("fees.delete"), deleteFeeStructure);

// Fee structure delete operations
router.get(
  "/structures/:id/preview-delete",
  requirePermission("fees.delete"),
  previewDeleteFeeStructure
);
router.post(
  "/structures/:id/confirm-delete",
  requirePermission("fees.delete"),
  confirmDeleteFeeStructure
);

// Student fee routes
router.post(
  "/students/:studentId/pay",
  requirePermission("fees.pay"),
  markFeePaid
);
router.get(
  "/students/:studentId/fees",
  requirePermission("fees.read"),
  getStudentFees
);
router.post(
  "/students/:studentId/sync",
  requirePermission("fees.sync"),
  syncIndividualStudentFees
);

// Sync and monitoring routes
router.post("/sync-all", requirePermission("fees.sync"), syncAllStudentFees);
router.get(
  "/operations/:operationId",
  requirePermission("fees.read"),
  getOperationStatus
);

// Reporting routes
router.get("/arrears", requirePermission("fees.read"), getArrears);
router.get("/health-check", requirePermission("fees.read"), getFeeHealthCheck);

export default router;
