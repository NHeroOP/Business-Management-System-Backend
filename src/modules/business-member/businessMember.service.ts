import { Types } from "mongoose";

import { Business } from "../business/Business.model.js";
import type { UserIdParam, UpdateMemberInput } from "./businessMember.validation.js";
import { BusinessMember, type IBusinessMemberDocument } from "./BusinessMember.model.js";

import type { BusinessRole } from "@/consts.js";
import { ApiError } from "@/shared/utils/ApiError.js";

type WorkspaceContext = UserIdParam & {
  currUserRole: string;
  businessId: Types.ObjectId | string;
}

type AddMemberParams = WorkspaceContext & {   
  role: BusinessRole;
  // permissions?: string[];
}

export const addBusinessMember = async (
  payload: AddMemberParams
): Promise<IBusinessMemberDocument> => {
  const { currUserRole, businessId, userId, role } = payload;

  if (!userId || !role) {
    throw new ApiError(400, "User ID and Role are required");
  }


  if (currUserRole === "ADMIN" && role === "OWNER") {
    throw new ApiError(403, "Admins cannot invite owners to the business");
  }

  const existingMember = await BusinessMember.findOne({
    businessId,
    userId,
  });

  if (existingMember) {
    if (existingMember.isArchived) {
      existingMember.isArchived = false;
      existingMember.role = role;
      // existingMember.permissions = permissions;
      await existingMember.save();
    } else {
      throw new ApiError(400, "User is already a member of this business");
    }
  }

  const newMember = await BusinessMember.create({
    businessId,
    userId,
    role,
    // permissions,
  })

  if (!newMember) {
    throw new ApiError(500, "Failed to add member to business");
  }

  return newMember;
};

export const findBusinessMembers = async (
  businessId: Types.ObjectId | string
): Promise<IBusinessMemberDocument[]> => {
  const members = await BusinessMember.find({ businessId, isArchived: false }).populate("userId", "name email");

  if (!members || members.length === 0) {
    throw new ApiError(404, "No members found for this business");
  }

  return members;
};

export const changeMemberRole = async (
  payload: WorkspaceContext & UpdateMemberInput
): Promise<void> => {
  const { currUserRole, businessId, userId, role } = payload;

  if (currUserRole === "ADMIN" && role === "OWNER") {
    throw new ApiError(403, "Admins cannot assign owner role to members");
  }

  if (!businessId || !userId || !role) {
    throw new ApiError(400, "Business ID, User ID and Role are required");
  }

  const member = await BusinessMember.findOne({ businessId, userId, isArchived: false });

  if (!member) {
    throw new ApiError(404, "Member not found in this business");
  }

  member.role = role;
  await member.save();
};

export const removeBusinessMember = async (
  { currUserRole, businessId, userId }: WorkspaceContext
): Promise<void> => {
  if (!businessId || !userId) {
    throw new ApiError(400, "Business ID and User ID are required");
  }

  const [business, targetMembership] = await Promise.all([
    Business.findOne({ _id: businessId, isArchived: false }),
    BusinessMember.findOne({ businessId, userId })
  ]);

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  if (!targetMembership) {
    throw new ApiError(404, "Target member not found in this business");
  }

  if (business.createdBy.toString() === userId) {
    throw new ApiError(403, "Business owners cannot be removed from the business");
  }

  if (targetMembership?.userId.toString() === userId) {
    throw new ApiError(403, "Users cannot remove themselves from the business");
  }

  if (currUserRole === "ADMIN" && targetMembership?.role === "OWNER") {
    throw new ApiError(403, "Admins cannot remove owners from the business");
  }

  targetMembership.isArchived = true;
  await targetMembership.save();
};