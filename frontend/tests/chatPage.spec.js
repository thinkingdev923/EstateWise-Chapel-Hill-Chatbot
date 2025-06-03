const { test, expect } = require("@playwright/test");

test.describe("Chat Page (EstateWise)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("renders the input box and Send button", async ({ page }) => {
    const input = page.locator('input[placeholder="Type your message…"]');
    await expect(input).toBeVisible();
    const sendButton = page.getByRole("button", { name: "Send message" });
    await expect(sendButton).toBeVisible();
  });

  test("toggles dark mode on click", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark"),
    );

    const darkToggle = page.getByRole("button", { name: "Toggle Dark Mode" });
    await expect(darkToggle).toBeVisible();

    await darkToggle.click();
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);

    await darkToggle.click();
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/);
  });

  test("typing a message and pressing Enter shows a new user bubble", async ({
    page,
  }) => {
    await page.route("**/api/chat", async (route) => {
      const req = route.request();
      if (req.method() === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            response: "Mocked reply from AI",
            expertViews: null,
          }),
        });
      }
      return route.continue();
    });

    const input = page.locator('input[placeholder="Type your message…"]');
    await input.fill("Hello, EstateWise!");
    await input.press("Enter");

    const userBubble = page.locator("div", { hasText: "Hello, EstateWise!" });
    await expect(userBubble).toBeVisible();

    const modelBubble = page.locator("div", {
      hasText: "Mocked reply from AI",
    });
    await expect(modelBubble).toBeVisible();
  });
});
