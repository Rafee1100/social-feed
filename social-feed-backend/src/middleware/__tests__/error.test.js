import { jest } from "@jest/globals";
import { createError, errorHandler } from "../error.js";
import { createMockRes, createNext } from "../../../test/httpMocks.js";

describe("error middleware", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("createError attaches statusCode", () => {
    const err = createError(418, "nope");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("nope");
  });

  it("errorHandler returns 409 for duplicate key errors", () => {
    const err = new Error("dup");
    err.code = 11000;
    err.keyValue = { email: "x@y.com" };

    const req = {};
    const res = createMockRes();
    const next = createNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already in use." });
    expect(console.error).toHaveBeenCalled();
  });
});
