import { vi } from "vitest";

vi.mock("bcrypt", async (importOriginal) => {
  const bcrypt = await importOriginal<typeof import("bcrypt")>();
  return {
    ...bcrypt,
    hash: (data: string) => bcrypt.hash(data, 1),
  };
});