import { BadRequestException } from '@nestjs/common';
import { VersionService } from '@modules/versions/service';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { VersionCreateDto } from '@modules/versions/dto';

describe('VersionService.createOrEnqueueVersion', () => {
  let svc: any;
  const app = { id: 'app-1' } as App;
  const user = { id: 'user-1', organizationId: 'org-1' } as User;
  const dto = { versionName: 'v2', versionFromId: 'v1' } as VersionCreateDto;

  beforeEach(() => {
    svc = Object.create(VersionService.prototype);
    svc.createVersion = jest.fn().mockResolvedValue({ id: 'v2', name: 'v2' });
    svc.versionsUtilService = { validateVersionCreate: jest.fn() };
  });

  it('CE default: runs synchronously and flags enqueued:false', async () => {
    const res = await svc.createOrEnqueueVersion(app, user, dto);
    expect(res).toEqual({ enqueued: false, id: 'v2', name: 'v2' });
    expect(svc.versionsUtilService.validateVersionCreate).not.toHaveBeenCalled();
  });

  it('background: validates, enqueues, and does not create inline', async () => {
    svc.shouldRunInBackground = jest.fn().mockResolvedValue(true);
    svc.enqueueCreateVersion = jest.fn();
    const res = await svc.createOrEnqueueVersion(app, user, dto);
    expect(res).toEqual({ enqueued: true });
    expect(svc.versionsUtilService.validateVersionCreate).toHaveBeenCalledWith(app, user, dto);
    expect(svc.createVersion).not.toHaveBeenCalled();
  });

  it('background: validation error surfaces before enqueue', async () => {
    svc.shouldRunInBackground = jest.fn().mockResolvedValue(true);
    svc.enqueueCreateVersion = jest.fn();
    svc.versionsUtilService.validateVersionCreate.mockRejectedValue(
      new BadRequestException('Version name cannot be empty.')
    );
    await expect(svc.createOrEnqueueVersion(app, user, dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(svc.enqueueCreateVersion).not.toHaveBeenCalled();
  });
});
