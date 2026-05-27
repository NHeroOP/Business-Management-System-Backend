import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "./client.controller.js";
import { verifyJWT } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/rbac.middleware.js";
import { Business_Roles } from "@/consts.js";
import { resolveWorkspace } from "@/shared/middlewares/workspace.middleware.js";

const router = Router();

router.use(
  verifyJWT,
  resolveWorkspace,
  requireRole([
    Business_Roles.OWNER,
    Business_Roles.ADMIN,
    Business_Roles.EMPLOYEE
  ])
);

router.route("/")
  .get(getClients)
  .post(createClient);

router.route("/:clientId")
  .get(getClientById)
  .patch(updateClient)
  .delete(deleteClient);

export default router;