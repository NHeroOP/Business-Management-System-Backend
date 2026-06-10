import { Router } from "express";

import { getAnalytics } from "./analytics.controller.js";

import { BUSINESS_ROLE } from "@/consts.js";
import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";

const router = Router();


router.use(
  verifyJWT,
  resolveWorkspace,
  requireRole([BUSINESS_ROLE.ADMIN, BUSINESS_ROLE.OWNER])
)

router.route("/").get(getAnalytics);

export default router;