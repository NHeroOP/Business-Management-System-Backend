import { beforeAll, beforeEach, afterAll, vi } from "vitest";
import { connectTestDatabase, clearDatabase, closeDatabase } from "./database.js";

import "@tests/mocks/cloudinary.mock.js";
import "@tests/mocks/resend.mock.js";
import "@tests/mocks/bcrypt.mock.js";

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  vi.clearAllMocks();
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});