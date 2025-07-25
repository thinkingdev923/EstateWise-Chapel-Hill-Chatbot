const { Builder } = require("selenium-webdriver");

async function createDriver() {
  return (
    new Builder()
      .forBrowser("chrome")
      // .usingServer('http://localhost:4444/wd/hub')
      .build()
  );
}

module.exports = { createDriver };
