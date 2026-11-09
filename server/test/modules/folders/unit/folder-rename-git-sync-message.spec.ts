/**
 * @group platform
 *
 * Regression: `updateFolder` threw the same 'Folders with git-synced apps cannot be edited'
 * message for every folder type, including data-source folders — misleading, since data-source
 * folders don't hold apps at all. `FoldersService.updateFolder` (src/modules/folders/service.ts)
 * only reads `gitSyncConfigsUtilService.getDetails` and `abilityService.resourceActionsPermission`
 * from its constructor dependencies for this path, so both are stubbed directly (no real git-sync
 * config or license needed) against the real test database, mirroring the pattern in
 * ee/test/modules/workflows/unit/workflow-webhooks-blocked-fields.spec.ts.
 */
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, saveEntity } from 'test-helper';
import { Folder } from 'src/entities/folder.entity';
import { FoldersService } from '@modules/folders/service';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';

jest.setTimeout(30_000);

function buildService() {
  const abilityServiceStub = { resourceActionsPermission: jest.fn().mockResolvedValue({ isAdmin: true }) };
  const gitSyncConfigsUtilServiceStub = {
    getDetails: jest.fn().mockResolvedValue({ isEnabled: true, isMultiBranchingEnabled: true }),
  };
  return new FoldersService({} as never, abilityServiceStub as never, gitSyncConfigsUtilServiceStub as never);
}

describe('FoldersService.updateFolder — git-sync multi-branch rename block message', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('blocks renaming a git-synced data-source folder with a data-source-specific message', async () => {
    const { user } = await createUser(nestApp, { email: 'ds-folder-rename@tooljet.io' });
    const folder = await saveEntity(Folder, {
      name: 'ds-folder-rename-target',
      type: DATA_SOURCE_FOLDER_TYPE,
      organizationId: user.organizationId,
      createdBy: user.id,
    });

    await expect(buildService().updateFolder(user, folder.id, { name: 'renamed' })).rejects.toThrow(
      'Folders with git-synced data sources cannot be renamed'
    );
  });

  it('keeps the apps-oriented message for a non-data-source (app) folder', async () => {
    const { user } = await createUser(nestApp, { email: 'app-folder-rename@tooljet.io' });
    const folder = await saveEntity(Folder, {
      name: 'app-folder-rename-target',
      type: 'front-end',
      organizationId: user.organizationId,
      createdBy: user.id,
    });

    await expect(buildService().updateFolder(user, folder.id, { name: 'renamed' })).rejects.toThrow(
      'Folders with git-synced apps cannot be edited'
    );
  });
});
