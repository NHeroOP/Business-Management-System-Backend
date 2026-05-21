import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";
import { User } from "../user/User.model.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";
import { generateTokens } from "./auth.util.js";

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