import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import passport from "./shared/config/passport.js";


export const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  helmet({
    strictTransportSecurity: process.env.NODE_ENV === 'production'
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

import userRouter from "./modules/user/user.route.js";
import authRouter from "./modules/auth/auth.route.js";
import clientRouter from "./modules/client/client.route.js";
import invoiceRouter from "./modules/invoice/invoice.route.js";
import paymentRouter from "./modules/payment/payment.route.js";
import productRouter from "./modules/product/product.route.js";
import businessRouter from "./modules/business/business.route.js";
import businessMemberRouter from "./modules/business-member/businessMember.route.js";
import helmet from "helmet";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/clients", clientRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/businesses", businessRouter);
app.use("/api/v1/business-members", businessMemberRouter);