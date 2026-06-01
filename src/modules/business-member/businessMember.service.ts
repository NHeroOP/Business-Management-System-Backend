import { Types } from "mongoose";

import { BusinessMember, type IBusinessMemberDocument } from "./BusinessMember.model.js";

import type { BusinessRole } from "@/consts.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import type { UpdateMemberInput } from "./businessMember.validation.js";

interface WorkspaceContext {
  currUserRole: string;
  businessId: Types.ObjectId | string;
  userId: Types.ObjectId | string | undefined;
}

interface AddMemberParams
  extends WorkspaceContext {
  role: BusinessRole;
  // permissions?: string[];
}

interface ChangeMemberRoleParams
  extends WorkspaceContext {
  role: UpdateMemberInput;
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

  const targetMembership = await BusinessMember.findOne({ businessId, userId });
  if (!targetMembership) {
    throw new ApiError(404, "Target member not found in this business");
  }

  if (currUserRole === "ADMIN" && targetMembership?.role === "OWNER") {
    throw new ApiError(403, "Admins cannot remove owners from the business");
  }

  targetMembership.isArchived = true;
  await targetMembership.save();
};