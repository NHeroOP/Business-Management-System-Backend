import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import { BUSINESS_ROLE } from "@/consts.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import {
  createUser,
  createBusiness,
  createBusinessMember,
  createClient,
} from "@tests/factories/index.js";
import { Client } from "@/modules/client/Client.model.js";

describe("PATCH /clients/:id", () => {
  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument; 
  let business: IBusinessDocument;

  beforeEach(async () => {
    agent = request.agent(app);
    user = await createUser();
    business = await createBusiness({ createdBy: user._id });
    await createBusinessMember({
      userId: user._id,
      businessId: business._id,
      role: BUSINESS_ROLE.OWNER
    })

    await agent.post("/api/v1/auth/login")
      .send({ identifier: user.email, password: "password123" })
  })

  it("should update client", async () => {
    const client = await createClient({
      businessId: business._id,
      createdBy: user._id,
    })

    const res = await agent.patch(`/api/v1/clients/${client._id.toString()}`)
      .send({ name: "New Name" })
      .set({"x-business-id": business._id.toString()})
    
    expect(res.status).toBe(200);

    const updatedClient = await Client.findById(client._id);
    expect(updatedClient).not.toBeNull();
    expect(updatedClient!.name).toBe("New Name");
  })

  it("should reject cross-business update", async () => {
    const anotherBusiness = await createBusiness({ createdBy: user._id });
    const client = await createClient({
      businessId: anotherBusiness._id,
      createdBy: user._id,
    })

    const res = await agent.patch(`/api/v1/clients/${client._id.toString()}`)
      .send({ name: "New Name" })
      .set({"x-business-id": business._id.toString()})
    
    expect(res.status).toBe(404);

    const unchangedClient = await Client.findById(client._id);
    expect(unchangedClient).not.toBeNull();
    expect(unchangedClient!.name).not.toBe("New Name");
  })
})