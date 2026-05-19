import type { IUserDocument } from "../../../models/User.model.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUserDocument;
  }
}

export {};
