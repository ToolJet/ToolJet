import { AppController } from '@modules/app/controller';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/app/constants';
import { CLI_API_VERSION, MIN_CLI_VERSION } from '@modules/app/constants/cli-compatibility';

/* The ToolJet CLI reads GET /api/cli-compatibility before a command uses this server, before it has signed in. */
describe('GET /api/cli-compatibility', () => {
  const controller = new AppController({} as any, {} as any);
  const saved = globalThis.TOOLJET_VERSION;
  afterEach(() => {
    globalThis.TOOLJET_VERSION = saved;
  });

  it('reports this server version, the CLI API it speaks and the oldest CLI it works with', () => {
    globalThis.TOOLJET_VERSION = '3.21.95-beta';
    expect(controller.cliCompatibility()).toEqual({
      serverVersion: '3.21.95-beta',
      cliApiVersion: CLI_API_VERSION,
      minCliVersion: MIN_CLI_VERSION,
    });
  });

  it('is public, as the CLI asks before signing in', () => {
    expect(MODULE_INFO[MODULES.ROOT][FEATURE_KEY.CLI_COMPATIBILITY]).toMatchObject({ isPublic: true });
  });

  it('keeps its shape: a whole number and a semver version', () => {
    expect(Number.isInteger(CLI_API_VERSION)).toBe(true);
    expect(MIN_CLI_VERSION).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
  });
});
