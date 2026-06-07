import { app } from "@/app.js";
import request from "supertest";
import { describe, it, expect } from "vitest";
import { createUser } from "@tests/factories/user.factory.js";

describe("POST /auth/refresh-token", () => {
  const endpoint = "/api/v1/auth/refresh-token";

  it("should issue new access token", async () => {
    const user = await createUser();
    const agent = request.agent(app);

    await agent
      .post("/api/v1/auth/login")
      .send({ identifier: user.email, password: "password123" });

    const res = await agent
      .post(endpoint)
    
    expect(res.status).toBe(200);
    
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
  })
  
  it("should reject invalid refresh token", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ refreshToken: "invalidtoken" });

    expect(res.status).toBe(401);
  })
})