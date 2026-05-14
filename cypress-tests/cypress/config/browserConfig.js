/**
 * Browser Launch Configuration
 * Configures Chrome browser launch arguments for optimal performance and stability
 */

module.exports = (on) => {
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      // Common args for all Chrome modes
      launchOptions.args.push(
        '--disable-features=AutofillAccountStorage,PasswordManager',
        '--disable-save-password-bubble',
        '--disable-password-generation',
        '--disable-password-manager-reauthentication',
        '--disable-dev-shm-usage',  // Prevents Chrome crashes in CI/Docker
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--js-flags=--max-old-space-size=8192',  // Increase Node.js memory to 8GB
        // ── Renderer-stability flags ─────────────────────────────────────
        // Chrome's renderer-process was reliably crashing on memory-heavy
        // editor → dashboard transitions in headless mode (see Flow #3
        // history). These flags keep the renderer alive during navigation:
        // - disable-background-timer-throttling: Chrome paused JS timers
        //   on backgrounded headless tabs, which interacted badly with our
        //   long-running CDP-driven drag operations.
        // - disable-renderer-backgrounding + occluded-windows: same idea
        //   for the whole renderer process — keep it warm.
        // - disable-ipc-flooding-protection: long Cypress test sessions
        //   send a lot of IPC; the protection threshold kicked in and
        //   stalled the renderer.
        // - disable-features=Translate,VizDisplayCompositor: removes two
        //   process-spawning features that aren't needed in test runs.
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection',
        '--disable-features=Translate,VizDisplayCompositor'
      );

      // Headless-specific optimizations
      if (browser.isHeadless) {
        launchOptions.args.push('--disable-gpu');
      }
    }
    return launchOptions;
  });
};
