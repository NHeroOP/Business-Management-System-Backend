import { model, Schema, type HydratedDocument } from "mongoose";
import jwt, { type Secret, type SignOptions,  } from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface IUser {
  username: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  password?: string;
  refreshToken?: string;
  googleId?: string;

  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  isPasswordCorrect: (password: string) => Promise<boolean>;
}


export type IUserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatarUrl: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (): Promise<void> {
  if (!this.isModified("password")) return;

  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET!! as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY!!,
    } as SignOptions,
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET!! as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY!!,
    } as SignOptions,
  );
};

export const User = model<IUser>("User", userSchema);
