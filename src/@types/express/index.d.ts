import type { IUserDocument } from "../../models/User.model.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUserDocument;
  }
}

export {};