import { app } from "@/app.js";
import request from "supertest"
import { describe, it, expect } from "vitest";
import { createUser } from "@tests/factories/user.factory.js";

describe("POST /auth/login", () => { 
  const endpoint = "/api/v1/auth/login";

  it("should login successfully", async () => {
    const user = await createUser();

    const res = await request(app)
      .post(endpoint)
      .send({
        identifier: user.email,
        password: "password123",
      })
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("user.email", user.email.toLowerCase());
    expect(res.body.data).not.toHaveProperty("user.password");
  });

  it("should reject invalid email", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({
        identifier: "invalid@example.com",
        password: "password123",
      })
    
    expect(res.status).toBe(401);
  });

  it("should reject invalid password", async () => {
    const user = await createUser();

    const res = await request(app)
      .post(endpoint)
      .send({
        identifier: user.email,
        password: "wrongpassword",
      })
    
    expect(res.status).toBe(401);
  });
})