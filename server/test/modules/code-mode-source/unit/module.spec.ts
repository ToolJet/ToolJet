import { AppSecurityModule } from '@modules/app-security/module';
import { CodeModeSourceModule } from '@modules/code-mode-source/module';

/** @group platform */
describe('CodeModeSourceModule', () => {
  const configs = { IS_GET_CONTEXT: false };
  // AppSecurityService keeps the automatic checks' timers and concurrency caps in memory: one instance per process.
  it('should import the same AppSecurityModule as the app module, so one app security service runs', async () => {
    const main = await AppSecurityModule.register(configs, true);
    for (const isMainImport of [true, false]) {
      const codeMode = await CodeModeSourceModule.register(configs, isMainImport);
      expect(codeMode.imports).toContain(main);
    }
  });
});
