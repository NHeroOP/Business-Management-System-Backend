import { Router } from "express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  downloadInvoicePdf,
} from "./invoice.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { BUSINESS_ROLE } from "@/consts.js";

const router = Router();
router.use(
  verifyJWT,
  resolveWorkspace,
  requireRole(Object.values(BUSINESS_ROLE)),
);

router.route("/").get(getInvoices).post(createInvoice);

router
  .route("/:invoiceId")
  .get(getInvoiceById)
  .patch(updateInvoice)
  .delete(deleteInvoice);

router.route("/:invoiceId/status").patch(updateInvoiceStatus);

router.route("/:invoiceId/pdf").get(downloadInvoicePdf);

export default router;
