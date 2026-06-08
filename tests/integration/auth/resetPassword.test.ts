import { app } from "@/app.js";
import request from "supertest";
import { describe, it, expect } from "vitest";
import { createUser } from "@tests/factories/index.js";
import { User, type IUserDocument } from "@/modules/user/User.model.js";
import { sendEmailMock } from "@tests/mocks/resend.mock.js";


const generateResetToken = async (user: IUserDocument) => {
  await request(app).
    post("/api/v1/auth/forgot-password")
    .send({ email: user.email });
  
  const emailCall = sendEmailMock.mock.calls[0]![0];
  const resetLink = emailCall.template.variables.RESET_LINK;
  const url = new URL(resetLink);
  const token = url.searchParams.get("token");

  return token;
}

describe("POST /auth/reset-password", () => {
  const endpoint = "/api/v1/auth/reset-password";

  it("should reset password", async () => {
    const user = await createUser();
    const token = await generateResetToken(user);
    
    const res = await request(app)
      .post(endpoint)
      .send({
        token,
        userId: user._id,
        newPassword: "newpass123",
      })
    
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.passwordResetToken).toBeFalsy();
    expect(updatedUser?.passwordResetTokenExpiry).toBeFalsy();
    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        identifier: user.email,
        password: "newpass123",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty("accessToken");
    expect(loginRes.body.data).toHaveProperty("refreshToken");
    expect(loginRes.body.message).toBe("User logged in successfully");
  })
  
  
  it("should reject expired token", async () => {
    const user = await createUser();
    const token = await generateResetToken(user);
    
    await User.updateOne(
      { _id: user._id },
      { passwordResetTokenExpiry: new Date(Date.now() - 1000) }
    )

    const res = await request(app)
      .post(endpoint)
      .send({
        token,
        userId: user._id,
        newPassword: "newpass123",
      })
    
    expect(res.status).toBe(400);
  })
  
  it("should reject invalid token", async () => {
    const user = await createUser();
    await request(app).
      post("/api/v1/auth/forgot-password")
      .send({ email: user.email });
    
    const res = await request(app)
      .post(endpoint)
      .send({
        token: "invalid-token",
        userId: user._id,
        newPassword: "newpass123",
      })
    
    expect(res.status).toBe(400);
  })
});

