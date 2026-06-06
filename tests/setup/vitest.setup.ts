import { beforeAll, beforeEach, afterAll } from "vitest";
import { connectTestDatabase, clearDatabase, closeDatabase } from "./database.js";

import "../mocks/cloudinary.mock.js";

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});