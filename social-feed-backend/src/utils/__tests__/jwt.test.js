import { createMockRes } from "../../../test/httpMocks.js";

describe("jwt utils", () => {
  it("signAccessToken / verifyAccessToken roundtrip", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../jwt.js");
    const token = signAccessToken("u1");
    const payload = verifyAccessToken(token);
    expect(payload).toEqual(expect.objectContaining({ id: "u1", type: "access" }));
  });

  it("signRefreshToken / verifyRefreshToken roundtrip", async () => {
    const { signRefreshToken, verifyRefreshToken } = await import("../jwt.js");
    const token = signRefreshToken("u1");
    const payload = verifyRefreshToken(token);
    expect(payload).toEqual(expect.objectContaining({ id: "u1", type: "refresh" }));
  });

  it("verifyAccessToken rejects refresh tokens (type mismatch)", async () => {
    const { signRefreshToken, verifyAccessToken } = await import("../jwt.js");
    const refresh = signRefreshToken("u1");
    expect(() => verifyAccessToken(refresh)).toThrow("Invalid token type");
  });

  it("setAuthCookies and clearAuthCookies set/clear both cookies", async () => {
    const { setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE } = await import(
      "../jwt.js"
    );
    const res = createMockRes();

    setAuthCookies(res, "access", "refresh");
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_COOKIE,
      "access",
      expect.objectContaining({ httpOnly: true, maxAge: expect.any(Number) }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      "refresh",
      expect.objectContaining({ httpOnly: true, maxAge: expect.any(Number) }),
    );

    clearAuthCookies(res);
    expect(res.clearCookie).toHaveBeenCalledWith(
      ACCESS_COOKIE,
      expect.objectContaining({ maxAge: 0 }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});

