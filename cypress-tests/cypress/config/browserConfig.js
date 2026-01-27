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
        '--js-flags=--max-old-space-size=8192'  // Increase Node.js memory to 8GB
      );

      // Headless-specific optimizations
      if (browser.isHeadless) {
        launchOptions.args.push('--disable-gpu');
      }
    }
    return launchOptions;
  });
};
