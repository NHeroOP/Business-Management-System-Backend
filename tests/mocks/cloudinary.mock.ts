import fs from "fs";
import { vi } from "vitest";

vi.mock("@/shared/config/cloudinary.js", () => ({
  uploadOnCloudinary: vi.fn().mockImplementation(
    async (localFilePath: string) => {
      if (
        localFilePath &&
        fs.existsSync(localFilePath)
      ) {
        fs.unlinkSync(localFilePath);
      }

      return cloudinaryMockRes;
    }
  ),
}));


export const cloudinaryMockRes = {
  secure_url: "https://placehold.co/600x400.png",
  public_id: "sample_public_id",
}