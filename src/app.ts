import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./shared/config/passport.js";

export const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

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

import authRouter from "./modules/auth/auth.route.js";
import clientRouter from "./modules/client/client.route.js";
import businessRouter from "./modules/business/business.route.js";
import businessMemberRouter from "./modules/business-member/businessMember.route.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/clients", clientRouter);
app.use("/api/v1/businesses", businessRouter);
app.use("/api/v1/business-members", businessMemberRouter);