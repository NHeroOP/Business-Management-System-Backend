import type { Request, Response } from "express";

import {
  addBusinessMember,
  changeMemberRole,
  findBusinessMembers,
  removeBusinessMember
} from "./businessMember.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import type { Types } from "mongoose";


export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  await addBusinessMember({
    role: req.body.role,
    currUserRole: req.workspace!.role,
    // permissions: req.body.permissions,
    businessId: req.workspace!.businessId,
    memberId: req.params.memberId as Types.ObjectId | string,
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
  await changeMemberRole({
    role: req.body.role,
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    memberId: req.params.memberId as Types.ObjectId | string,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member role updated successfully")
  );
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => { 
  await removeBusinessMember({
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    memberId: req.params.memberId as string | Types.ObjectId,
  });
  
  return res.status(200).json(
    new ApiResponse(200, {}, "Member removed successfully")
  );
});