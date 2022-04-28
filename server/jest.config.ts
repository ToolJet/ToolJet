module.exports = async () => {
  return {
    verbose: true,
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.spec.ts$',
    testPathIgnorePatterns: ['.e2e-spec.ts$'],
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
      'dist/src/entities/(.*)': '<rootDir>/dist/src/entities/$1',
      '^src/(.*)': '<rootDir>/src/$1',
      '@dto/(.*)': '<rootDir>/src/dto/$1',
      '@plugins/(.*)': '<rootDir>/plugins/$1',
      '@services/(.*)': '<rootDir>/src/services/$1',
      '@controllers/(.*)': '<rootDir>/src/controllers/$1',
      '@ee/(.*)': '<rootDir>/ee/$1',
    },
  };
};
