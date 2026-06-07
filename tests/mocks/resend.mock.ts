import { vi } from "vitest";


export const sendEmailMock = vi.fn();

vi.mock("@/shared/config/resend.js", () => ({
  default: {
    emails: {
      send: sendEmailMock.mockResolvedValue({
        data: {
          id: "email-id",
        },
        error: null,
      }),
    },
  },
}));