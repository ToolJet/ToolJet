import { FolderAppsService } from '@services/folder_apps.service';
import { clearDB, createNestAppInstance, setupOrganization } from '../test.helper';
import { INestApplication } from '@nestjs/common';
import { getManager } from 'typeorm';
import { FolderApp } from '../../src/entities/folder_app.entity';
import { FoldersService } from '@services/folders.service';

describe('FolderAppsService', () => {
  let service: FolderAppsService;
  let nestApp: INestApplication;
  let foldersService: FoldersService;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<FolderAppsService>(FolderAppsService);
    foldersService = nestApp.get<FoldersService>(FoldersService);
  });

  describe('.create', () => {
    it('should create app folder', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);
      // create a new folder
      const type = 'front-end';
      const folder = await foldersService.create(adminUser, 'folder', type);
      const manager = getManager();

      // add app to folder
      await service.create(folder.id, app.id);

      const newFolder = await manager.findOneOrFail(FolderApp, { where: { folderId: folder.id, appId: app.id } });
      expect(newFolder.folderId).toBe(folder.id);
      expect(newFolder.appId).toBe(app.id);
    });
  });

  describe('.remove', () => {
    it('should remove app from folder', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);
      // create a new folder
      const folder = await foldersService.create(adminUser, 'folder');
      const manager = getManager();

      // add app to folder
      await service.create(folder.id, app.id);

      // remove app from folder
      await service.remove(folder.id, app.id);

      await foldersService.create(adminUser, 'folder1');
      await expect(manager.findOneOrFail(FolderApp, { where: { folderId: folder.id, appId: app.id } })).rejects.toThrow(
        expect.any(Error)
      );
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
