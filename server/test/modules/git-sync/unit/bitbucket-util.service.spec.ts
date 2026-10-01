/**
 * BitbucketGitSyncUtilityService — the Bitbucket Cloud REST /2.0 client + config resolution.
 *
 * `got` is mocked, so every Bitbucket call is asserted by URL/headers/body instead of hitting
 * api.bitbucket.org. The service is built via Object.create (no Nest DI); only the collaborators
 * each method touches are stubbed. A real e2e (like git-sync-gitlab.spec.ts) is not possible yet:
 * the API base and git host are hard-coded to bitbucket.org, so the test simulator can't stand in.
 *
 * @group gitsync
 */
jest.mock('got', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
// DI-only deps whose import chains are heavy (and pull `got` as ESM) — never used by these methods.
jest.mock('@ee/git-sync/git-sync-adapter', () => ({ GitSyncAdapter: class {} }));
jest.mock('@ee/import-export-resources/service', () => ({ ImportExportResourcesService: class {} }));

import got from 'got';
import { FindOperator } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BitbucketGitSyncUtilityService } from '@ee/git-sync/providers/bitbucket/util.service';
import { OrganizationBitbucket } from '@entities/gitsync_entities/organization_bitbucket.entity';
import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { BitbucketConfigDTO } from '@modules/git-sync/providers/dto/provider-config.dto';
import { BitbucketTestConnectionDTO } from '@ee/git-sync/providers/dto/test-provider-connection.dto';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

const gotGet = got.get as unknown as jest.Mock;
const gotPost = got.post as unknown as jest.Mock;
const gotDelete = got.delete as unknown as jest.Mock;

const API = 'https://api.bitbucket.org/2.0/repositories/acme/web-app';
const TOKEN = 'bb-token';
const AUTH = { headers: { Authorization: `Bearer ${TOKEN}` } };

const orgGit = { id: 'orggit-1', organizationId: 'org-1', useEnvConfig: false } as OrganizationGitSync;
const dbConfig = (): OrganizationBitbucket =>
  ({
    id: 'bb-1',
    configId: 'orggit-1',
    bitbucketWorkspace: 'acme',
    bitbucketRepoSlug: 'web-app',
    bitbucketBranch: 'main',
    bitbucketAccessToken: 'encrypted-token',
  }) as OrganizationBitbucket;

/** Shape of an HTTPError thrown by `got` — only the fields the service reads. */
const httpError = (statusCode: number, requestUrl = '') =>
  Object.assign(new Error(`HTTP ${statusCode}`), { response: { statusCode, request: { requestUrl } } });

const buildService = () => {
  const svc: unknown = Object.create(BitbucketGitSyncUtilityService.prototype);
  const stubs = {
    encryptionService: {
      encryptColumnValue: jest.fn().mockResolvedValue('encrypted-new'),
      decryptColumnValue: jest.fn().mockResolvedValue(TOKEN),
    },
    organizationEnvRegistryService: { getBitbucketConfig: jest.fn() },
    resetDefaultBranchSyncState: jest.fn().mockResolvedValue(undefined),
    findBitbucketConfigs: jest.fn().mockImplementation(() => Promise.resolve(dbConfig())),
    transactionLogger: { log: jest.fn() },
  };
  // The stubbed collaborators are private on the real class; expose them to the test.
  return Object.assign(svc as object, stubs) as Omit<BitbucketGitSyncUtilityService, keyof typeof stubs> & typeof stubs;
};

