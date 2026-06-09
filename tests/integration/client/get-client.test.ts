import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import {
  createUser,
  createBusiness,
  createClient,
} from "@tests/factories/index.js";

describe("GET /clients/:id", () => {
  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument; 
  let business: IBusinessDocument;

  beforeEach(async () => {
    agent = request.agent(app);
    user = await createUser();
    business = await createBusiness({ createdBy: user._id });

    await agent.post("/api/v1/auth/login")
      .send({ identifier: user.email, password: "password123" })
  })

  it("should return client", async () => {
    const client = await createClient({
      businessId: business._id,
      createdBy: user._id,
    })

    const res = await agent.get(`/api/v1/clients/${client._id.toString()}`)
      .set({"x-business-id": business._id.toString()})
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toMatchObject({
      name: client.name,
      email: client.email,
      phone: client.phone,
      businessId: business._id.toString(),
    });
  })
  it("should not access another business client", async () => {
    const anotherBusiness = await createBusiness({ createdBy: user._id });
    const client = await createClient({
      businessId: anotherBusiness._id,
      createdBy: user._id,
    })

    const res = await agent.get(`/api/v1/clients/${client._id.toString()}`)
      .set({"x-business-id": business._id.toString()})
    
    expect(res.status).toBe(404);
  })
})