import type { Types } from "mongoose";

import { User } from "./User.model.js";
import type { ChangePasswordInput, UpdateProfileInput, UserIdParam } from "./user.validation.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";


type UpdateUserProfileServicePayload = UpdateProfileInput & { 
  userId: Types.ObjectId
}

type ChangePasswordServicePayload = ChangePasswordInput & {
  userId: Types.ObjectId
}

interface UpdateUserAvatarServiceInput {
  userId: Types.ObjectId;
  avatarLocalPath: string | undefined;
}

export const getUserProfile = async (
  userId: Types.ObjectId
) => { 
  if (!userId) { 
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId).select(
    "-password -refreshToken -passwordResetToken -passwordResetTokenExpiry -googleId"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;

};

export const updateUserProfile = async (
  { userId, name }: UpdateUserProfileServicePayload
) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  if (!name) {
    throw new ApiError(400, "Full name is required");
  }

  const user = await User
    .findByIdAndUpdate(userId, {
      $set: { name }
    }, { returnDocument: "after" })
    .select("-password -refreshToken -passwordResetToken -passwordResetTokenExpiry -googleId");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const changeUserPassword = async (
  { userId, currentPassword, newPassword }: ChangePasswordServicePayload
) => { 
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isCurrentPasswordCorrect) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;

  await user.save();
};

export const updateUserAvatar = async (
  { userId, avatarLocalPath }: UpdateUserAvatarServiceInput
) => { 
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  if (!avatarLocalPath) {
     throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const user = await User
    .findByIdAndUpdate(userId, {
      $set: {
        avatar: {
          url: avatar.secure_url,
          publicId: avatar.public_id,
        }
      }
    }, { returnDocument: "after" })
    .select("-password -refreshToken -passwordResetToken -passwordResetTokenExpiry -googleId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const findUserById = async (
  userId: UserIdParam["userId"]
) => { 
  if (!userId) { 
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId).select(
    "-password -refreshToken -passwordResetToken -passwordResetTokenExpiry -googleId"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};