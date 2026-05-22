import crypto from 'crypto';
import type { Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { User } from "../user/User.model.js";
import { generateTokens, hashData } from "./auth.util.js";
import { PASSWORD_RESET_EMAIL_TEMPLATE_ID } from "./auth.const.js";

import resend from "@/shared/config/resend.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";


interface RegisterUserServiceInput {
  body: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  };

  avatarLocalPath?: string | undefined;
}

interface LoginUserServiceInput {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

interface RefreshAccessTokenServiceInput {
  incomingRefreshToken: string;
}

interface ResetPasswordServiceInput {
  token: string;
  userId: string;
  newPassword: string;
}


export const registerUserService = async ({ body, avatarLocalPath }: RegisterUserServiceInput) => {
  const { username, email, fullName, password } = body;
  if (
    [fullName, email, username, password].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    throw new ApiError(
      409,
      "User with the same username or email already exists",
    );
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const user = await User.create({
    fullName,
    avatar: {
      url: avatar.secure_url,
      publicId: avatar.public_id,
    },
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Error while creating user");
  }

  return createdUser;
};


export const loginUserService = async ({ body }: LoginUserServiceInput) => { 
  const { username, email, password } = body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password) {
    throw new ApiError(
      400,
      "User registered with Google. Please login with Google",
    );
  }

  const isPassValid: boolean = await user.isPasswordCorrect(password);
  if (!isPassValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const userData = {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
  
  return { userData, accessToken, refreshToken };
};


export const logoutUserService = async (userId: Types.ObjectId | undefined) => {

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $unset: { refreshToken: 1 },
    },
    { returnDocument: "after" },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
}

export const refreshAccessTokenService = async ({
  incomingRefreshToken,
}: RefreshAccessTokenServiceInput) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  let decodedToken: JwtPayload;

  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as JwtPayload;
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(
      401,
      "Invalid refresh token - user not found",
    );
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const { accessToken, refreshToken } =
    await generateTokens(user._id.toString());

  return {
    accessToken,
    refreshToken,
  };
};

export const forgotPasswordService = async (email: string) => {
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const rawPasswordResetToken = crypto.randomBytes(32).toString('hex'); 
  const hashedPasswordResetToken = hashData(rawPasswordResetToken);

  user.passwordResetToken = hashedPasswordResetToken;
  user.passwordResetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  const rootUrl = process.env.NODE_ENV === "production" ? process.env.BASE_URL : "http://localhost:3000";
  const resetLink = `${rootUrl}/reset-password?token=${rawPasswordResetToken}&userId=${user._id}`;


  try {
    const { data, error } = await resend.emails.send({
      from: "NHero <send@noreply.nhero.me>",
      to: email,
      subject: "Password Reset Request",
      template: {
        id: PASSWORD_RESET_EMAIL_TEMPLATE_ID,
        variables: {
          RESET_LINK: resetLink,
        },
      },
    });

    if (error) {
      throw new ApiError(500, "Error while sending password reset email");
    }

    return data;
  }
  catch (error) {
    throw new ApiError(500, "Error while sending password reset email");
  }
  
};

export const resetPasswordService = async (
  { token, userId, newPassword }: ResetPasswordServiceInput
) => { 
  if (!token || !userId || !newPassword) {
    throw new ApiError(400, "Token, user ID and new password are required");
  }

  const hashedToken = hashData(token);

  const user = await User.findOne({
    _id: userId,
    passwordResetToken: hashedToken
  })

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
    throw new ApiError(400, "Password reset token has expired");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiry = undefined;

  await user.save();
};

export const getCurrentUserService = async (userId: Types.ObjectId | undefined) => { 
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
}

