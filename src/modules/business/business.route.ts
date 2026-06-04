import { Router } from "express";

import {
  createBusiness,
  getCurrentBusiness,
  updateBusiness,
  updateBusinessLogo,
} from "./business.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { upload } from "@/shared/middlewares/multer.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { BUSINESS_ROLE } from "@/consts.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(upload.single("logoUrl"), createBusiness);

router.use(resolveWorkspace);

router
  .route("/current")
  .get(getCurrentBusiness)
  .patch(requireRole(BUSINESS_ROLE.OWNER), updateBusiness);

router
  .route("/current/logo")
  .patch(
    requireRole(BUSINESS_ROLE.OWNER),
    upload.single("logoUrl"),
    updateBusinessLogo,
  );

export default router;
