import type { IUserDocument } from "@/modules/user/User.model.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUserDocument;
  }
}

export {};
