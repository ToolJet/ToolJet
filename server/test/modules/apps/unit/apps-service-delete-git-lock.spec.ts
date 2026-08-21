/**
 * Regression: deleting an app in a git-configured-but-unlicensed workspace must be BLOCKED, the same
 * way create is (assertNotGitLicenseLocked → ForbiddenException "Turn off git sync to continue").
 *
 * Why an EE-specific test: the EE AppsService.delete override handles git apps itself and returns
 * WITHOUT calling super.delete, so the base class' git guard was bypassed on exactly that path. This
 * asserts the EE override runs the license-lock guard up front.
 *
 * delete() reads `this.gitSyncConfigsUtilService` before touching anything else, so we drive the real
 * method off the prototype with just that dependency set — no full DI graph needed.
 */
import { ForbiddenException } from '@nestjs/common';
import { AppsService } from '@ee/apps/service';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';

const makeApp = (type: string, id = 'app-1'): App => Object.assign(new App(), { id, type });
const makeUser = () => ({ id: 'user-1', organizationId: 'org-1' }) as any;

const makeSvc = (isGitEditLocked: jest.Mock) => {
  const svc = Object.create(AppsService.prototype) as AppsService;
  (svc as any).gitSyncConfigsUtilService = { isGitEditLocked };
  // Only reached if the guard is SKIPPED/passes. Reject loudly so the test still proves whether the
  // guard ran, without needing the rest of the delete flow.
  (svc as any).organizationGitRepository = {
    findOrgGitByOrganizationId: jest.fn().mockRejectedValue(new Error('stop-after-guard')),
  };
  return svc;
};

describe('EE AppsService.delete — git license lock', () => {
  it('throws ForbiddenException with the turn-off-git message when git is configured but unlicensed', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(true);
    const svc = makeSvc(isGitEditLocked);

    await expect(svc.delete(makeApp(APP_TYPES.FRONT_END), makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    expect(isGitEditLocked).toHaveBeenCalledWith('org-1');
  });

  it('throws the same message for a module delete when locked', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(true);
    const svc = makeSvc(isGitEditLocked);

    await expect(svc.delete(makeApp(APP_TYPES.MODULE), makeUser())).rejects.toThrow(
      'Your plan has expired. Turn off git sync to continue.'
    );
  });

  it('checks the lock but proceeds when NOT license-locked', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(false);
    const svc = makeSvc(isGitEditLocked);

    // Not locked → guard passes; the delete then hits our throwing repo stub (not a lock error).
    await expect(svc.delete(makeApp(APP_TYPES.FRONT_END), makeUser())).rejects.toThrow('stop-after-guard');
    expect(isGitEditLocked).toHaveBeenCalledWith('org-1');
  });

  it('skips the lock check entirely for workflows (not git-synced)', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(true);
    const svc = makeSvc(isGitEditLocked);

    // Workflow → guard skipped; delete proceeds and fails downstream on the stub.
    await svc.delete(makeApp(APP_TYPES.WORKFLOW), makeUser()).catch(() => {});
    expect(isGitEditLocked).not.toHaveBeenCalled();
  });
});
