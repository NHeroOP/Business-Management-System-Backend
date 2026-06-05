import { beforeAll, beforeEach, afterAll } from "vitest";
import { connectTestDatabase, clearDatabase, closeDatabase } from "./database.js";

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});