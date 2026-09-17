/**
 * GitConflictDetectionService — invalid name ('/') detection.
 *
 * A datasource/app/module name containing '/' is only possible from content pushed
 * before name validation existed (see server/src/modules/apps/dto,
 * server/src/modules/data-sources/dto) — Git Sync uses the name as a filesystem path
 * segment, so it either vanishes on pull or gets misattributed as a dashboard-folder
 * boundary (see server/ee/git-sync AGENTS.md). detectPullConflicts must flag it as a
 * conflict instead of silently mishandling it.
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

describe('GitConflictDetectionService — invalid name ("/") detection', () => {
  let service: GitConflictDetectionService;
  let repoPath: string;

  beforeEach(() => {
    service = new GitConflictDetectionService({ log: jest.fn() } as any);
    repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-conflict-invalid-name-'));
    // No orphan candidates / multi-draft resources in any of these tests — only the
    // invalid-name check matters.
    jest.spyOn(service as any, 'loadOrphanCandidateModules').mockResolvedValue([]);
    jest.spyOn(service as any, 'loadOrphanCandidateDataSources').mockResolvedValue([]);
    jest.spyOn(service, 'detectMultipleDraftResources').mockResolvedValue([]);
  });

  afterEach(() => {
    fs.rmSync(repoPath, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const writeAppJson = (resourceFolder: 'apps' | 'modules', folderName: string, content: any) => {
    const dir = path.join(repoPath, resourceFolder, folderName, 'app');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.json'), JSON.stringify(content));
  };

  const writeDataSourceFile = (folderName: string, id: string, name: string) => {
    const dir = path.join(repoPath, 'data-sources', folderName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'data-source.json'), JSON.stringify({ id, name }));
  };

  describe('collectInvalidNameConflicts (pure)', () => {
    it('flags an app whose real (content) name contains "/"', () => {
      const groups = (service as any).collectInvalidNameConflicts(
        [
          {
            coRelationId: 'c-1',
            name: 'abc-appname',
            appPath: 'apps/abc-appname',
            slug: null,
            contentName: 'abc/appname',
          },
        ],
        'app'
      );
      expect(groups).toEqual([
        {
          type: 'app',
          label: 'Applications — invalid name',
          conflictField: 'invalid_name',
          conflictKey: 'abc/appname',
          conflicts: [{ name: 'abc/appname', status: 'incoming', coRelationId: 'c-1' }],
        },
      ]);
    });

    it('does not flag a slash-free name', () => {
      const groups = (service as any).collectInvalidNameConflicts(
        [{ coRelationId: 'c-1', name: 'my-app', appPath: 'apps/my-app', slug: null, contentName: 'my-app' }],
        'app'
      );
      expect(groups).toEqual([]);
    });

    it('does not flag when the content name could not be read', () => {
      const groups = (service as any).collectInvalidNameConflicts(
        [{ coRelationId: 'c-1', name: 'my-app', appPath: 'apps/my-app', slug: null, contentName: null }],
        'app'
      );
      expect(groups).toEqual([]);
    });

    it('labels a module group "Modules — invalid name" with type "module"', () => {
      const groups = (service as any).collectInvalidNameConflicts(
        [
          {
            coRelationId: 'c-1',
            name: 'abc-module',
            appPath: 'modules/abc-module',
            slug: null,
            contentName: 'abc/module',
          },
        ],
        'module'
      );
      expect(groups).toEqual([
        {
          type: 'module',
          label: 'Modules — invalid name',
          conflictField: 'invalid_name',
          conflictKey: 'abc/module',
          conflicts: [{ name: 'abc/module', status: 'incoming', coRelationId: 'c-1' }],
        },
      ]);
    });

    // The check is a plain `.includes('/')`, so a slash anywhere in the name — leading,
    // trailing, or nested — is invalid, and the full name is echoed back verbatim as the
    // conflictKey (nothing is stripped or normalised).
    it.each([
      ['leading slash', '/abc'],
      ['trailing slash', 'abc/'],
      ['nested slashes', 'a/b/c'],
    ])('flags a %s name and preserves it verbatim as the conflictKey', (_desc, contentName) => {
      const groups = (service as any).collectInvalidNameConflicts(
        [{ coRelationId: 'c-1', name: 'abc', appPath: 'apps/abc', slug: null, contentName }],
        'app'
      );
      expect(groups).toEqual([expect.objectContaining({ conflictField: 'invalid_name', conflictKey: contentName })]);
    });

    it('flags every offending resource when several arrive in one pull', () => {
      const groups = (service as any).collectInvalidNameConflicts(
        [
          { coRelationId: 'c-1', name: 'a1', appPath: 'apps/a1', slug: null, contentName: 'a/1' },
          { coRelationId: 'c-2', name: 'a2', appPath: 'apps/a2', slug: null, contentName: 'ok-name' },
          { coRelationId: 'c-3', name: 'a3', appPath: 'apps/a3', slug: null, contentName: 'a/3' },
        ],
        'app'
      );
      expect(groups.map((g: any) => g.conflictKey)).toEqual(['a/1', 'a/3']);
    });
  });

  describe('collectDataSourceInvalidNameConflicts (pure)', () => {
    it('flags a datasource name containing "/"', () => {
      const groups = (service as any).collectDataSourceInvalidNameConflicts([
        { coRelationId: 'ds-1', key: 'local/snowflake', label: 'local/snowflake' },
      ]);
      expect(groups).toEqual([
        {
          type: 'datasource',
          label: 'Data Sources — invalid name',
          conflictField: 'invalid_name',
          conflictKey: 'local/snowflake',
          conflicts: [{ name: 'local/snowflake', status: 'incoming', coRelationId: 'ds-1' }],
        },
      ]);
    });

    it('does not flag a slash-free name', () => {
      const groups = (service as any).collectDataSourceInvalidNameConflicts([
        { coRelationId: 'ds-1', key: 'snowflake', label: 'snowflake' },
      ]);
      expect(groups).toEqual([]);
    });
  });

  describe('end-to-end via detectPullConflicts', () => {
    it('flags an app pushed before validation existed (name has "/" in app.json, "-" on disk)', async () => {
      jest.spyOn(service as any, 'loadExistingAppsOnBranch').mockResolvedValue(new Map());
      writeAppJson('apps', 'abc-appname', { id: 'a-1', name: 'abc/appname' });

      await expect(service.detectPullConflicts(ORG, BRANCH, repoPath)).rejects.toThrow(ConflictException);

      try {
        await service.detectPullConflicts(ORG, BRANCH, repoPath);
        fail('expected ConflictException');
      } catch (err: any) {
        const { conflictGroups } = JSON.parse(err.message);
        expect(conflictGroups).toContainEqual(
          expect.objectContaining({ type: 'app', conflictField: 'invalid_name', conflictKey: 'abc/appname' })
        );
      }
    });

    it('flags a module pushed before validation existed (name has "/" in app.json, "-" on disk)', async () => {
      jest.spyOn(service as any, 'loadExistingAppsOnBranch').mockResolvedValue(new Map());
      writeAppJson('modules', 'abc-appname', { id: 'm-1', name: 'abc/appname' });

      await expect(service.detectPullConflicts(ORG, BRANCH, repoPath)).rejects.toThrow(ConflictException);

      try {
        await service.detectPullConflicts(ORG, BRANCH, repoPath);
        fail('expected ConflictException');
      } catch (err: any) {
        const { conflictGroups } = JSON.parse(err.message);
        expect(conflictGroups).toContainEqual(
          expect.objectContaining({ type: 'module', conflictField: 'invalid_name', conflictKey: 'abc/appname' })
        );
      }
    });

    it('does not flag a module pushed with a slash-free name', async () => {
      jest.spyOn(service as any, 'loadExistingAppsOnBranch').mockResolvedValue(new Map());
      writeAppJson('modules', 'my-module', { id: 'm-1', name: 'my-module' });

      await expect(service.detectPullConflicts(ORG, BRANCH, repoPath)).resolves.toBeUndefined();
    });

    it('flags a datasource pushed before validation existed', async () => {
      jest.spyOn(service as any, 'loadExistingDataSourcesOnBranch').mockResolvedValue(new Map());
      writeDataSourceFile('local-snowflake', 'ds-1', 'local/snowflake');

      try {
        await service.detectPullConflicts(ORG, BRANCH, repoPath);
        fail('expected ConflictException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ConflictException);
        const { conflictGroups } = JSON.parse(err.message);
        expect(conflictGroups).toContainEqual(
          expect.objectContaining({ type: 'datasource', conflictField: 'invalid_name', conflictKey: 'local/snowflake' })
        );
      }
    });

    it('does not flag a datasource pushed with a slash-free name', async () => {
      jest.spyOn(service as any, 'loadExistingDataSourcesOnBranch').mockResolvedValue(new Map());
      writeDataSourceFile('local-snowflake', 'ds-1', 'local-snowflake');

      await expect(service.detectPullConflicts(ORG, BRANCH, repoPath)).resolves.toBeUndefined();
    });

    it('flags every offending resource kind (app + module + datasource) in a single pull', async () => {
      jest.spyOn(service as any, 'loadExistingAppsOnBranch').mockResolvedValue(new Map());
      jest.spyOn(service as any, 'loadExistingDataSourcesOnBranch').mockResolvedValue(new Map());
      writeAppJson('apps', 'bad-app', { id: 'a-1', name: 'bad/app' });
      writeAppJson('modules', 'bad-module', { id: 'm-1', name: 'bad/module' });
      writeDataSourceFile('bad-ds', 'ds-1', 'bad/ds');

      try {
        await service.detectPullConflicts(ORG, BRANCH, repoPath);
        fail('expected ConflictException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ConflictException);
        const { conflictGroups } = JSON.parse(err.message);
        expect(conflictGroups).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'app', conflictField: 'invalid_name', conflictKey: 'bad/app' }),
            expect.objectContaining({ type: 'module', conflictField: 'invalid_name', conflictKey: 'bad/module' }),
            expect.objectContaining({ type: 'datasource', conflictField: 'invalid_name', conflictKey: 'bad/ds' }),
          ])
        );
      }
    });
  });
});
