import cors from "cors";
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import { apiReference } from "@scalar/express-api-reference";

import ENV from "./env.js";
import { openApiSpec } from "./docs/openapi.js";
import passport from "./shared/config/passport.js";
import { ApiResponse } from "./shared/utils/ApiResponse.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { globalLimiter } from "./shared/middlewares/rateLimit.middleware.js";

export const app = express();
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  helmet({
    strictTransportSecurity: ENV.NODE_ENV === 'production'
  })
)

app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);

app.use(express.static("public"));
app.use(cookieParser());
app.use(passport.initialize());
app.use(globalLimiter);

import userRouter from "./modules/user/user.route.js";
import authRouter from "./modules/auth/auth.route.js";
import clientRouter from "./modules/client/client.route.js";
import invoiceRouter from "./modules/invoice/invoice.route.js";
import paymentRouter from "./modules/payment/payment.route.js";
import productRouter from "./modules/product/product.route.js";
import businessRouter from "./modules/business/business.route.js";
import businessMemberRouter from "./modules/business-member/businessMember.route.js";
import analyticsRouter from "./modules/analytics/analytics.route.js";



app.use("/", (_req, res) => {
  res.redirect("/docs");
});

app.use("/docs", (_req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});
app.use(
  "/docs",
  apiReference({
    theme: "bluePlanet",
    metaData: {
      title: "Multi Tenant Business Management API Documentation",
      description: "Comprehensive documentation for the Multi Tenant Business Management API, detailing all available endpoints, request/response schemas, and authentication methods.",
    },
    spec: {
      content: openApiSpec(),
    }
  })
);

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json(new ApiResponse(
    200, {}, "API is healthy"
  ));
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/clients", clientRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/businesses", businessRouter);
app.use("/api/v1/business-members", businessMemberRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.use(errorHandler);