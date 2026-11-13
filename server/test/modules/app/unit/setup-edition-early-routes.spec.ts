import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as constants from '@modules/app/constants';
import { setupEditionEarlyRoutes } from '../../../../src/helpers/bootstrap.helper';

/** @group platform */
describe('setupEditionEarlyRoutes | the isolated frame route', () => {
  afterEach(() => jest.restoreAllMocks());

  const start = async (importPath: string) => {
    jest.spyOn(constants, 'getImportPath').mockResolvedValue(importPath);
    const logger = { error: jest.fn(), warn: jest.fn(), log: jest.fn() };
    const app: any = { use: jest.fn(), get: jest.fn() };
    const config: any = { get: () => undefined };
    await setupEditionEarlyRoutes(app, config, logger);
    return { app, logger };
  };

  it('should add nothing and say nothing on an edition without it', async () => {
    const { app, logger } = await start(`${__dirname}/no-such-edition`);
    expect(app.use).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should report a frame route that exists but fails to load', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-frame-'));
    fs.mkdirSync(`${dir}/code-page-security`);
    fs.writeFileSync(`${dir}/code-page-security/frame-route.js`, "throw new Error('stale build');\n");
    const { app, logger } = await start(dir);
    expect(app.use).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('isolated frame'), expect.any(Error));
  });
});
