import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { Types } from "mongoose";
import { User } from "../models/User.model.js";

import { uploadOnCloudinary } from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import resend from '../config/resend.js';
import { VERIFICATION_EMAIL_TEMPLATE_ID } from "../consts.js";


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

const generateTokens = async (userId: Types.ObjectId | string): Promise<{ accessToken: string; refreshToken: string }> => {
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
    console.log(err)
    throw new ApiError(500, "Error while generating tokens");
  }
}

export const registerUser = asyncHandler(async (req: Request, res: Response) => {

  const { username, email, fullName, password } = req.body;
  
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (userExists) {
    throw new ApiError(409, "User with the same username or email already exists");
  }


  const files = req.files as {
    avatarUrl?: Express.Multer.File[];
  };

  if (!files || !files.avatarUrl || files.avatarUrl.length === 0) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatarLocalPath = files.avatarUrl[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const user = await User.create({
    fullName,
    avatarUrl: avatar.url,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Error while creating user");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  )

});


export const loginUser = asyncHandler(async (req: Request, res: Response) => {

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  } 
  
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  if (!user.password) {
    throw new ApiError(400, "User registered with Google. Please login with Google");
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
    avatarUrl: user.avatarUrl,
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, {
        user: userData,
        accessToken,
        refreshToken
      }, "User logged in successfully")
    );
})


export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 }
  }, { returnDocument: "after" });  

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)  
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
})

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!!) as JwtPayload;
  
    const user = await User.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }
    
    if (user.refreshToken !== incomingRefreshToken) { 
      throw new ApiError(401, "Invalid refresh token");
    }
  
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);
    
    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(200, {
          accessToken,
          refreshToken: newRefreshToken,
        }, "Access token refreshed successfully"
        )
      );
  } catch (err: any) {
    throw new ApiError(401, err?.message || "Invalid refresh token");
  }
})

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  const { accessToken, refreshToken } =
    await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      user,
    });
});



export const sendEmail = asyncHandler(async (req: Request, res: Response) => { 
  const { email, username, verifyToken } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Test <send@noreply.nhero.me>',
      to: email,
      subject: "Test Verification Code",
      template: {
        id: VERIFICATION_EMAIL_TEMPLATE_ID,
        variables: {
          otp: verifyToken,
        },
      },
    });

    console.log(data)

    if (error) {
      throw new ApiError(500, error.message || "Failed to send verification email");
    }
    
    return res.status(200).json(
      new ApiResponse(200, data, "Verification email sent successfully")
    )
  } 
  catch (err: any) {
    throw new ApiError(500, err.message || "Failed to send verification email");
  }
});
