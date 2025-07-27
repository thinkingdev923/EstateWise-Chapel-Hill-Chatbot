// selenium/chat.spec.js
const { createDriver } = require("./driver.js");
const { By, Key, until } = require("selenium-webdriver");

let expect;
before(async () => {
  ({ expect } = await import("chai"));
});

describe("Chat page (guest)", function () {
  this.timeout(40000);
  let driver;
  const url = "https://estatewise.vercel.app/chat";

  before(async () => {
    driver = await createDriver();
    await driver.manage().setTimeouts({ implicit: 5000 });
  });

  after(async () => {
    await driver.quit();
  });

  it("can toggle sidebar and dark-mode", async () => {
    await driver.get(url);

    await driver
      .findElement(By.css('button[aria-label="Toggle Sidebar"]'))
      .click();
    const aside = await driver.findElement(By.css("aside"));
    expect(await aside.isDisplayed()).to.be.false;

    await driver
      .findElement(By.css('button[aria-label="Toggle Dark Mode"]'))
      .click();
    const html = await driver.findElement(By.css("html"));
    expect(await html.getAttribute("class")).to.include("dark");
  });

  it("typing ENTER triggers loader bubble", async () => {
    await driver.get(url);

    const input = await driver.findElement(
      By.css('input[placeholder="Type your message…"]'),
    );
    await input.sendKeys("Hello", Key.ENTER);

    const loader = await driver.wait(
      until.elementLocated(By.css(".animate-pulse")),
      8000,
    );
    expect(loader).to.exist;
  });

  it("copy icon appears on model messages", async () => {
    await driver.get(url);

    const input = await driver.findElement(
      By.css('input[placeholder="Type your message…"]'),
    );
    await input.sendKeys("Copy test", Key.ENTER);

    await driver.wait(
      until.elementLocated(By.css('button[aria-label="Copy message"]')),
      20000,
    );
    const copyBtn = await driver.findElement(
      By.css('button[aria-label="Copy message"]'),
    );
    expect(copyBtn).to.exist;
  });
});
