jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(false),
    promises: {
      ...actual.promises,
      readdir: jest.fn().mockResolvedValue([]),
      readFile: jest.fn(),
    },
  };
});

import * as fs from 'fs';
import { OrganizationEnvRegistryService } from '@ee/organization-env/service';

function makeService() {
  const orgRepo = { findOne: jest.fn() };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  const service = new OrganizationEnvRegistryService(orgRepo as any, logger as any);
  return { service, logger };
}

describe('OrganizationEnvRegistryService', () => {
  beforeEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
  });

  afterEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    jest.clearAllMocks();
  });

  describe('parseWorkspaceGitConfigsVar()', () => {
    it('returns empty map when WORKSPACE_GIT_CONFIGS is not set', () => {
      const { service } = makeService();
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('parses valid JSON and returns nested maps', () => {
      const { service } = makeService();
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        'workspace-a': { GITHUB_URL: 'https://github.com/org/repo', GITHUB_BRANCH: 'main' },
      });
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result.size).toBe(1);
      expect(result.get('workspace-a').get('GITHUB_URL')).toBe('https://github.com/org/repo');
      expect(result.get('workspace-a').get('GITHUB_BRANCH')).toBe('main');
    });

    it('returns empty map and warns when JSON is invalid', () => {
      const { service, logger } = makeService();
      process.env.WORKSPACE_GIT_CONFIGS = 'not-valid-json{{{';
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result.size).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('invalid JSON'));
    });

    it('returns empty map and warns when top-level value is an array', () => {
      const { service, logger } = makeService();
      process.env.WORKSPACE_GIT_CONFIGS = '[]';
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result.size).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('plain object'));
    });

    it('skips workspace entry that is not an object and warns', () => {
      const { service, logger } = makeService();
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        'bad-workspace': 'not-an-object',
        'good-workspace': { GITHUB_URL: 'https://github.com/org/repo' },
      });
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result.has('bad-workspace')).toBe(false);
      expect(result.has('good-workspace')).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"bad-workspace"'));
    });

    it('skips individual keys whose values are not strings and warns, but stores remaining keys', () => {
      const { service, logger } = makeService();
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        'workspace-a': { GITHUB_URL: 'https://github.com/org/repo', GITHUB_APP_ID: 12345 },
      });
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result.get('workspace-a').get('GITHUB_URL')).toBe('https://github.com/org/repo');
      expect(result.get('workspace-a').has('GITHUB_APP_ID')).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('workspace-a.GITHUB_APP_ID'));
    });

    it('does not store workspace entry when all keys are invalid', () => {
      const { service } = makeService();
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        'workspace-a': { GITHUB_APP_ID: 12345 },
      });
      const result = (service as any).parseWorkspaceGitConfigsVar();
      expect(result.has('workspace-a')).toBe(false);
    });
  });

  describe('initialize() — source priority and overlay', () => {
    const ORG_UUID_A = '11111111-1111-1111-1111-111111111111';
    const ORG_UUID_B = '22222222-2222-2222-2222-222222222222';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('env var workspace wins entirely over matching file workspace', async () => {
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        [ORG_UUID_A]: { GITHUB_URL: 'env-url' },
      });
      (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${ORG_UUID_A}`]);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(`GITHUB_URL=file-url\nGITHUB_BRANCH=main`);

      const { service } = makeService();
      await service.initialize();

      expect(await service.get(ORG_UUID_A, 'GITHUB_URL')).toBe('env-url');
      // file key not in env var entry is discarded — full replace, no merge
      expect(await service.get(ORG_UUID_A, 'GITHUB_BRANCH')).toBeUndefined();
    });

    it('file workspace used as fallback when not present in env var', async () => {
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        [ORG_UUID_A]: { GITHUB_URL: 'env-url' },
      });
      (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${ORG_UUID_A}`, `.tj_env.${ORG_UUID_B}`]);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(`GITHUB_URL=file-url-a`)
        .mockResolvedValueOnce(`GITHUB_URL=file-url-b`);

      const { service } = makeService();
      await service.initialize();

      expect(await service.get(ORG_UUID_B, 'GITHUB_URL')).toBe('file-url-b');
    });

    it('only env var workspaces present when no files exist', async () => {
      process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({
        [ORG_UUID_A]: { GITHUB_URL: 'env-url' },
      });
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const { service } = makeService();
      await service.initialize();

      expect(await service.get(ORG_UUID_A, 'GITHUB_URL')).toBe('env-url');
    });

    it('only file workspaces present when WORKSPACE_GIT_CONFIGS is not set', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${ORG_UUID_A}`]);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(`GITHUB_URL=file-url`);

      const { service } = makeService();
      await service.initialize();

      expect(await service.get(ORG_UUID_A, 'GITHUB_URL')).toBe('file-url');
    });
  });
});
