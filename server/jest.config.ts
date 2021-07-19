
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
    },
    moduleNameMapper: {
      "src/(.*)": "<rootDir>/src/$1",
      "@plugins/(.*)": "<rootDir>/plugins/$1",
      "@services/(.*)": "<rootDir>/src/services/$1",
      "@controllers/(.*)": "<rootDir>/src/controllers/$1"
    }
  }
};