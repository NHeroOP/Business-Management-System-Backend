import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  
    if (!accessToken) {
      throw new ApiError(401, "Access token is missing");
    }
  
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!!) as JwtPayload;
  
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
  
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    
    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiError(401,  error?.message || "Invalid Access Token");
  }
})