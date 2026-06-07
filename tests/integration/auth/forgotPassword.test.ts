import { app } from "@/app.js";
import request from "supertest";
import { describe, it, expect } from "vitest";
import { createUser } from "@tests/factories/user.factory.js";
import { sendEmailMock } from "@tests/mocks/resend.mock.js";
import { User } from "@/modules/user/User.model.js";


describe("POST /auth/forgot-password", () => { 
  const endpoint = "/api/v1/auth/forgot-password";
  it("should generate reset token", async () => {
    const user = await createUser();

    const res = await request(app)
      .post(endpoint)
      .send({ email: user.email })
    
    expect(res.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalled();

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.passwordResetToken).toBeDefined();
    expect(updatedUser?.passwordResetTokenExpiry).toBeDefined();
  })

  it("should not reveal whether user exists", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ email: "unknown@example.com" })
    
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  })
});