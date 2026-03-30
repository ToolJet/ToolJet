/**
 * Runs before any test file is imported.
 * Suppresses console noise from production code (OTEL, bootstrap, TJDB, error handlers).
 * Use DEBUG_TESTS=1 to restore full output for debugging.
 */
if (process.env.DEBUG_TESTS !== 'true') {
  console.log = () => {};
  console.error = () => {};
}
