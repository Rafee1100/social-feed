import { jest } from "@jest/globals";
import { createMockRes, createNext } from "../../../test/httpMocks.js";

const User = {
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  findById: jest.fn(),
};

const jwtUtils = {
  signAccessToken: jest.fn(() => "access.jwt"),
  signRefreshToken: jest.fn(() => "refresh.jwt"),
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn((t) => `hash:${t}`),
  getRefreshMaxAgeMs: jest.fn(() => 30 * 24 * 60 * 60 * 1000),
  REFRESH_COOKIE: "refreshToken",
};

jest.unstable_mockModule("../../models/User.js", () => ({ default: User }));
jest.unstable_mockModule("../../utils/jwt.js", () => jwtUtils);

const { register, login, logout, refresh, getMe } = await import("../authController.js");

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("register returns 409 when email already exists", async () => {
    User.findOne.mockResolvedValueOnce({ _id: "u1" });

    const req = {
      body: { firstName: "A", lastName: "B", email: "x@y.com", password: "pass" },
    };
    const res = createMockRes();
    const next = createNext();

    await register(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(409);
  });

  it("login returns 401 for invalid password", async () => {
    User.findOne.mockReturnValueOnce({
      select: jest.fn(async () => ({
        _id: "u1",
        comparePassword: jest.fn(async () => false),
      })),
    });

    const req = { body: { email: "x@y.com", password: "nope" } };
    const res = createMockRes();
    const next = createNext();

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("logout clears cookies and wipes refresh token fields when req.user is present", async () => {
    const req = { user: { _id: "u1" } };
    const res = createMockRes();
    const next = createNext();

    await logout(req, res, next);

    expect(jwtUtils.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: "u1" },
      expect.objectContaining({
        $set: expect.objectContaining({
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
          lastActiveAt: null,
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Logged out successfully." });
  });

  it("refresh returns 401 when refresh cookie missing", async () => {
    const req = { cookies: {} };
    const res = createMockRes();
    const next = createNext();

    await refresh(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("refresh clears cookies when token hash mismatches", async () => {
    const req = { cookies: { refreshToken: "refresh.jwt" } };
    const res = createMockRes();
    const next = createNext();

    jwtUtils.verifyRefreshToken.mockReturnValueOnce({ id: "u1", type: "refresh" });
    User.findById.mockReturnValueOnce({
      select: jest.fn(async () => ({
        _id: "u1",
        refreshTokenHash: "hash:other",
        refreshTokenExpiresAt: new Date(Date.now() + 10000),
        lastActiveAt: new Date(),
        save: jest.fn(),
      })),
    });

    await refresh(req, res, next);

    expect(jwtUtils.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("getMe returns safe user object", () => {
    const req = { user: { toSafeObject: () => ({ id: "u1" }) } };
    const res = createMockRes();

    getMe(req, res);

    expect(res.json).toHaveBeenCalledWith({ user: { id: "u1" } });
  });
});

