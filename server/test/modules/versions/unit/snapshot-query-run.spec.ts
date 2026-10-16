/** @group platform */
import { ForbiddenException } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '@modules/data-queries/constants';
import { MODULES } from '@modules/app/constants/modules';
import { SnapshotRunGuard } from '@modules/data-queries/guards/snapshot-run.guard';

// Running a query "as the AI-edit snapshot had it" can run code a draft no longer has. View-only
// users may run editor-mode queries (previews), so a snapshot run needs edit access to the app.
describe('running a query from an AI-edit snapshot', () => {
  const contextFor = (body: any) => {
    const request = { body, user: { id: 'u' }, tj_app: { id: 'app-1', type: 'front-end' } };
    return { request, context: { switchToHttp: () => ({ getRequest: () => request }) } as any };
  };
  const guardWith = (canUpdate: boolean) => {
    const createAbility = jest.fn(async () => ({
      can: (action: string, subject: any) => canUpdate && action === FEATURE_KEY.UPDATE && subject === App,
    }));
    const moduleRef: any = { resolve: jest.fn(async () => ({ createAbility })) };
    return { guard: new SnapshotRunGuard(moduleRef), createAbility, moduleRef };
  };

  it('lets ordinary runs through without a permission check', async () => {
    const { guard, moduleRef } = guardWith(false);
    await expect(guard.canActivate(contextFor({ options: {} }).context)).resolves.toBe(true);
    expect(moduleRef.resolve).not.toHaveBeenCalled();
  });

  it('refuses a snapshot run for someone who cannot edit the app', async () => {
    const { guard } = guardWith(false);
    await expect(guard.canActivate(contextFor({ snapshotId: 's-1' }).context)).rejects.toThrow(ForbiddenException);
  });

  it('allows a snapshot run for someone who can edit the app, asking about this app', async () => {
    const { guard, createAbility } = guardWith(true);
    const { context, request } = contextFor({ snapshotId: 's-1' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(createAbility).toHaveBeenCalledWith(request.user, expect.anything(), [{ resourceType: MODULES.APP }], request);
  });
});
