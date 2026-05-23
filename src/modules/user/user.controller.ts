import type { Request, Response } from "express";

import {
  changeUserPassword,
  findUserById,
  getUserProfile,
  updateUserAvatar,
  updateUserProfile
} from "./user.service.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";


export const getMyProfile = asyncHandler(async (req: Request, res: Response) => { 
  const user = await getUserProfile(req?.user?._id);

  return res.status(200).json(
    new ApiResponse(200, user, "User profile retrieved successfully")
  );
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => { 
  const { name } = req.body;

  const user = await updateUserProfile({ userId: req?.user?._id, name });

  return res.status(200).json(
    new ApiResponse(200, user, "User profile updated successfully")
  );
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => { 
  const { currentPassword, newPassword } = req.body;

  await changeUserPassword({ userId: req?.user?._id, currentPassword, newPassword });

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  );
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => { 
  const files = req.files as {
    avatarUrl?: Express.Multer.File[];
  };

  if (!files || !files.avatarUrl || files.avatarUrl.length === 0) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatarLocalPath = files.avatarUrl[0]?.path;

  await updateUserAvatar({ userId: req?.user?._id, avatarLocalPath });
  return res.status(200).json(
    new ApiResponse(200, {}, "Avatar updated successfully")
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => { 
  const user = await findUserById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, user, "User profile retrieved successfully")
  );
});