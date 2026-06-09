import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import {
  createUser,
  createBusiness,
  createClientPayload
} from "@tests/factories/index.js";

describe("POST /clients", async () => {

  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument; 
  let business: IBusinessDocument;

  beforeEach(async () => {
    agent = request.agent(app);
    user = await createUser();
    business = await createBusiness({ createdBy: user._id });
  })

  const endpoint = "/api/v1/clients";

  it("should create client", async () => {
    await agent.post("/api/v1/auth/login")
      .send({ identifier: user.email, password: "password123" })

    const payload = createClientPayload();
    const res = await agent
      .post(endpoint)
      .send(payload)
      .set({"x-business-id": business._id.toString()})
    
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toMatchObject({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      businessId: business._id.toString(),
    });
  })
  
  it("should require authentication", async () => {
    const payload = createClientPayload();
    const res = await request(app)
      .post(endpoint)
      .send(payload)
      .set({"x-business-id": business._id.toString()})
    
    expect(res.status).toBe(401);
  })
  
  it("should require workspace access", async () => {
    const otherUser = await createUser();
    await agent.post("/api/v1/auth/login")
      .send({ identifier: otherUser.email, password: "password123" })

    const payload = createClientPayload();
    const res = await agent
      .post(endpoint)
      .send(payload)
      .set({"x-business-id": business._id.toString()})
    
    expect(res.status).toBe(403);
  })
})