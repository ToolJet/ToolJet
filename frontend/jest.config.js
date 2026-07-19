module.exports = {
  transform: {
    '^.+\\.js?$': 'babel-jest',
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'babel-jest',
    '^.+\\.svg$': '<rootDir>/__mocks__/svg.js',
  },
  transformIgnorePatterns: ['node_modules/(?!(react|mpx-error-boundary)/)'],
  moduleNameMapper: {
    '^config$': '<rootDir>/src/test/mocks/config.js',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/style.js',
    // Mirror webpack.config.js aliases so tests resolve the same paths as the app.
    '^@ee/(.*)$': '<rootDir>/ee/$1',
    '^@cloud/(.*)$': '<rootDir>/cloud/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@white-label$': '<rootDir>/src/_helpers/white-label',
    '^@white-label/(.*)$': '<rootDir>/src/_helpers/white-label/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
  testPathIgnorePatterns: ['/node_modules/', '\\.spec\\.md$'],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.spec.md',
    '!src/**/index.{js,ts}',
    '!src/**/__mocks__/**',
    '!src/test/**',
  ],
};
