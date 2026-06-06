import { app } from "@/app.js";
import request from "supertest"
import { describe, it, expect } from "vitest";
import { createUserPayload } from "../../factories/user.factory.js";

describe("POST /auth/register", () => { 
  let userData: ReturnType<typeof createUserPayload>;

  it("should register a new user with valid data", async () => {
    const payload = createUserPayload();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .field("username", payload.username)
      .field("name", payload.name)
      .field("email", payload.email)
      .field("password", payload.password)
      .attach("avatarUrl", "tests/fixtures/avatar.jpg");
    
    userData = res.body.data;
    
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("email", payload.email.toLowerCase());
    expect(res.body.data).not.toHaveProperty("password")
  });

});