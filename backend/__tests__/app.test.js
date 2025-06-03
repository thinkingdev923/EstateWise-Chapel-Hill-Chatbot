import request from "supertest";

jest.mock("mongoose", () => {
  const EventEmitter = require("events").EventEmitter;
  const fakeConnection = new EventEmitter();
  return {
    connect: jest.fn().mockResolvedValue(),
    connection: {
      on: jest.fn((event, cb) => {
        // If someone does connection.once("open", …), invoke immediately
        if (event === "open") {
          process.nextTick(cb);
        }
        // Otherwise, just register listener so it won’t crash if called
        fakeConnection.on(event, cb);
      }),
      once: (event, cb) => {
        if (event === "open") {
          process.nextTick(cb);
        } else {
          fakeConnection.once(event, cb);
        }
      },
    },
  };
});

jest.mock("prom-client", () => {
  return {
    collectDefaultMetrics: jest.fn(),
    Histogram: class {
      constructor() {
        return {
          startTimer: () => () => {},
        };
      }
    },
    Gauge: class {
      constructor() {
        return {
          set: () => {},
        };
      }
    },
    register: {
      contentType: "text/plain; version=0.0.4; charset=utf-8",
      metrics: async () => "dummy_metrics_output",
    },
  };
});

jest.mock("express-status-monitor", () => {
  return () => (req, res, next) => next();
});
jest.mock("serve-favicon", () => {
  return () => (req, res, next) => next();
});
jest.mock("../routes/auth.routes", () => {
  const express = require("express");
  return express.Router();
});
jest.mock("../routes/chat.routes", () => {
  const express = require("express");
  return express.Router();
});
jest.mock("../routes/conversation.routes", () => {
  const express = require("express");
  return express.Router();
});
jest.mock("../routes/property.routes", () => {
  const express = require("express");
  return express.Router();
});
jest.mock("../middleware/error.middleware", () => {
  return {
    errorHandler: (err, req, res, next) => {
      res.status(500).json({ message: "Mocked errorHandler triggered" });
    },
  };
});

import app from "../src/server";

describe("Basic Express app integration tests", () => {
  it("GET /metrics → 200 + correct content type", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toBe("dummy_metrics_output");
  });
  it("GET /swagger.json → 200 + valid JSON shape", async () => {
    const res = await request(app).get("/swagger.json");
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Object);
    expect(Object.keys(res.body).length).toBeGreaterThan(0);
  });
  it("GET /api-docs → 200 + HTML content", async () => {
    const res = await request(app).get("/api-docs");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain('<div id="swagger-ui"></div>');
  });
  it('GET / → 302 redirect to "/api-docs"', async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(302);
    expect(res.headers["location"]).toBe("/api-docs");
  });
  it("GET /nonexistent-route → 404", async () => {
    const res = await request(app).get("/some/random/route");
    expect(res.status).toBe(404);
  });
});
