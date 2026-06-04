import type { Request, Response } from "express";

import {
  addBusinessMember,
  changeMemberRole,
  findBusinessMembers,
  removeBusinessMember
} from "./businessMember.service.js";
import {
  inviteMemberSchema,
  updateMemberSchema,
  userIdParamSchema
} from "./businessMember.validation.js";

import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";


export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { userId, role } = inviteMemberSchema.parse(req.body);

  await addBusinessMember({
    role,
    // permissions: body.permissions,
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    userId,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member invited successfully")
  );
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await findBusinessMembers(req.workspace!.businessId);
  return res.status(200).json(
    new ApiResponse(200, members, "Members retrieved successfully")
  );
});

export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = updateMemberSchema.parse(req.body);
  const { userId } = userIdParamSchema.parse(req.params);
  await changeMemberRole({
    role,
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    userId,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member role updated successfully")
  );
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => { 
  const { userId } = userIdParamSchema.parse(req.params);
  await removeBusinessMember({
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    userId,
  });
  
  return res.status(200).json(
    new ApiResponse(200, {}, "Member removed successfully")
  );
});