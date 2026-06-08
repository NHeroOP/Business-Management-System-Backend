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
  createProduct,
} from "@tests/factories/index.js";

describe("GET /products/:id", () => {
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

  it("should return product", async () => {
    const product = await createProduct({
      businessId: business._id,
      createdBy: user._id,
    });

    const res = await agent.get(`/api/v1/products/${product._id}`)
      .set({ "x-business-id": business._id.toString() });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data._id).toBe(product._id.toString());
  })
  
  it("should reject cross-business access", async () => {
    const anotherBusiness = await createBusiness({ createdBy: user._id });
    const product = await createProduct({
      businessId: anotherBusiness._id,
      createdBy: user._id,
    });

    const res = await agent.get(`/api/v1/products/${product._id}`)
      .set({ "x-business-id": business._id.toString() });
    
    expect(res.status).toBe(404);
  })
})