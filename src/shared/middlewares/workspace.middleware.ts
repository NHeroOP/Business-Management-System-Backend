import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { BusinessMember } from "@/modules/business-member/BusinessMember.model.js";

export const resolveWorkspace = asyncHandler(
  async (req: Request, _: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const businessId = req.header("x-business-id");

    if (!businessId) {
      throw new ApiError(400, "Business ID is required");
    }

    const member = await BusinessMember
      .findOne({
        businessId,
        memberId: req.user._id,
        isArchived: false,
      })
      .select("-permissions -isArchived -createdAt -updatedAt -__v");

    if (!member) {
      throw new ApiError(403, "Workspace access denied");
    }

    req.workspace = {
      _id: member._id,
      businessId: member.businessId,
      role: member.role,
      memberId: member.memberId,
    };

    next();
  }
);