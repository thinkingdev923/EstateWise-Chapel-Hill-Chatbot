process.env.JWT_SECRET = "testsecret";

const httpMocks = require("node-mocks-http");

// ─── Mock bcryptjs (as a factory) ─────────────────────────────────────────
jest.mock("bcryptjs", () => ({
  hash: jest.fn((pw, rounds) => Promise.resolve(`hashed:${pw}`)),
  compare: jest.fn((pw, hash) => Promise.resolve(hash === `hashed:${pw}`)),
}));
const bcrypt = require("bcryptjs");

// ─── Mock jsonwebtoken ────────────────────────────────────────────────────
const jwtSignMock = jest.fn(() => "jwt.token.123");
jest.mock("jsonwebtoken", () => ({
  sign: jwtSignMock,
}));

// ─── Mock Mongoose User model ──────────────────────────────────────────────
const saveMock = jest.fn().mockResolvedValue();
const findOneMock = jest.fn();
function UserMock(data) {
  Object.assign(this, data);
  this._id = "u123";
  this.save = saveMock;
}
UserMock.findOne = findOneMock;
jest.mock("../src/models/User.model", () => UserMock);

// ─── Import controllers AFTER mocks are in place ───────────────────────────
const {
  signUp,
  login,
  logout,
  verifyEmail,
} = require("../src/controllers/auth.controller");

// ─── Helper to build a spy‐able Express response ───────────────────────────
function buildRes() {
  const res = httpMocks.createResponse({
    eventEmitter: require("events").EventEmitter,
  });
  jest.spyOn(res, "status");
  jest.spyOn(res, "json");
  jest.spyOn(res, "cookie");
  jest.spyOn(res, "clearCookie");
  return res;
}

describe("Auth Controller (JS spec)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signUp → 201 + token cookie when user is new", async () => {
    findOneMock.mockResolvedValueOnce(null);

    const req = httpMocks.createRequest({
      method: "POST",
      body: { username: "bob", email: "a@t.io", password: "pw" },
    });
    const res = buildRes();

    await signUp(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ email: "a@t.io" });
    expect(bcrypt.hash).toHaveBeenCalledWith("pw", 10);
    expect(saveMock).toHaveBeenCalled();
    expect(jwtSignMock).toHaveBeenCalledWith(
      { id: "u123", email: "a@t.io" },
      "testsecret",
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "jwt.token.123",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "jwt.token.123",
        user: { username: "bob", email: "a@t.io" },
      }),
    );
  });

  it("signUp → 400 if user already exists", async () => {
    findOneMock.mockResolvedValueOnce({});

    const req = httpMocks.createRequest({
      method: "POST",
      body: { username: "u", email: "dup", password: "p" },
    });
    const res = buildRes();

    await signUp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
  });

  it("login → 200 + token cookie when credentials valid", async () => {
    findOneMock.mockResolvedValueOnce({
      _id: "u1",
      username: "bob",
      email: "e@x.com",
      password: "hashed:pw",
    });
    // bcrypt.compare mock is already set to return true for this case

    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "e@x.com", password: "pw" },
    });
    const res = buildRes();

    await login(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ email: "e@x.com" });
    expect(bcrypt.compare).toHaveBeenCalledWith("pw", "hashed:pw");
    expect(jwtSignMock).toHaveBeenCalledWith(
      { id: "u1", email: "e@x.com" },
      "testsecret",
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "jwt.token.123",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "jwt.token.123",
        user: { username: "bob", email: "e@x.com" },
      }),
    );
  });

  it("login → 400 if user not found or password mismatch", async () => {
    // no user
    findOneMock.mockResolvedValueOnce(null);
    let req = httpMocks.createRequest({ body: { email: "x", password: "p" } });
    let res = buildRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });

    // wrong password
    jest.clearAllMocks();
    findOneMock.mockResolvedValueOnce({
      _id: "u2",
      username: "alice",
      email: "a@x.com",
      password: "hashed:other",
    });
    bcrypt.compare.mockResolvedValueOnce(false);

    req = httpMocks.createRequest({
      body: { email: "a@x.com", password: "pw" },
    });
    res = buildRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  it("logout → clears the token cookie", async () => {
    const req = httpMocks.createRequest();
    const res = buildRes();
    await logout(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith("token");
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  it("verifyEmail → 404 if no such user", async () => {
    findOneMock.mockResolvedValueOnce(null);

    const req = httpMocks.createRequest({ body: { email: "none@x" } });
    const res = buildRes();
    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("verifyEmail → 200 & echo email if found", async () => {
    findOneMock.mockResolvedValueOnce({});

    const req = httpMocks.createRequest({ body: { email: "ok@x" } });
    const res = buildRes();
    await verifyEmail(req, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Email verified",
      email: "ok@x",
    });
  });
});
