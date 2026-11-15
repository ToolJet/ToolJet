/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  // marketplace/ has no Jest runner of its own; run its shared SSRF copy's tests from here.
  roots: ['<rootDir>', '<rootDir>/../marketplace/plugins/common'],
  modulePaths: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
