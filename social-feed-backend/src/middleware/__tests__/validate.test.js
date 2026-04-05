import { z } from "zod";
import { validateBody } from "../validate.js";
import { createMockRes, createNext } from "../../../test/httpMocks.js";

describe("validateBody (zod)", () => {
  it("returns 400 with issues when body is invalid", () => {
    const schema = z.object({
      name: z.string().min(1, "Name required"),
    });

    const req = { body: { name: "" } };
    const res = createMockRes();
    const next = createNext();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "name", message: "Name required" }),
        ]),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("parses and replaces req.body, then calls next() when valid", () => {
    const schema = z.object({
      email: z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
    });

    const req = { body: { email: "USER@EXAMPLE.COM" } };
    const res = createMockRes();
    const next = createNext();

    validateBody(schema)(req, res, next);

    expect(req.body).toEqual({ email: "user@example.com" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
