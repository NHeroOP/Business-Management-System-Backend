import { Router } from "express";

import {
  createPayment,
  getPaymentById,
  getPayments
} from "./payment.controller.js";

import { BUSINESS_ROLE } from "@/consts.js";
import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";

const router = Router();

router.use(
  verifyJWT,
  resolveWorkspace,
  requireRole(Object.values(BUSINESS_ROLE))
)

router.route("/")
  .get(getPayments)
  .post(createPayment);

router.route("/:paymentId")
  .get(getPaymentById);

export default router;