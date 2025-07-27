const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // adjust the baseUrl to match your app's URL!!!
    // on CI, Vercel will build my app and serve it at this URL BEFORE the tests are run
    // on GitHub Actions so our tests will run against the deployed app
    baseUrl: "https://estatewise.vercel.app",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    video: false,
    defaultCommandTimeout: 8000,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
