import type { Types } from "mongoose";

import { User } from "./User.model.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";


interface UpdateUserProfileServiceInput { 
  userId: Types.ObjectId | undefined;
  fullName: string;
}

interface ChangePasswordServiceInput {
  userId: Types.ObjectId | undefined;
  currentPassword: string;
  newPassword: string;
}

interface UpdateUserAvatarServiceInput {
  userId: Types.ObjectId | undefined;
  avatarLocalPath: string | undefined;
}

export const getUserProfile = async (userId: Types.ObjectId | undefined) => { 
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

export const updateUserProfile = async ({ userId, fullName }: UpdateUserProfileServiceInput) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  if (!fullName) {
    throw new ApiError(400, "Full name is required");
  }

  const user = await User
    .findByIdAndUpdate(userId, {
      $set: { fullName }
    }, { returnDocument: "after" })
    .select("-password -refreshToken -passwordResetToken -passwordResetTokenExpiry -googleId");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const changeUserPassword = async ({ userId, currentPassword, newPassword }: ChangePasswordServiceInput) => { 
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

export const updateUserAvatar = async ({ userId, avatarLocalPath }: UpdateUserAvatarServiceInput) => { 
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

export const findUserById = async (userId: string | string[] | undefined) => { 
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