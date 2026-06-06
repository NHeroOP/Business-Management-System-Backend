import { createHash } from "crypto";
import type { Types } from "mongoose";

import { User } from "../user/User.model.js";
import { ApiError } from "@/shared/utils/ApiError.js";


export const generateTokens = async (
  userId: Types.ObjectId | string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Error while generating tokens");
  }
};

export const hashData = (data: string): string => {
  return createHash('sha256')
    .update(data)
    .digest('hex');
};