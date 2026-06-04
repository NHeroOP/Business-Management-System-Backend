import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import ENV from "@/env.js";
import { User } from "@/modules/user/User.model.js";


export const verifyJWT = asyncHandler(
  async (req: Request, _: Response, next: NextFunction) => {
    try {
      const accessToken =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!accessToken) {
        throw new ApiError(401, "Access token is missing");
      }

      const decodedToken = jwt.verify(
        accessToken,
        ENV.ACCESS_TOKEN_SECRET,
      ) as JwtPayload;

      const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken",
      );

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      };
      next();
    } catch (error: any) {
      throw new ApiError(401, "Invalid Access Token");
    }
  },
);
