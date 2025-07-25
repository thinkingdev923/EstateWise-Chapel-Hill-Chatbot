// Custom command to stub the /api/properties call
Cypress.Commands.add("mockChartsApi", () => {
  cy.intercept("GET", "**/api/properties*", { fixture: "charts.json" }).as(
    "getProperties",
  );
});

// ────────────────────────────────────────────────────────────
// Chat & auth helpers
// ────────────────────────────────────────────────────────────
Cypress.Commands.add("stubChatApi", () => {
  cy.intercept("POST", "**/api/chat", { fixture: "chat-response.json" }).as(
    "postChat",
  );
  cy.intercept("POST", "**/api/chat/rate", { statusCode: 200, body: {} }).as(
    "rateChat",
  );
});

Cypress.Commands.add("stubAuthApi", (opts = {}) => {
  const token = "test-jwt-token";
  cy.intercept("POST", "**/api/auth/login", {
    statusCode: opts.fail ? 401 : 200,
    body: opts.fail
      ? { message: "Invalid credentials" }
      : {
          token,
          user: { username: "TestUser", email: "user@example.com" },
        },
  }).as("postLogin");

  cy.intercept("POST", "**/api/auth/signup", {
    statusCode: opts.fail ? 400 : 201,
    body: opts.fail ? { message: "Signup error" } : {},
  }).as("postSignup");
});
