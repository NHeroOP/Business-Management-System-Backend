import { vi } from "vitest";

vi.mock("@/shared/config/cloudinary.js", () => ({
  uploadOnCloudinary: vi.fn().mockResolvedValue({
    secure_url: "https://placehold.co/600x400.png",
    public_id: "sample_public_id",
  }),
}));


export const cloudinaryMockRes = {
  secure_url: "https://placehold.co/600x400.png",
  public_id: "sample_public_id",
}