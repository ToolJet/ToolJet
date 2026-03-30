/**
 * Runs before any test file is imported.
 * Suppresses console.log to eliminate OTEL, bootstrap, and TJDB noise.
 * Use DEBUG_TESTS=1 to restore output for debugging.
 */
if (!process.env.DEBUG_TESTS) {
  console.log = () => {};
}
