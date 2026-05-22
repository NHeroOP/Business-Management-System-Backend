import type { Request, Response } from "express";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";

import {
  forgotPasswordService,
  getCurrentUserService,
  loginUserService,
  logoutUserService,
  refreshAccessTokenService,
  registerUserService,
  resetPasswordService
} from "./auth.service.js";
import { generateTokens } from "./auth.util.js";
import { cookieOptions } from "./auth.const.js";


export const registerUser = asyncHandler( async (req: Request, res: Response) => {
  const files = req.files as {
    avatarUrl?: Express.Multer.File[];
  };

  if (!files || !files.avatarUrl || files.avatarUrl.length === 0) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatarLocalPath = files.avatarUrl[0]?.path;

  const createdUser = await registerUserService({
    body: req.body,
    avatarLocalPath
  })

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { userData, accessToken, refreshToken } = await loginUserService({ body: req.body });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: userData,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  await logoutUserService(userId);

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  const { accessToken, refreshToken } = await refreshAccessTokenService({
    incomingRefreshToken,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access token refreshed successfully",
      ),
    );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => { 
  await forgotPasswordService(req.body.email);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset email sent successfully"));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => { 
  const { token, userId, newPassword } = req.body;

  await resetPasswordService({ token, userId, newPassword });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await getCurrentUserService(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});


export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      user,
    });
});
