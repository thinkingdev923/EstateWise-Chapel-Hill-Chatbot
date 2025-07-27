/**
 * @jest-environment node
 */

const httpMocks = require("node-mocks-http");

/* ------------------------------------------------------------------ */
/*  Import the middleware AFTER we stub console.error                 */
/* ------------------------------------------------------------------ */
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

const { errorHandler } = require("../src/middleware/error.middleware"); // adjust path if different

/* ------------------------------------------------------------------ */
/*  Helper – build a spy-able Express res                             */
/* ------------------------------------------------------------------ */
const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

afterAll(() => consoleErrorSpy.mockRestore());

describe("errorHandler middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs the error and sends custom status/message when provided", () => {
    const err = new Error("Bad Things™ happened");
    err.status = 418; // any non-500 code is fine

    const req = httpMocks.createRequest();
    const res = buildRes();

    // next param is required by signature but unused here
    errorHandler(err, req, res, jest.fn());

    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Bad Things™ happened" },
    });
  });

  it("falls back to 500 & generic message when err lacks status/message", () => {
    const err = {}; // minimal error‐like object
    const req = httpMocks.createRequest();
    const res = buildRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Internal Server Error" },
    });
  });
});
