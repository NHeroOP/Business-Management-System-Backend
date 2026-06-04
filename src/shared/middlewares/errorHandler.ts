import { ZodError } from "zod";
import type { ErrorRequestHandler } from "express";

import { ApiError } from "../utils/ApiError.js";
import ENV from "@/env.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      ...(ENV.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(ENV.NODE_ENV === "development" && {
      stack: error instanceof Error ? error.stack : undefined,
    }),
  });
};