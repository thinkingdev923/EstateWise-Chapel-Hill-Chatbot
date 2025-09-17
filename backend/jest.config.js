// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testMatch: ["**/tests/**/*.spec.js"],
  detectOpenHandles: true,
  forceExit: true,
  watchman: false,
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
};
