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
  createProductPayload,
} from "@tests/factories/index.js";

describe("POST /products", () => {
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

  })

  const endpoint = "/api/v1/products";

  it("should create product", async () => {
    await agent.post("/api/v1/auth/login")
      .send({ identifier: user.email, password: "password123" })

    const payload = createProductPayload();
  
    const res = await agent.post(endpoint)
      .set({ "x-business-id": business._id.toString() })
      .field("name", payload.name)
      .field("price", payload.price)
      .field("type", payload.type)
      .field("stockQuantity", payload.stockQuantity)
      .attach("imageUrl", "tests/fixtures/product.jpg");
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.name).toBe(payload.name);
  })
  
  it("should not create product if user is not a business member", async () => {
    const anotherUser = await createUser();
    await agent.post("/api/v1/auth/login")
      .send({ identifier: anotherUser.email, password: "password123" })
    
    const payload = createProductPayload();
    const res = await agent.post(endpoint)
      .set({ "x-business-id": business._id.toString() })
      .field("name", payload.name)
      .field("price", payload.price)
      .field("type", payload.type)
      .field("stockQuantity", payload.stockQuantity)
      .attach("imageUrl", "tests/fixtures/product.jpg");
    
    expect(res.status).toBe(403);
  })
})