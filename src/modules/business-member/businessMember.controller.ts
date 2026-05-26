import type { Request, Response } from "express";

import {
  addBusinessMember,
  changeMemberRole,
  findBusinessMembers,
  removeBusinessMember
} from "./businessMember.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";


export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  await addBusinessMember({
    authUserId: req.user?._id,
    memberId: req.params.memberId as string,
    ...req.body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member invited successfully")
  );
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await findBusinessMembers(
    req.params.businessId as string
  );
  return res.status(200).json(
    new ApiResponse(200, members, "Members retrieved successfully")
  );
});

export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => { 
  await changeMemberRole({
    authUserId: req.user?._id,
    memberId: req.params.memberId as string,
    ...req.body
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member role updated successfully")
  );
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => { 
  await removeBusinessMember({
    authUserId: req.user?._id,
    memberId: req.params.memberId as string,
    ...req.body
  });
  
  return res.status(200).json(
    new ApiResponse(200, {}, "Member removed successfully")
  );
});