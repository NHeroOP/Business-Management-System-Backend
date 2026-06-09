import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import { app } from "@/app.js";
import type { IUserDocument } from "@/modules/user/User.model.js";
import type { IClientDocument } from "@/modules/client/Client.model.js";
import type { IBusinessDocument } from "@/modules/business/Business.model.js";
import {
  createBusiness,
  createClient,
  createInvoicePayload,
} from "@tests/factories/index.js";

describe("POST /invoices", () => {
  let agent: ReturnType<typeof request.agent>;
  let user: IUserDocument; 
  let business: IBusinessDocument;
  let payload: Awaited<ReturnType<typeof createInvoicePayload>>["payload"];

  beforeEach(async () => {
    const data = await createInvoicePayload();
    user = data.user;
    business = data.business;
    payload = data.payload;
    
    agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({
      identifier: user.email,
      password: "password123",
    });
  })

  it("should create invoice", async () => {
    const res = await agent.post("/api/v1/invoices")
      .set({"x-business-id": business._id.toString()})
      .send(payload);
    
    expect(res.status).toBe(201);
  })

  it("should reject missing client", async () => {
    const res = await agent.post("/api/v1/invoices")
      .set({"x-business-id": business._id.toString()})
      .send({ items: payload.items });
    
    expect(res.status).toBe(400);
  })

  it ("should not create invoice for client from another business", async () => {
    const anotherBusiness = await createBusiness({
      createdBy: user._id,
    });
    const anotherClient = await createClient({
      businessId: anotherBusiness._id,
      createdBy: user._id,
    });

    const res = await agent.post("/api/v1/invoices")
      .set({"x-business-id": business._id.toString()})
      .send({ items: payload.items, clientId: anotherClient._id });
    
    expect(res.status).toBe(400);
  })
})