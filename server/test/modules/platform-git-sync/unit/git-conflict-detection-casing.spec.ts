/**
 * GitConflictDetectionService — name casing.
 *
 * Names of data sources, apps and modules are case-SENSITIVE, so an entity that
 * differs from an existing one only in casing ("Analytics" vs "analytics") is a
 * DISTINCT resource and must NOT be reported as a git push/pull name conflict.
 * An exact-case duplicate still conflicts (control cases).
 *
 * These exercise the push (detectPushConflicts / gatherPushDataSourceConflicts)
 * and pull-import (checkImportDataSourceNames / checkImportModuleNames /
 * gatherDataSourceConflicts / collectNameConflicts) entry points. Disk reads use
 * a real temp repo; the DB loaders (loadExisting*) are spied.
 *
 * @group gitsync
 */
import { ConflictException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GitConflictDetectionService } from '@ee/platform-git-sync/git-conflict-detection.service';

const ORG = 'org-1';
const BRANCH = 'branch-1';

describe('GitConflictDetectionService — name casing (case-sensitive)', () => {
  let service: GitConflictDetectionService;
  let repoPath: string;

  beforeEach(() => {
    service = new GitConflictDetectionService({ log: jest.fn() } as any);
    repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-conflict-casing-'));
    // The pull orphan sweep (loadOrphanCandidate*) hits the DB and is irrelevant to
    // name-casing collision detection — stub it out so these stay pure unit tests.
    jest.spyOn(service as any, 'loadOrphanCandidateModules').mockResolvedValue([]);
    jest.spyOn(service as any, 'loadOrphanCandidateDataSources').mockResolvedValue([]);
  });

  afterEach(() => {
    fs.rmSync(repoPath, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const writeDataSourceFile = (folderName: string, id: string, name: string) => {
    const dir = path.join(repoPath, 'data-sources', folderName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'data-source.json'), JSON.stringify({ id, name }));
  };

  const writeModuleFile = (folderName: string, id: string) => {
    const dir = path.join(repoPath, 'modules', folderName, 'app');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.json'), JSON.stringify({ id }));
  };

  const spyExistingDataSources = (entries: Array<[string, string]>) =>
    jest.spyOn(service as any, 'loadExistingDataSourcesOnBranch').mockResolvedValue(new Map<string, string>(entries));

  const spyExistingModules = (entries: Array<[string, { name: string; slug: string | null }]>) =>
    jest.spyOn(service as any, 'loadExistingAppsOnBranch').mockResolvedValue(new Map(entries));

  // ── PUSH: data sources ────────────────────────────────────────────────
  describe('push (detectPushConflicts, scope=datasource)', () => {
    it('does NOT flag a local data source whose name differs only in casing from a remote one', async () => {
      writeDataSourceFile('Analytics', 'ds-remote-1', 'Analytics');
      spyExistingDataSources([['ds-local-1', 'analytics']]);

      await expect(
        service.detectPushConflicts(ORG, BRANCH, repoPath, undefined, 'datasource')
      ).resolves.toBeUndefined();
    });

    it('still flags an exact-case duplicate data source name (control)', async () => {
      writeDataSourceFile('Analytics', 'ds-remote-1', 'Analytics');
      spyExistingDataSources([['ds-local-1', 'Analytics']]);

      await expect(service.detectPushConflicts(ORG, BRANCH, repoPath, undefined, 'datasource')).rejects.toThrow(
        ConflictException
      );
    });
  });

  // ── PULL / IMPORT: data sources ───────────────────────────────────────
  describe('pull/import (checkImportDataSourceNames)', () => {
    it('returns no conflict when incoming DS name differs only in casing from an existing one', async () => {
      spyExistingDataSources([['ds-local-1', 'analytics']]);

      const result = await (service as any).checkImportDataSourceNames(ORG, BRANCH, [
        { id: 'ds-remote-1', name: 'Analytics' },
      ]);

      expect(result).toBeNull();
    });

    it('reports a conflict for an exact-case duplicate (control)', async () => {
      spyExistingDataSources([['ds-local-1', 'analytics']]);

      const result = await (service as any).checkImportDataSourceNames(ORG, BRANCH, [
        { id: 'ds-remote-1', name: 'analytics' },
      ]);

      expect(result).not.toBeNull();
      expect(result.type).toBe('datasource');
    });
  });

  // ── PULL (full branch): data sources ──────────────────────────────────
  describe('pull (gatherDataSourceConflicts)', () => {
    it('does NOT flag a case-only difference between incoming and existing DS', async () => {
      writeDataSourceFile('Analytics', 'ds-remote-1', 'Analytics');
      spyExistingDataSources([['ds-local-1', 'analytics']]);

      const groups = await (service as any).gatherDataSourceConflicts(ORG, BRANCH, repoPath);
      expect(groups).toEqual([]);
    });

    it('flags an exact-case duplicate (control)', async () => {
      writeDataSourceFile('Analytics', 'ds-remote-1', 'Analytics');
      spyExistingDataSources([['ds-local-1', 'Analytics']]);

      const groups = await (service as any).gatherDataSourceConflicts(ORG, BRANCH, repoPath);
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  // ── PULL / IMPORT: modules ────────────────────────────────────────────
  describe('pull/import (checkImportModuleNames)', () => {
    it('does NOT flag an incoming module whose name differs only in casing', async () => {
      writeModuleFile('Utils', 'mod-remote-1');
      spyExistingModules([['mod-local-1', { name: 'utils', slug: null }]]);

      const groups = await (service as any).checkImportModuleNames(ORG, BRANCH, repoPath, new Set(['mod-remote-1']));
      expect(groups).toEqual([]);
    });

    it('flags an exact-case duplicate module name (control)', async () => {
      writeModuleFile('Utils', 'mod-remote-1');
      spyExistingModules([['mod-local-1', { name: 'Utils', slug: null }]]);

      const groups = await (service as any).checkImportModuleNames(ORG, BRANCH, repoPath, new Set(['mod-remote-1']));
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  // ── PUSH & PULL core: apps and modules (collectNameConflicts) ─────────
  // collectNameConflicts is the shared name comparator used by both the push
  // (gatherPushAppConflicts) and pull (gatherAppConflicts) paths for apps AND
  // modules, so a case-only difference must produce no conflict for either kind.
  describe.each(['app', 'module'] as const)('collectNameConflicts (%s)', (kind) => {
    it('does NOT flag a case-only name difference', () => {
      const incoming = [{ coRelationId: 'remote-1', name: 'Dashboard' }];
      const existing = new Map([['local-1', { name: 'dashboard', slug: null }]]);

      const groups = (service as any).collectNameConflicts(incoming, existing, kind);
      expect(groups).toEqual([]);
    });

    it('flags an exact-case duplicate (control)', () => {
      const incoming = [{ coRelationId: 'remote-1', name: 'Dashboard' }];
      const existing = new Map([['local-1', { name: 'Dashboard', slug: null }]]);

      const groups = (service as any).collectNameConflicts(incoming, existing, kind);
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].type).toBe(kind);
    });
  });
});