describe('BitbucketGitSyncUtilityService', () => {
  let svc: ReturnType<typeof buildService>;

  beforeEach(() => {
    [gotGet, gotPost, gotDelete].forEach((m) => m.mockReset());
    svc = buildService();
  });

  describe('resolveBitbucketConfigs', () => {
    it('returns the DB config with the access token decrypted', async () => {
      const cfg = await svc.resolveBitbucketConfigs(orgGit);
      expect(svc.encryptionService.decryptColumnValue).toHaveBeenCalledWith(
        'organization_bitbucket',
        'bitbucket_access_token',
        'encrypted-token'
      );
      expect(cfg).toMatchObject({
        bitbucketWorkspace: 'acme',
        bitbucketRepoSlug: 'web-app',
        bitbucketAccessToken: TOKEN,
      });
    });

    it('throws when no DB config exists', async () => {
      svc.findBitbucketConfigs.mockResolvedValue(null);
      await expect(svc.resolveBitbucketConfigs(orgGit)).rejects.toThrow('Bitbucket configuration not found.');
    });

    it('reads the env config (no decryption) when useEnvConfig is on', async () => {
      const envCfg = { bitbucketWorkspace: 'env-ws', bitbucketRepoSlug: 'env-repo', bitbucketBranch: 'dev' };
      svc.organizationEnvRegistryService.getBitbucketConfig.mockResolvedValue(envCfg);
      await expect(svc.resolveBitbucketConfigs({ ...orgGit, useEnvConfig: true } as OrganizationGitSync)).resolves.toBe(
        envCfg
      );
      expect(svc.organizationEnvRegistryService.getBitbucketConfig).toHaveBeenCalledWith('org-1');
      expect(svc.findBitbucketConfigs).not.toHaveBeenCalled();
    });

    it('throws when useEnvConfig is on but the env config is missing', async () => {
      svc.organizationEnvRegistryService.getBitbucketConfig.mockResolvedValue(null);
      await expect(
        svc.resolveBitbucketConfigs({ ...orgGit, useEnvConfig: true } as OrganizationGitSync)
      ).rejects.toThrow('Bitbucket environment configuration is missing or invalid.');
    });
  });

  describe('testGitConnectionWithPayload', () => {
    const payload: BitbucketTestConnectionDTO = {
      gitType: GITConnectionType.BITBUCKET,
      gitUrl: 'https://bitbucket.org/acme/web-app',
      bitbucketWorkspace: 'acme',
      bitbucketRepoSlug: 'web-app',
      bitbucketAccessToken: TOKEN,
      branchName: 'main',
    };

    it('succeeds when the repo matches and the branch exists', async () => {
      gotGet.mockResolvedValueOnce({ body: { full_name: 'Acme/Web-App' } }).mockResolvedValueOnce({ body: {} });

      await expect(svc.testGitConnectionWithPayload(payload)).resolves.toEqual({
        success: true,
        connectionStatus: true,
        connectionMessage: 'Successfully Connected',
        errCode: 0,
      });
      expect(gotGet).toHaveBeenNthCalledWith(1, API, expect.objectContaining(AUTH));
      expect(gotGet).toHaveBeenNthCalledWith(2, `${API}/refs/branches/main`, expect.objectContaining(AUTH));
    });

    it('defaults the branch to main when none is supplied', async () => {
      gotGet.mockResolvedValueOnce({ body: { full_name: 'acme/web-app' } }).mockResolvedValueOnce({ body: {} });
      await svc.testGitConnectionWithPayload({ ...payload, branchName: undefined });
      expect(gotGet).toHaveBeenNthCalledWith(2, `${API}/refs/branches/main`, expect.anything());
    });

    it('URL-encodes workspace, repo slug and branch', async () => {
      gotGet.mockResolvedValueOnce({ body: { full_name: 'my ws/my repo' } }).mockResolvedValueOnce({ body: {} });
      await svc.testGitConnectionWithPayload({
        ...payload,
        bitbucketWorkspace: 'my ws',
        bitbucketRepoSlug: 'my repo',
        branchName: 'feat/login',
      });
      expect(gotGet).toHaveBeenNthCalledWith(
        2,
        'https://api.bitbucket.org/2.0/repositories/my%20ws/my%20repo/refs/branches/feat%2Flogin',
        expect.anything()
      );
    });

    it.each([
      ['a repo 404', httpError(404, `${API}`), 'Bitbucket repository not found. Check the workspace and repo slug.'],
      [
        'a branch 404',
        httpError(404, `${API}/refs/branches/main`),
        'The configured branch does not exist in this Bitbucket repository.',
      ],
      ['a 401', httpError(401), 'Bitbucket authentication failed. Check the access token.'],
      ['a 403', httpError(403), 'Bitbucket authentication failed. Check the access token.'],
      [
        'a timeout',
        Object.assign(new Error('timeout'), { name: 'TimeoutError' }),
        'Could not reach Bitbucket. Please try again.',
      ],
      [
        'an unknown error',
        new Error('boom'),
        'Connection to Bitbucket failed. Please verify \nthe configs and try again.',
      ],
    ])('reports a failed connection with a specific message on %s', async (_label, error, message) => {
      gotGet.mockRejectedValue(error);
      await expect(svc.testGitConnectionWithPayload(payload)).resolves.toEqual({
        connectionStatus: false,
        connectionMessage: message,
        errCode: -20,
      });
    });

    it('fails without checking the branch when Bitbucket returns a different repo', async () => {
      gotGet.mockResolvedValueOnce({ body: { full_name: 'someone-else/web-app' } });
      await expect(svc.testGitConnectionWithPayload(payload)).resolves.toMatchObject({
        connectionStatus: false,
        connectionMessage: 'The repository returned by Bitbucket does not match the configured workspace/repo slug.',
      });
      expect(gotGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('testGitConnection (stored config)', () => {
    it('verifies with the resolved (decrypted) config', async () => {
      gotGet.mockResolvedValueOnce({ body: { full_name: 'acme/web-app' } }).mockResolvedValueOnce({ body: {} });
      await expect(svc.testGitConnection(orgGit)).resolves.toMatchObject({ connectionStatus: true });
      expect(gotGet).toHaveBeenNthCalledWith(1, API, expect.objectContaining(AUTH));
    });
  });

  describe('getAuthenticatedUrl', () => {
    it('builds an x-token-auth clone URL with an encoded workspace and slug', () => {
      expect(svc.getAuthenticatedUrl('my ws', 'web-app', TOKEN)).toBe(
        `https://x-token-auth:${TOKEN}@bitbucket.org/my%20ws/web-app.git`
      );
    });
  });

  describe('createBitbucketConfig', () => {
    const configData: BitbucketConfigDTO = {
      gitType: GITConnectionType.BITBUCKET,
      gitUrl: 'https://bitbucket.org/acme/web-app',
      branchName: 'main',
      bitbucketWorkspace: 'acme',
      bitbucketRepoSlug: 'web-app',
      bitbucketAccessToken: 'plain-token',
    };
    const makeManager = (existing: OrganizationBitbucket | null) => ({
      findOne: jest
        .fn()
        .mockImplementation((entity: unknown) =>
          Promise.resolve(entity === OrganizationGitSync ? { id: 'orggit-1', organizationId: 'org-1' } : existing)
        ),
      create: jest.fn().mockImplementation((_entity: unknown, fields: object) => fields),
      save: jest.fn().mockImplementation((row: object) => Promise.resolve({ id: 'bb-new', ...row })),
      update: jest.fn().mockResolvedValue(undefined),
    });

    it('creates a new row with the access token encrypted', async () => {
      const manager = makeManager(null);
      await svc.createBitbucketConfig(configData, 'orggit-1', manager as never);

      expect(svc.encryptionService.encryptColumnValue).toHaveBeenCalledWith(
        'organization_bitbucket',
        'bitbucket_access_token',
        'plain-token'
      );
      expect(manager.save).toHaveBeenCalledWith({
        bitbucketWorkspace: 'acme',
        bitbucketRepoSlug: 'web-app',
        bitbucketBranch: 'main',
        bitbucketAccessToken: 'encrypted-new',
        configId: 'orggit-1',
      });
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('keeps the stored encrypted token when the UI sends the "unchanged" sentinel', async () => {
      const manager = makeManager(dbConfig());
      await svc.createBitbucketConfig(
        { ...configData, bitbucketAccessToken: '__tj_keep_existing_bitbucket_token__' },
        'orggit-1',
        manager as never
      );

      expect(svc.encryptionService.encryptColumnValue).not.toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledWith(
        OrganizationBitbucket,
        { id: 'bb-1' },
        expect.objectContaining({ bitbucketAccessToken: 'encrypted-token' })
      );
    });

    it('updates in place without resetting sync state when workspace and repo are unchanged', async () => {
      const manager = makeManager(dbConfig());
      await svc.createBitbucketConfig({ ...configData, branchName: 'develop' }, 'orggit-1', manager as never);

      expect(manager.update).toHaveBeenCalledWith(
        OrganizationBitbucket,
        { id: 'bb-1' },
        expect.objectContaining({ bitbucketBranch: 'develop' })
      );
      expect(svc.resetDefaultBranchSyncState).not.toHaveBeenCalled();
    });

    it('resets the default-branch sync state when the repo changes', async () => {
      const manager = makeManager(dbConfig());
      await svc.createBitbucketConfig({ ...configData, bitbucketRepoSlug: 'other-repo' }, 'orggit-1', manager as never);
      expect(svc.resetDefaultBranchSyncState).toHaveBeenCalledWith(manager, 'org-1');
    });
  });

  describe('branch operations', () => {
    it('createRemoteBranch posts the new branch pointed at the commit sha', async () => {
      gotPost.mockResolvedValue({ body: {} });
      await expect(svc.createRemoteBranch(orgGit, 'feat-1', 'main', 'abc123')).resolves.toEqual({ created: true });
      expect(gotPost).toHaveBeenCalledWith(
        `${API}/refs/branches`,
        expect.objectContaining({ ...AUTH, json: { name: 'feat-1', target: { hash: 'abc123' } } })
      );
    });

    it('createRemoteBranch falls back to the source branch when no sha is given', async () => {
      gotPost.mockResolvedValue({ body: {} });
      await svc.createRemoteBranch(orgGit, 'feat-1', 'main');
      expect(gotPost.mock.calls[0][1].json).toEqual({ name: 'feat-1', target: { hash: 'main' } });
    });

    it('createRemoteBranch treats a 400 (branch exists) as an idempotent no-op', async () => {
      gotPost.mockRejectedValue(httpError(400));
      await expect(svc.createRemoteBranch(orgGit, 'feat-1', 'main')).resolves.toEqual({ created: false });
    });

    it('createRemoteBranch rethrows other errors', async () => {
      gotPost.mockRejectedValue(httpError(500));
      await expect(svc.createRemoteBranch(orgGit, 'feat-1', 'main')).rejects.toThrow('HTTP 500');
    });

    it('listRemoteBranches follows the `next` cursor across pages', async () => {
      gotGet
        .mockResolvedValueOnce({ body: { values: [{ name: 'main' }, { name: 'feat-1' }], next: `${API}/page2` } })
        .mockResolvedValueOnce({ body: { values: [{ name: 'feat-2' }] } });

      await expect(svc.listRemoteBranches(orgGit)).resolves.toEqual(['main', 'feat-1', 'feat-2']);
      expect(gotGet).toHaveBeenNthCalledWith(1, `${API}/refs/branches?pagelen=100`, expect.objectContaining(AUTH));
      expect(gotGet).toHaveBeenNthCalledWith(2, `${API}/page2`, expect.objectContaining(AUTH));
    });

    it('deleteRemoteBranch deletes the encoded branch ref', async () => {
      gotDelete.mockResolvedValue({});
      await svc.deleteRemoteBranch(orgGit, 'feat/login');
      expect(gotDelete).toHaveBeenCalledWith(`${API}/refs/branches/feat%2Flogin`, expect.objectContaining(AUTH));
    });

    it('deleteRemoteBranch ignores a 404 (already gone) but rethrows other errors', async () => {
      gotDelete.mockRejectedValueOnce(httpError(404));
      await expect(svc.deleteRemoteBranch(orgGit, 'gone')).resolves.toBeUndefined();
      gotDelete.mockRejectedValueOnce(httpError(403));
      await expect(svc.deleteRemoteBranch(orgGit, 'locked')).rejects.toThrow('HTTP 403');
    });
  });

  describe('tag operations', () => {
    it('createTag posts the tag pointed at the ref', async () => {
      gotPost.mockResolvedValue({ body: {} });
      await svc.createTag(orgGit, 'co-1/v1', 'main');
      expect(gotPost).toHaveBeenCalledWith(
        `${API}/refs/tags`,
        expect.objectContaining({ ...AUTH, json: { name: 'co-1/v1', target: { hash: 'main' } } })
      );
    });

    it('createTag turns a 400 (tag exists) into a readable BadRequestException', async () => {
      gotPost.mockRejectedValue(httpError(400));
      const attempt = svc.createTag(orgGit, 'co-1/v1', 'main');
      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(svc.createTag(orgGit, 'co-1/v1', 'main')).rejects.toThrow(/Tag 'co-1\/v1' already exists/);
    });

    it('getTag returns the tag body, encoding the tag name', async () => {
      gotGet.mockResolvedValue({ body: { name: 'co-1/v1', target: { hash: 'abc' } } });
      await expect(svc.getTag(orgGit, 'co-1/v1')).resolves.toEqual({ name: 'co-1/v1', target: { hash: 'abc' } });
      expect(gotGet).toHaveBeenCalledWith(`${API}/refs/tags/co-1%2Fv1`, expect.objectContaining(AUTH));
    });

    it('getTag returns null on 404 and rethrows other errors', async () => {
      gotGet.mockRejectedValueOnce(httpError(404));
      await expect(svc.getTag(orgGit, 'missing')).resolves.toBeNull();
      gotGet.mockRejectedValueOnce(httpError(401));
      await expect(svc.getTag(orgGit, 'x')).rejects.toThrow('HTTP 401');
    });

    it('deleteTag ignores a 404', async () => {
      gotDelete.mockRejectedValue(httpError(404));
      await expect(svc.deleteTag(orgGit, 'co-1/v1')).resolves.toBeUndefined();
      expect(gotDelete).toHaveBeenCalledWith(`${API}/refs/tags/co-1%2Fv1`, expect.objectContaining(AUTH));
    });

    it('listTags collects every page', async () => {
      gotGet
        .mockResolvedValueOnce({ body: { values: [{ name: 'a' }], next: `${API}/p2` } })
        .mockResolvedValueOnce({ body: { values: [{ name: 'b' }] } });
      await expect(svc.listTags(orgGit)).resolves.toEqual([{ name: 'a' }, { name: 'b' }]);
      expect(gotGet).toHaveBeenNthCalledWith(1, `${API}/refs/tags?pagelen=100`, expect.anything());
    });
  });

  describe('listPullRequests', () => {
    it('requests every PR state (repeated state params) and follows the `next` cursor', async () => {
      gotGet
        .mockResolvedValueOnce({ body: { values: [{ id: 1, title: 'a' }], next: `${API}/pullrequests?page=2` } })
        .mockResolvedValueOnce({ body: { values: [{ id: 2, title: 'b' }] } });

      await expect(svc.listPullRequests(orgGit)).resolves.toEqual([
        { id: 1, title: 'a' },
        { id: 2, title: 'b' },
      ]);
      expect(gotGet).toHaveBeenNthCalledWith(
        1,
        `${API}/pullrequests?pagelen=50&state=OPEN&state=MERGED&state=DECLINED&state=SUPERSEDED`,
        expect.objectContaining(AUTH)
      );
    });
  });

  describe('seedWorkspaceBranches', () => {
    const ORG = 'org-1';
    type BranchRow = { id: string; organizationId: string; name: string; isDefault: boolean; sourceBranchId?: string };
    type Where = Record<string, unknown>;

    /** In-memory workspace_branches table behind the EntityManager calls the method makes. */
    const makeManager = (seed: Omit<BranchRow, 'organizationId'>[]) => {
      const rows: BranchRow[] = seed.map((r) => ({ organizationId: ORG, ...r }));
      const matches = (row: BranchRow, where: Where) =>
        Object.entries(where).every(([key, value]) =>
          value instanceof FindOperator && value.type === 'not'
            ? row[key as keyof BranchRow] !== value.value
            : row[key as keyof BranchRow] === value
        );
      let clearedExceptId: string | undefined;
      const queryBuilder = {
        update: () => queryBuilder,
        set: () => queryBuilder,
        where: () => queryBuilder,
        andWhere: (_sql: string, params?: { id?: string }) => {
          if (params?.id) clearedExceptId = params.id;
          return queryBuilder;
        },
        execute: async () => {
          rows.filter((r) => r.isDefault && r.id !== clearedExceptId).forEach((r) => (r.isDefault = false));
        },
      };
      const manager = {
        findOne: jest.fn(async (entity: unknown, { where }: { where: Where }) =>
          entity === OrganizationGitSync ? orgGit : (rows.find((r) => matches(r, where)) ?? null)
        ),
        find: jest.fn(async (_entity: unknown, { where }: { where: Where }) => rows.filter((r) => matches(r, where))),
        update: jest.fn(async (_entity: unknown, { id }: { id: string }, patch: Partial<BranchRow>) => {
          Object.assign(rows.find((r) => r.id === id) as BranchRow, patch);
        }),
        create: jest.fn((_entity: unknown, fields: Partial<BranchRow>) => fields),
        save: jest.fn(async (row: Omit<BranchRow, 'id'>) => {
          const saved = { id: 'created-default', ...row };
          rows.push(saved);
          return saved;
        }),
        insert: jest.fn(async (_entity: unknown, inserted: BranchRow[]) => {
          inserted.forEach((r, i) => rows.push({ id: `seeded-${i}`, ...r }));
        }),
        createQueryBuilder: () => queryBuilder,
      };
      return { manager, rows };
    };

    const seed = (manager: ReturnType<typeof makeManager>['manager'], branch: string) =>
      svc.seedWorkspaceBranches(ORG, 'orggit-1', branch, manager as never);

    beforeEach(() => {
      jest.spyOn(svc, 'listRemoteBranches').mockResolvedValue([]);
    });

    it('keeps the existing default branch row untouched when it already has the configured name', async () => {
      const { manager, rows } = makeManager([{ id: 'b-main', name: 'main', isDefault: true }]);
      await seed(manager, 'main');

      expect(rows).toEqual([expect.objectContaining({ id: 'b-main', name: 'main', isDefault: true })]);
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('renames the existing default branch row (same id) to the configured name', async () => {
      const { manager, rows } = makeManager([{ id: 'b-main', name: 'main', isDefault: true }]);
      await seed(manager, 'develop');

      expect(rows).toEqual([expect.objectContaining({ id: 'b-main', name: 'develop', isDefault: true })]);
    });

    it('frees the configured name from a non-default branch holding it before renaming the default', async () => {
      const { manager, rows } = makeManager([
        { id: 'b-main', name: 'main', isDefault: true },
        { id: 'b-dev', name: 'develop', isDefault: false },
      ]);
      await seed(manager, 'develop');

      const defaultRow = rows.find((r) => r.id === 'b-main');
      const clash = rows.find((r) => r.id === 'b-dev');
      expect(defaultRow).toMatchObject({ name: 'develop', isDefault: true });
      expect(clash?.name).toMatch(/^develop_[0-9a-f-]{36}$/);
    });

    it('promotes an existing branch with the configured name when there is no default yet', async () => {
      const { manager, rows } = makeManager([{ id: 'b-dev', name: 'develop', isDefault: false }]);
      await seed(manager, 'develop');

      expect(rows).toEqual([expect.objectContaining({ id: 'b-dev', isDefault: true })]);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('creates the default branch when there is no default and no branch with that name', async () => {
      const { manager, rows } = makeManager([]);
      await seed(manager, 'main');

      expect(rows).toEqual([expect.objectContaining({ id: 'created-default', name: 'main', isDefault: true })]);
    });

    it('clears a stale default flag so the configured branch is the only default', async () => {
      const { manager, rows } = makeManager([
        { id: 'b-main', name: 'main', isDefault: true },
        { id: 'b-stale', name: 'legacy', isDefault: true }, // a second, stale default
      ]);
      await seed(manager, 'main');

      expect(rows.filter((r) => r.isDefault).map((r) => r.id)).toEqual(['b-main']);
    });

    it('seeds remote branches that are not in the workspace yet, pointing at the default branch', async () => {
      jest.spyOn(svc, 'listRemoteBranches').mockResolvedValue(['main', 'feat-1', 'feat-2']);
      const { manager, rows } = makeManager([
        { id: 'b-main', name: 'main', isDefault: true },
        { id: 'b-f1', name: 'feat-1', isDefault: false },
      ]);
      await seed(manager, 'main');

      expect(manager.insert).toHaveBeenCalledWith(WorkspaceBranch, [
        { organizationId: ORG, name: 'feat-2', isDefault: false, sourceBranchId: 'b-main' },
      ]);
      expect(rows.map((r) => r.name)).toEqual(['main', 'feat-1', 'feat-2']);
    });

    it('does not insert anything when every remote branch already exists', async () => {
      jest.spyOn(svc, 'listRemoteBranches').mockResolvedValue(['main']);
      const { manager } = makeManager([{ id: 'b-main', name: 'main', isDefault: true }]);
      await seed(manager, 'main');

      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('still reconciles the default branch when listing remote branches fails (best-effort, logged)', async () => {
      jest.spyOn(svc, 'listRemoteBranches').mockRejectedValue(httpError(401));
      const { manager, rows } = makeManager([{ id: 'b-main', name: 'main', isDefault: true }]);

      await expect(seed(manager, 'develop')).resolves.toBeUndefined();
      expect(rows[0]).toMatchObject({ name: 'develop', isDefault: true });
      expect(svc.transactionLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('could not seed remote Bitbucket branches')
      );
    });
  });
});
