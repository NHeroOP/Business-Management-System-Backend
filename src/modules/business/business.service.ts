import crypto from "crypto";
import slugify from "slugify";
import { startSession, type Types } from "mongoose";

import {
  Business,
  type IBusinessDocument,
} from "./Business.model.js";
import type {
  CreateBusinessInput,
  UpdateBusinessDetailsInput,
  UpdateBusinessLogoInput
} from "./business.validation.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { removeOnCloudinary, uploadOnCloudinary } from "@/shared/config/cloudinary.js";
import { BusinessMember } from "../business-member/BusinessMember.model.js";
import { BUSINESS_ROLE } from "@/consts.js";


type CreateBusinessPayload =
  CreateBusinessInput & {
    logoUrl?: string;
    createdBy: Types.ObjectId;
  };

type UpdateBusinessDetailsPayload =
  UpdateBusinessDetailsInput & {
    businessId: Types.ObjectId;
  };

type UpdateBusinessLogoPayload =
  UpdateBusinessLogoInput & {
    businessId: Types.ObjectId;
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


  const session = await startSession();
  session.startTransaction();

  let newBusiness: IBusinessDocument | undefined;
  
  try {
    
    [newBusiness] = await Business.create([{
      name,
      slug,
      createdBy,
      ...(logo && { logo }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(website && { website }),
      ...(description && { description }),
    }], { session });

    if (!newBusiness) {
      throw new ApiError(500, "Failed to create business");
    }
  
    await BusinessMember.create([{
      businessId: newBusiness._id,
      userId: createdBy,
      role: BUSINESS_ROLE.OWNER,
    }], { session });

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error.message || "Failed to create invoice",
          [],
          error instanceof Error ? error.stack : undefined,
        );
  } finally {
    await session.endSession();
  }
  

  return newBusiness;
};

export const findUserBusinesses = async (
  userId: Types.ObjectId
) => {
  const ownedBusinesses = await Business.find({
    createdBy: userId,
    isArchived: false
  }).select("name slug logo");


  const cleanedOwnedBusinesses = ownedBusinesses.map(business => ({
    _id: business._id,
    name: business.name,
    slug: business.slug,
    logo: business.logo,
    role: BUSINESS_ROLE.OWNER
  }));

  const memberBusinesses = await BusinessMember.find({
    userId,
    isArchived: false,
    role: { $ne: BUSINESS_ROLE.OWNER },
  }).populate<{
    businessId: Pick<IBusinessDocument, "_id" | "name" | "slug" | "logo">
  }>("role", {
    path: "businessId",
    select: "_id name slug logo"
  });

  const cleanedMemberBusinesses = memberBusinesses.map(member => {
    const business = member.businessId;
    return {
      _id: business._id,
      name: business.name,
      slug: business.slug,
      logo: business.logo,
      role: member.role
    }
  })

  const allBusinesses = [...cleanedOwnedBusinesses, ...cleanedMemberBusinesses];

  return allBusinesses;
}

export const findBusinessById = async (
  businessId: Types.ObjectId | string,
): Promise<IBusinessDocument> => {

  const business = await Business.findOne({
    _id: businessId,
    isArchived: false
  }).select("-isArchived -metadata");

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

  const business = await Business.findOneAndUpdate(
    { _id: businessId, isArchived: false },
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
}: UpdateBusinessLogoPayload): Promise<void> => {
  if (!logoUrl) {
    throw new ApiError(400, "Logo URL is required");
  }

  const uploadedLogo = await uploadOnCloudinary(logoUrl);
  const logo = {
    url: uploadedLogo?.secure_url,
    publicId: uploadedLogo?.public_id,
  };

  const business = await Business.findOneAndUpdate(
    { _id: businessId, isArchived: false },
    { logo },
  ).select("-isArchived -metadata");
  
  await removeOnCloudinary(business?.logo?.publicId);

  if (!business) {
    throw new ApiError(404, "Business not found or failed to update");
  }
};
