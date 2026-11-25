/** @group platform */
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { ValidateAppHistoryGuard } from 'src/modules/app-history/guards/validate-app-history.guard';

// The app-history guard resolves a history entry by ID alone, so without a workspace check a user
// could restore or edit the history of an app in another workspace. The guard must reject a history
// entry whose app is not in the caller's workspace.
describe('ValidateAppHistoryGuard cross-workspace isolation', () => {
  const CALLER_WORKSPACE = 'workspace-a';

  const contextWith = (historyId: string, organizationId?: string): ExecutionContext => {
    const request = { params: { historyId }, user: { organizationId: organizationId ?? CALLER_WORKSPACE } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  const guardWith = (resolved: { appId: string | null; organizationId: string | null }) => {
    const repo = { getVersionAndAppIdForHistory: jest.fn(async () => ({ appVersionId: 'v', ...resolved })) };
    return { guard: new ValidateAppHistoryGuard(repo as any), repo };
  };

  it('rejects a history entry whose app lives in another workspace', async () => {
    const { guard } = guardWith({ appId: 'victim-app', organizationId: 'workspace-b' });
    await expect(guard.canActivate(contextWith('hist-1', CALLER_WORKSPACE))).rejects.toThrow(NotFoundException);
  });

  it('rejects when the history entry does not exist', async () => {
    const { guard } = guardWith({ appId: null, organizationId: null });
    await expect(guard.canActivate(contextWith('ghost', CALLER_WORKSPACE))).rejects.toThrow(NotFoundException);
  });

  it('allows a history entry in the caller’s own workspace and sets the resource id', async () => {
    const { guard } = guardWith({ appId: 'own-app', organizationId: CALLER_WORKSPACE });
    const request = { params: { historyId: 'hist-1' }, user: { organizationId: CALLER_WORKSPACE } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect((request as any).tj_resource_id).toBe('own-app');
  });
});
