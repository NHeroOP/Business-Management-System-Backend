import { model, Schema, type HydratedDocument } from "mongoose";
import jwt, { type Secret, type SignOptions,  } from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface IUser {
  username: string;
  name: string;
  email: string;
  password?: string;
  refreshToken?: string;
  googleId?: string;

    avatar?: {
    url?: string;
    publicId?: string;
  };

  provider: "local" | "google";

  isVerified: boolean;
  isArchived: boolean;

  lastLoginAt?: Date;

  metadata?: Record<string, unknown>;

  passwordResetToken?: string | undefined;
  passwordResetTokenExpiry?: Date | undefined;

  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  isPasswordCorrect: (password: string) => Promise<boolean>;
}


const avatarSchema = new Schema(
  {
    url: String,
    publicId: String,
  },
  { _id: false }
);

export type IUserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
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

    avatar: avatarSchema,

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    passwordResetToken: String,
    passwordResetTokenExpiry: Date
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
      name: this.name,
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
