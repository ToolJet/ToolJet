/** Don't auto-start a trial on setup-super-admin in tests (it calls ToolJet's license server). */
if (process.env.DISABLE_AUTO_TRIAL === undefined) {
  process.env.DISABLE_AUTO_TRIAL = 'true';
}

/** Suppresses console output during tests. Set DEBUG_TESTS=true to restore. */
if (process.env.DEBUG_TESTS !== 'true') {
  console.log = () => {};
  console.error = () => {};
}
