import crypto from "crypto";
import slugify from "slugify";
import type { Types } from "mongoose";

import {
  Business,
  type IBusiness,
  type IBusinessDocument,
} from "./Business.model.js";
import type {
  CreateBusinessInput,
  UpdateBusinessDetailsInput,
  UpdateBusinessLogoInput
} from "./business.validation.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";
import { BusinessMember } from "../business-member/BusinessMember.model.js";
import { BUSINESS_ROLE } from "@/consts.js";


type CreateBusinessPayload =
  CreateBusinessInput & {
    logoUrl?: string;
    createdBy: Types.ObjectId;
  };

type UpdateBusinessDetailsPayload =
  UpdateBusinessDetailsInput & {
    businessId: Types.ObjectId | string;
  };

type UpdateBusinessLogoPayload =
  UpdateBusinessLogoInput & {
    businessId: Types.ObjectId | string;
  };

export const createBusiness = async ({
  createdBy,
  logoUrl,
  ...payload
}: CreateBusinessPayload): Promise<IBusinessDocument> => {
  if (!createdBy) {
    throw new ApiError(401, "Unauthorized");
  }

  const { name, email, phone, address, website, description } = payload;

  if (!name || name?.trim() === "") {
    throw new ApiError(400, "Business name is required");
  }

  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
  const suffix = crypto.randomBytes(2).toString("hex");
  

  const slug = `${baseSlug}-${suffix}`;

  const uploadedLogo = logoUrl ? await uploadOnCloudinary(logoUrl) : undefined;
  const logo = uploadedLogo && {
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

  const member = await BusinessMember.create({
    businessId: newBusiness._id,
    userId: createdBy,
    role: BUSINESS_ROLE.OWNER,
  });

  if (!member) {
    throw new ApiError(500, "Failed to create business member");
  }

  return newBusiness;
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
