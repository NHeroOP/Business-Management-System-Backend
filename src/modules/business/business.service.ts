import crypto from "crypto";
import type { Types } from "mongoose";

import {
  Business,
  type IBusiness,
  type IBusinessDocument,
} from "./Business.model.js";
import { generateSlug } from "./business.util.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";
import { BusinessMember } from "../business-member/BusinessMember.model.js";
import { BUSINESS_ROLE } from "@/consts.js";

type BusinessPayload = Pick<
  IBusiness,
  "name" | "email" | "phone" | "address" | "website" | "description"
>;
interface CreateBusinessPayload {
  payload: Pick<BusinessPayload, "name"> &
    Partial<Omit<BusinessPayload, "name">>;
  createdBy: Types.ObjectId | string | undefined;
  logoUrl?: string | undefined;
}

interface CreateBusinessMemberPayload {
  businessId: Types.ObjectId | string;
  memberId: Types.ObjectId | string | undefined;
}

interface UpdateBusinessDetailsPayload extends Partial<BusinessPayload> {
  businessId: Types.ObjectId | string;
}

interface UpdateBusinessLogoPayload {
  businessId: Types.ObjectId | string;
  logoUrl: string | undefined;
}

export const createBusiness = async ({
  createdBy,
  logoUrl,
  payload,
}: CreateBusinessPayload): Promise<IBusinessDocument> => {
  if (!createdBy) {
    throw new ApiError(401, "Unauthorized");
  }

  const { name, email, phone, address, website, description } = payload;

  if (!name || name?.trim() === "") {
    throw new ApiError(400, "Business name is required");
  }

  const slug = generateSlug(name, crypto.randomBytes(2).toString("hex"));

  const uploadedLogo = logoUrl ? await uploadOnCloudinary(logoUrl) : undefined;
  const logo = {
    url: uploadedLogo?.secure_url,
    publicId: uploadedLogo?.public_id,
  };

  const newBusiness = await Business.create({
    name,
    slug,
    createdBy,
    ...(logo && { logo }),
    ...(email && { email }),
    ...(phone && { phone }),
    ...(address && { address }),
    ...(website && { website }),
    ...(description && { description }),
  });

  if (!newBusiness) {
    throw new ApiError(500, "Failed to create business");
  }

  return newBusiness;
};

export const createBusinessMember = async ({
  businessId,
  memberId,
}: CreateBusinessMemberPayload): Promise<void> => {
  if (!businessId || !memberId) {
    throw new ApiError(500, "Business ID and User ID are required");
  }

  const member = await BusinessMember.create({
    businessId,
    memberId: memberId,
    role: BUSINESS_ROLE.OWNER,
  });

  if (!member) {
    throw new ApiError(500, "Failed to create business member");
  }
};

export const findBusinessById = async (
  businessId: Types.ObjectId | string,
): Promise<IBusinessDocument> => {
  if (!businessId) {
    throw new ApiError(400, "Business ID is required");
  }

  const business = await Business.findById(businessId).select(
    "-isArchived -metadata",
  );

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  return business;
};

export const updateBusinessDetails = async ({
  businessId,
  ...payload
}: UpdateBusinessDetailsPayload): Promise<IBusinessDocument> => {
  const { name, email, phone, address, website, description } = payload;

  if (!businessId) {
    throw new ApiError(400, "Business ID is required");
  }

  const business = await Business.findOneAndUpdate(
    { _id: businessId },
    {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(website && { website }),
      ...(description && { description }),
    },
    { returnDocument: "after" },
  ).select("-isArchived -metadata");

  if (!business) {
    throw new ApiError(404, "Business not found or failed to update");
  }

  return business;
};

export const updateBusinessLogo = async ({
  businessId,
  logoUrl,
}: UpdateBusinessLogoPayload): Promise<IBusinessDocument> => {
  if (!businessId || !logoUrl) {
    throw new ApiError(400, "Business ID, and Logo URL are required");
  }

  const uploadedLogo = await uploadOnCloudinary(logoUrl);
  const logo = {
    url: uploadedLogo?.secure_url,
    publicId: uploadedLogo?.public_id,
  };

  const business = await Business.findOneAndUpdate(
    { _id: businessId },
    { logo },
    { returnDocument: "after" },
  ).select("-isArchived -metadata");

  if (!business) {
    throw new ApiError(404, "Business not found or failed to update");
  }

  return business;
};
