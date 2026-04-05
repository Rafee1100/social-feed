import { jest } from "@jest/globals";
import { createMockRes, createNext } from "../../../test/httpMocks.js";

const User = {
  findById: jest.fn(),
  updateOne: jest.fn(),
};

const jwtUtils = {
  verifyAccessToken: jest.fn(),
  clearAuthCookies: jest.fn(),
  ACCESS_COOKIE: "accessToken",
};

jest.unstable_mockModule("../../models/User.js", () => ({ default: User }));
jest.unstable_mockModule("../../utils/jwt.js", () => jwtUtils);

const { protect } = await import("../auth.js");

describe("protect middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.updateOne.mockReturnValue(Promise.resolve());
  });

  it("returns 401 when access token cookie is missing", async () => {
    const req = { cookies: {} };
    const res = createMockRes();
    const next = createNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authenticated. Please log in." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    const req = { cookies: { accessToken: "bad" } };
    const res = createMockRes();
    const next = createNext();

    jwtUtils.verifyAccessToken.mockImplementationOnce(() => {
      const err = new Error("bad token");
      err.name = "JsonWebTokenError";
      throw err;
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token. Please log in." });
  });

  it("clears cookies and returns 401 when user is inactive beyond timeout", async () => {
    const req = { cookies: { accessToken: "ok" } };
    const res = createMockRes();
    const next = createNext();

    jwtUtils.verifyAccessToken.mockReturnValueOnce({ id: "u1", type: "access" });
    User.findById.mockResolvedValueOnce({
      _id: "u1",
      lastActiveAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    await protect(req, res, next);

    expect(jwtUtils.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Session expired due to inactivity. Please log in again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next for valid session", async () => {
    const req = { cookies: { accessToken: "ok" } };
    const res = createMockRes();
    const next = createNext();

    jwtUtils.verifyAccessToken.mockReturnValueOnce({ id: "u1", type: "access" });
    const user = { _id: "u1", lastActiveAt: new Date() };
    User.findById.mockResolvedValueOnce(user);

    await protect(req, res, next);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
