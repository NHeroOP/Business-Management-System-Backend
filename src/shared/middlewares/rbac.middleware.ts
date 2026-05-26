import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import type { ROLE_ENUM } from "@/consts.js";

export const requireRole = (roles: ROLE_ENUM[] | ROLE_ENUM) => asyncHandler(
  async (req: Request, _: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!req.workspace || !allowedRoles.includes(req.workspace.role)) {
      throw new ApiError(403, "Forbidden");
    }

    next();
  }
);
