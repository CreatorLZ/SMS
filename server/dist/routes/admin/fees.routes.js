"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const feeController_1 = require("../../controllers/admin/feeController");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_1.protect);
// Fee structure routes
router
    .route("/structures")
    .post((0, auth_1.requirePermission)("fees.create"), feeController_1.createFeeStructure)
    .get((0, auth_1.requirePermission)("fees.read"), feeController_1.getFeeStructures);
// Individual fee structure routes
router
    .route("/structures/:id")
    .put((0, auth_1.requirePermission)("fees.update"), feeController_1.updateFeeStructure)
    .delete((0, auth_1.requirePermission)("fees.delete"), feeController_1.deleteFeeStructure);
// Fee structure delete operations
router.get("/structures/:id/preview-delete", (0, auth_1.requirePermission)("fees.delete"), feeController_1.previewDeleteFeeStructure);
router.post("/structures/:id/confirm-delete", (0, auth_1.requirePermission)("fees.delete"), feeController_1.confirmDeleteFeeStructure);
// Student fee routes
router.post("/students/:studentId/pay", (0, auth_1.requirePermission)("fees.pay"), feeController_1.markFeePaid);
router.get("/students/:studentId/fees", (0, auth_1.requirePermission)("fees.read"), feeController_1.getStudentFees);
router.post("/students/:studentId/sync", (0, auth_1.requirePermission)("fees.sync"), feeController_1.syncIndividualStudentFees);
// Sync and monitoring routes
router.post("/sync-all", (0, auth_1.requirePermission)("fees.sync"), feeController_1.syncAllStudentFees);
router.post("/terms/:termId/sync", (0, auth_1.requirePermission)("fees.sync"), feeController_1.syncTermsFees);
router.get("/operations/:operationId", (0, auth_1.requirePermission)("fees.read"), feeController_1.getOperationStatus);
// Reconciliation routes
router.post("/reconcile/deduplicate", (0, auth_1.requirePermission)("fees.sync"), feeController_1.deduplicateStudentFees);
router.post("/reconcile/backfill", (0, auth_1.requirePermission)("fees.sync"), feeController_1.backfillMissingStudentFees);
router.post("/reconcile/full", (0, auth_1.requirePermission)("fees.sync"), feeController_1.fullFeeReconciliation);
// Reporting routes
router.get("/arrears", (0, auth_1.requirePermission)("fees.read"), feeController_1.getArrears);
router.get("/health-check", (0, auth_1.requirePermission)("fees.read"), feeController_1.getFeeHealthCheck);
exports.default = router;
