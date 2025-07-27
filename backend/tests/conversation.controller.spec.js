/**
 * @jest-environment node
 */
process.env.JWT_SECRET = "irrelevant";

/* ─── helpers ───────────────────────────────────────────── */
const httpMocks = require("node-mocks-http");
const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

/* ─── Conversation model mock ───────────────────────────── */
const saveMock = jest.fn().mockResolvedValue();
const findMock = jest.fn();
const findOneAndUpdateMock = jest.fn();
const findOneAndDeleteMock = jest.fn();

function ConversationMock(data = {}) {
  Object.assign(this, data);
  this.save = saveMock;
}
ConversationMock.find = (...a) => findMock(...a);
ConversationMock.findOneAndUpdate = (...a) => findOneAndUpdateMock(...a);
ConversationMock.findOneAndDelete = (...a) => findOneAndDeleteMock(...a);

/* (important – match the real import path) */
jest.mock("../src/models/Conversation.model", () => ConversationMock);

/* ─── controller under test ─────────────────────────────── */
const {
  createConversation,
  getConversations,
  searchConversations,
  updateConversation,
  deleteConversation,
} = require("../src/controllers/conversation.controller");

/* ════════════════════════════════════════════════════════════ */
describe("Conversation controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ── createConversation ─────────────────────────────── */
  describe("createConversation()", () => {
    it("401 when unauthenticated", async () => {
      const req = httpMocks.createRequest({ body: { title: "X" } });
      const res = buildRes();
      await createConversation(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("201 + saved convo when authed", async () => {
      const req = httpMocks.createRequest({ body: { title: "Chat A" } });
      req.user = { id: "u1" };
      const res = buildRes();

      await createConversation(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ user: "u1", title: "Chat A" }),
      );
    });
  });

  /* ── getConversations ───────────────────────────────── */
  describe("getConversations()", () => {
    it("401 when unauthenticated", async () => {
      const req = httpMocks.createRequest();
      const res = buildRes();
      await getConversations(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  /* ── searchConversations ────────────────────────────── */
  describe("searchConversations()", () => {
    it("401 when unauthenticated", async () => {
      const req = httpMocks.createRequest({ query: { q: "abc" } });
      const res = buildRes();
      await searchConversations(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  /* ── updateConversation ─────────────────────────────── */
  describe("updateConversation()", () => {
    it("401 when unauthenticated", async () => {
      const req = httpMocks.createRequest({ params: { id: "c1" } });
      const res = buildRes();
      await updateConversation(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("404 when convo not found", async () => {
      findOneAndUpdateMock.mockResolvedValueOnce(null);
      const req = httpMocks.createRequest({
        params: { id: "c1" },
        body: { title: "New" },
      });
      req.user = { id: "u1" };
      const res = buildRes();

      await updateConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns updated convo", async () => {
      findOneAndUpdateMock.mockResolvedValueOnce({ _id: "c1", title: "New" });
      const req = httpMocks.createRequest({
        params: { id: "c1" },
        body: { title: "New" },
      });
      req.user = { id: "u1" };
      const res = buildRes();

      await updateConversation(req, res);

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        { _id: "c1", user: "u1" },
        { title: "New" },
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "c1", title: "New" }),
      );
    });
  });

  /* ── deleteConversation ─────────────────────────────── */
  describe("deleteConversation()", () => {
    it("401 when unauthenticated", async () => {
      const req = httpMocks.createRequest({ params: { id: "c1" } });
      const res = buildRes();
      await deleteConversation(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("404 when not found", async () => {
      findOneAndDeleteMock.mockResolvedValueOnce(null);
      const req = httpMocks.createRequest({ params: { id: "c1" } });
      req.user = { id: "u1" };
      const res = buildRes();

      await deleteConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("success message on delete", async () => {
      findOneAndDeleteMock.mockResolvedValueOnce({ _id: "c1" });
      const req = httpMocks.createRequest({ params: { id: "c1" } });
      req.user = { id: "u1" };
      const res = buildRes();

      await deleteConversation(req, res);

      expect(findOneAndDeleteMock).toHaveBeenCalledWith({
        _id: "c1",
        user: "u1",
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Conversation deleted successfully",
      });
    });
  });
});
