/**
 * Mock for the `mariadb` npm package.
 *
 * Why this exists:
 *   mariadb v3.5.0+ switched to ESM-only ("type": "module" in package.json).
 *   Jest uses its own module resolver (vm.Script) which does NOT support
 *   Node 22's native `require()` of ES Modules — see jestjs/jest#15275.
 *   The server starts fine because Node 22 handles it natively, but Jest
 *   crashes with "SyntaxError: Cannot use import statement outside a module".
 *
 *   The import chain that triggers this:
 *     test.helper.ts → AppModule → DataSourcesModule → PluginsSelectorService
 *     → @tooljet/plugins/dist/server → mariadb plugin → require('mariadb') 💥
 *
 *   No test actually connects to MariaDB, so a trivial mock is sufficient.
 *   This can be removed once Jest supports ESM require (jestjs/jest#15275)
 *   or if mariadb restores a CJS entry point.
 */

const mockPool = {
  getConnection: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

module.exports = {
  createPool: jest.fn(() => mockPool),
  createConnection: jest.fn(),
  createPoolCluster: jest.fn(),
};
