module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Inline options rather than the plugin tsconfig, whose `rootDir: lib`
        // and `composite: true` are meant for the ncc build, not for tests.
        tsconfig: {
          esModuleInterop: true,
          module: 'commonjs',
          target: 'es2019',
          strict: false,
        },
      },
    ],
  },
};
