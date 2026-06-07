import { app } from "@/app.js";
import request from "supertest"
import { describe, it, expect } from "vitest";
import { createUserPayload } from "../../factories/user.factory.js";

describe("POST /auth/register", () => { 
  it("should create a user", async () => {
    const payload = createUserPayload();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .field("username", payload.username)
      .field("name", payload.name)
      .field("email", payload.email)
      .field("password", payload.password)
      .attach("avatarUrl", "tests/fixtures/avatar.jpg");
    
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("email", payload.email.toLowerCase());
    expect(res.body.data).not.toHaveProperty("password")
  });
  
  it("should reject duplicate email", async () => {
    const existingUser = createUserPayload();
    await request(app)
      .post("/api/v1/auth/register")
      .field("username", existingUser.username)
      .field("name", existingUser.name)
      .field("email", existingUser.email)
      .field("password", existingUser.password)
      .attach("avatarUrl", "tests/fixtures/avatar.jpg");
    const duplicateUser = createUserPayload();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .field("username", duplicateUser.username)
      .field("name", duplicateUser.name)
      .field("email", existingUser.email)
      .field("password", duplicateUser.password)
      .attach("avatarUrl", "tests/fixtures/avatar.jpg");
    
    expect(res.status).toBe(409);
  });
  
  it("should reject duplicate username", async () => {
    const existingUser = createUserPayload();
    await request(app)
      .post("/api/v1/auth/register")
      .field("username", existingUser.username)
      .field("name", existingUser.name)
      .field("email", existingUser.email)
      .field("password", existingUser.password)
      .attach("avatarUrl", "tests/fixtures/avatar.jpg");
    
    const duplicateUser = createUserPayload();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .field("username", existingUser.username)
      .field("name", duplicateUser.name)
      .field("email", duplicateUser.email)
      .field("password", duplicateUser.password)
      .attach("avatarUrl", "tests/fixtures/avatar.jpg");
    
    expect(res.status).toBe(409);
  });

});