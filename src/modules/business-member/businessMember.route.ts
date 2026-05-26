import { Router } from "express";

import {
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole
} from "./businessMember.controller.js";

import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { Business_Roles } from "@/consts.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";


const router = Router({
  mergeParams: true
});

router.use(verifyJWT, resolveWorkspace);

router.route("/")
  .get(
    requireRole([Business_Roles.OWNER, Business_Roles.ADMIN, Business_Roles.EMPLOYEE]),
    getMembers
  )
  .post(
    requireRole([Business_Roles.OWNER, Business_Roles.ADMIN]),
    inviteMember
  );

router.route("/:memberId")
  .delete(
    requireRole([Business_Roles.OWNER, Business_Roles.ADMIN]),
    removeMember
  );

router.route("/:memberId/role")
  .patch(
    requireRole([Business_Roles.OWNER, Business_Roles.ADMIN]),
    updateMemberRole
  );

export default router;
