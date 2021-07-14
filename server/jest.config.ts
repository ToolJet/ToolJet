
module.exports = async () => {
  return {
    verbose: true,
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    testEnvironment: "node",
    testRegex: ".spec.ts$",
    testPathIgnorePatterns: [".e2e-spec.ts$"],
    transform: {
      "^.+\\.(t|j)s$": "ts-jest"
    }
  }
};