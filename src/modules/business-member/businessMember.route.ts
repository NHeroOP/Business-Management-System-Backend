import { Router } from "express";

import {
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "./businessMember.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { BUSINESS_ROLE } from "@/consts.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";

const router = Router({
  mergeParams: true,
});

router.use(verifyJWT, resolveWorkspace);

router
  .route("/")
  .get(
    requireRole([
      BUSINESS_ROLE.OWNER,
      BUSINESS_ROLE.ADMIN,
      BUSINESS_ROLE.EMPLOYEE,
    ]),
    getMembers,
  )
  .post(requireRole([BUSINESS_ROLE.OWNER, BUSINESS_ROLE.ADMIN]), inviteMember);

router
  .route("/:memberId")
  .delete(
    requireRole([BUSINESS_ROLE.OWNER, BUSINESS_ROLE.ADMIN]),
    removeMember,
  );

router
  .route("/:memberId/role")
  .patch(
    requireRole([BUSINESS_ROLE.OWNER, BUSINESS_ROLE.ADMIN]),
    updateMemberRole,
  );

export default router;
