/** Suppresses console output during tests. Set DEBUG_TESTS=true to restore. */
if (process.env.DEBUG_TESTS !== 'true') {
  console.log = () => {};
  console.error = () => {};
}
