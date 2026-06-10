import "dotenv/config";
import * as z from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  BASE_URL: z.string().default("http://localhost:3000"),
  PORT: z.coerce.number().default(8000),
  CORS_ORIGIN: z.string().default("*"),

  MONGODB_URI: z.string(),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),

  ACCESS_TOKEN_EXPIRY: z.string(),
  REFRESH_TOKEN_EXPIRY: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.url().default("http://localhost:3000/api/v1/auth/google/callback"),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  RESEND_API_KEY: z.string(),

  PUPPETEER_EXECUTABLE_PATH: z.string().default("/usr/bin/chromium-browser"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.prettifyError(parsed.error)
  );

  process.exit(1);
}

const ENV = parsed.data;

export default ENV;