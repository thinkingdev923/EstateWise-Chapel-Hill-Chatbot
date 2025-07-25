const {
  API_BASE_URL,
  getConversations,
  renameConversation,
  deleteConversation,
  createNewConversation,
  sendMessage,
  searchConversations,
} = require("../lib/api");

describe("API module", () => {
  const oldFetch = global.fetch;
  const token = "fake-token";
  const convId = "123";
  const title = "New Title";
  const message = "Hello";
  const history = [{ role: "user", text: "Hi" }];

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = oldFetch;
  });

  describe("getConversations", () => {
    it("resolves with JSON array when response is ok", async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await expect(getConversations(token)).resolves.toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it("throws with error message from server when not ok", async () => {
      const err = { error: "Bad token" };
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(err),
      });

      await expect(getConversations(token)).rejects.toThrow("Bad token");
    });

    it("throws generic error when no error field", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(getConversations(token)).rejects.toThrow(
        "Failed to load conversations",
      );
    });
  });

  describe("renameConversation", () => {
    it("returns updated conversation on success", async () => {
      const updated = { id: convId, title };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      });

      await expect(renameConversation(convId, title, token)).resolves.toEqual(
        updated,
      );
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/conversations/${convId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        },
      );
    });

    it("throws on non-ok response", async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(renameConversation(convId, title, token)).rejects.toThrow(
        "Failed to rename conversation",
      );
    });
  });

  describe("deleteConversation", () => {
    it("resolves undefined on success", async () => {
      fetch.mockResolvedValueOnce({ ok: true });
      await expect(deleteConversation(convId, token)).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/conversations/${convId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    });

    it("throws on failure", async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(deleteConversation(convId, token)).rejects.toThrow(
        "Failed to delete conversation",
      );
    });
  });

  describe("createNewConversation", () => {
    it("returns created conversation JSON", async () => {
      const newConv = { id: "abc", title: "Untitled Conversation" };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newConv),
      });

      await expect(createNewConversation(token)).resolves.toEqual(newConv);
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Untitled Conversation" }),
      });
    });

    it("throws on failure", async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(createNewConversation(token)).rejects.toThrow(
        "Failed to create new conversation",
      );
    });
  });

  describe("sendMessage", () => {
    it("posts message with token and returns JSON", async () => {
      const response = { reply: "Hi there" };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      });

      await expect(
        sendMessage({ token, message, convoId: convId, history }),
      ).resolves.toEqual(response);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token, message, convoId: convId, history }),
      });
    });

    it("posts message without token", async () => {
      const resp = { reply: "No auth" };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(resp),
      });

      await expect(sendMessage({ message })).resolves.toEqual(resp);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat`,
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("throws error message from server on failure", async () => {
      const err = { error: "Bad request" };
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(err),
      });

      await expect(sendMessage({ message })).rejects.toThrow("Bad request");
    });

    it("throws generic on missing error field", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(sendMessage({ message })).rejects.toThrow(
        "Error sending message",
      );
    });
  });

  describe("searchConversations", () => {
    const query = "hello";

    it("returns results array on success without token", async () => {
      const results = [{ id: "1" }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(results),
      });

      await expect(searchConversations(query)).resolves.toEqual(results);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/conversations/search?q=${encodeURIComponent(query)}`,
        { headers: {} },
      );
    });

    it("includes Authorization header when token provided", async () => {
      const results = [];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(results),
      });

      await searchConversations(query, token);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
    });

    it("throws server error message when not ok", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Search failed" }),
      });

      await expect(searchConversations(query, token)).rejects.toThrow(
        "Search failed",
      );
    });

    it("throws generic when error field absent", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(searchConversations(query)).rejects.toThrow(
        "Conversation search failed",
      );
    });
  });
});
