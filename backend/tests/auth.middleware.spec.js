/**
 * @jest-environment node
 */

const httpMocks = require("node-mocks-http");

// Turn `jsonwebtoken` into a manual mock with a `verify` spy
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../src/middleware/auth.middleware");

describe("authMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    // default env var
    process.env.JWT_SECRET = "testsecret";
  });

  it("▶️ calls next without attaching user if no token present", () => {
    authMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res._getStatusCode()).toBe(200); // by default no status set
  });

  it("🚫 returns 401 JSON if token is invalid", () => {
    req.cookies = { token: "bad.jwt" };
    // simulate verify throwing
    jwt.verify.mockImplementationOnce(() => {
      throw new Error("Invalid");
    });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("bad.jwt", process.env.JWT_SECRET);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });
});
