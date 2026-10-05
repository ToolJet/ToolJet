import { VersionService } from '@ee/versions/service';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { VersionCreateDto } from '@modules/versions/dto';

describe('EE VersionService background hooks', () => {
  let svc: any;
  let enqueueCreateVersion: jest.Mock;
  let findOne: jest.Mock;

  beforeEach(() => {
    svc = Object.create(VersionService.prototype);
    enqueueCreateVersion = jest.fn();
    // ownership found by default — only the "foreign versionFromId" test overrides this to null
    findOne = jest.fn().mockResolvedValue({ id: 'v1' });
    svc.versionRepository = { findOne };
    svc.versionQueueService = { enqueueCreateVersion };
  });

  describe('shouldRunInBackground', () => {
    const app = { id: 'app-1', type: 'front-end', name: 'App' } as App;
    const user = { id: 'user-1', organizationId: 'org-1' } as User;

    it('front-end app copying an owned version goes to background', async () => {
      const dto = { versionName: 'v2', versionFromId: 'v1' } as VersionCreateDto;
      expect(await svc.shouldRunInBackground(app, user, dto)).toBe(true);
    });

    it('workflow app never runs in background', async () => {
      const workflowApp = { id: 'app-1', type: APP_TYPES.WORKFLOW, name: 'Workflow' } as App;
      const dto = { versionName: 'v2', versionFromId: 'v1' } as VersionCreateDto;
      expect(await svc.shouldRunInBackground(workflowApp, user, dto)).toBe(false);
      expect(findOne).not.toHaveBeenCalled();
    });

    it('dto.replace stays inline (git single-branch atomic swap)', async () => {
      const dto = { versionName: 'v2', versionFromId: 'v1', replace: true } as VersionCreateDto;
      expect(await svc.shouldRunInBackground(app, user, dto)).toBe(false);
    });

    it('no versionFromId (nothing to copy) stays inline', async () => {
      const dto = { versionName: 'v2' } as VersionCreateDto;
      expect(await svc.shouldRunInBackground(app, user, dto)).toBe(false);
      expect(findOne).not.toHaveBeenCalled();
    });

    it('foreign/missing versionFromId stays inline — sync path throws the proper error', async () => {
      findOne.mockResolvedValue(null);
      const dto = { versionName: 'v2', versionFromId: 'foreign-version' } as VersionCreateDto;
      expect(await svc.shouldRunInBackground(app, user, dto)).toBe(false);
    });
  });

  describe('enqueueCreateVersion', () => {
    it('forwards organization/user/app identity and the dto to the queue service', async () => {
      const app = { id: 'app-1', name: 'App' } as App;
      const user = { id: 'user-1', organizationId: 'org-1' } as User;
      const dto = { versionName: 'v2', versionFromId: 'v1' } as VersionCreateDto;
      await svc.enqueueCreateVersion(app, user, dto);
      expect(enqueueCreateVersion).toHaveBeenCalledWith({
        organizationId: 'org-1',
        userId: 'user-1',
        appId: 'app-1',
        appName: 'App',
        dto,
      });
    });
  });
});
