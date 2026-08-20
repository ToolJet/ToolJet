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
  });
});
