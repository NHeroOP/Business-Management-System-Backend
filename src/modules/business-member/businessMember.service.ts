import { Types } from "mongoose";

import { BusinessMember, type IBusinessMemberDocument } from "./BusinessMember.model.js";

import type { BusinessRole } from "@/consts.js";
import { ApiError } from "@/shared/utils/ApiError.js";

interface ReqParams {
  currUserRole: string;
  businessId: Types.ObjectId | string;
  memberId: Types.ObjectId | string | undefined;
}

interface AddMemberParams
  extends ReqParams {
  role: BusinessRole;
  // permissions?: string[];
}

interface ChangeMemberRoleParams
  extends ReqParams {
  role: BusinessRole;
}

export const addBusinessMember = async (
  payload: AddMemberParams
): Promise<IBusinessMemberDocument> => {
  const { currUserRole, businessId, memberId, role } = payload;

  if (!memberId || !role) {
    throw new ApiError(400, "User ID and Role are required");
  }

  // const authUserMembership = await BusinessMember.findOne({ businessId, memberId: authUserId, isArchived: false });

  // if (!authUserMembership) {
  //   throw new ApiError(403, "You are not a member of this business");
  // }

  if (currUserRole === "ADMIN" && role === "OWNER") {
    throw new ApiError(403, "Admins cannot invite owners to the business");
  }

  const existingMember = await BusinessMember.findOne({
    businessId,
    memberId,
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
    memberId,
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
  const members = await BusinessMember.find({ businessId, isArchived: false }).populate("memberId", "name email");

  if (!members || members.length === 0) {
    throw new ApiError(404, "No members found for this business");
  }

  return members;
};

export const changeMemberRole = async (
  payload: ChangeMemberRoleParams
): Promise<void> => {
  const { currUserRole, businessId, memberId, role } = payload;

  // const authUserMembership = await BusinessMember.findOne({ businessId, memberId: authUserId, isArchived: false });

  // if (!authUserMembership) {
  //   throw new ApiError(403, "You are not a member of this business");
  // }

  if (currUserRole === "ADMIN" && role === "OWNER") {
    throw new ApiError(403, "Admins cannot assign owner role to members");
  }

  if (!businessId || !memberId || !role) {
    throw new ApiError(400, "Business ID, User ID and Role are required");
  }

  const member = await BusinessMember.findOne({ businessId, memberId, isArchived: false });

  if (!member) {
    throw new ApiError(404, "Member not found in this business");
  }

  member.role = role;
  await member.save();
};

export const removeBusinessMember = async (
  { currUserRole, businessId, memberId }: ReqParams
): Promise<void> => {
  if (!businessId || !memberId) {
    throw new ApiError(400, "Business ID and User ID are required");
  }

  // const authUserMembership = await BusinessMember.findOne({ businessId, memberId: authUserId, isArchived: false });

  // if (!authUserMembership) {
  //   throw new ApiError(403, "You are not a member of this business");
  // }
  const targetMembership = await BusinessMember.findOne({ businessId, memberId });
  if (!targetMembership) {
    throw new ApiError(404, "Target member not found in this business");
  }

  if (currUserRole === "ADMIN" && targetMembership?.role === "OWNER") {
    throw new ApiError(403, "Admins cannot remove owners from the business");
  }

  targetMembership.isArchived = true;
  await targetMembership.save();
};