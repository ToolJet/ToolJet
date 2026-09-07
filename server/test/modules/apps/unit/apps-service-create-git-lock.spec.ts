/**
 * Regression: creating an app in a git-configured-but-unlicensed workspace must be BLOCKED
 * (assertNotGitLicenseLocked → ForbiddenException "Turn off git sync to continue"). Mirror of the
 * delete guard; workflows are exempt (not git-synced).
 *
 * create() runs the guard and then `dbTransactionWrap(...)` — nothing else on `this` in between. We
 * mock dbTransactionWrap to reject with a sentinel so we can tell "guard threw" (never reaches the
 * body) from "guard passed" (reaches the body → sentinel) without wiring the full create flow, and
 * drive the real method off the prototype with only gitSyncConfigsUtilService set.
 */
import { ForbiddenException } from '@nestjs/common';

const dbTransactionWrap = jest.fn().mockRejectedValue(new Error('db-reached'));
jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: (...args: any[]) => dbTransactionWrap(...args),
}));

import { AppsService } from '../../../../src/modules/apps/service';
import { APP_TYPES } from '../../../../src/modules/apps/constants';

const makeSvc = (isGitEditLocked: jest.Mock) => {
  const svc = Object.create(AppsService.prototype) as AppsService;
  (svc as any).gitSyncConfigsUtilService = { isGitEditLocked };
  return svc;
};
const user = { id: 'u1', organizationId: 'org-1' } as any;
const dto = (type: string) => ({ name: 'my-app', type }) as any;

describe('AppsService.create — git license lock', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ForbiddenException and never reaches the create body when git is unlicensed', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(true);
    const svc = makeSvc(isGitEditLocked);

    await expect(svc.create(user, dto(APP_TYPES.FRONT_END))).rejects.toThrow(
      'Your plan has expired. Turn off git sync to continue.'
    );
    expect(dbTransactionWrap).not.toHaveBeenCalled();
  });

  it('is a ForbiddenException instance', async () => {
    const svc = makeSvc(jest.fn().mockResolvedValue(true));
    await expect(svc.create(user, dto(APP_TYPES.FRONT_END))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('checks the lock and proceeds to the create body when NOT locked', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(false);
    const svc = makeSvc(isGitEditLocked);

    await expect(svc.create(user, dto(APP_TYPES.FRONT_END))).rejects.toThrow('db-reached');
    expect(isGitEditLocked).toHaveBeenCalledWith('org-1');
    expect(dbTransactionWrap).toHaveBeenCalled();
  });

  it('skips the lock check for workflows (not git-synced)', async () => {
    const isGitEditLocked = jest.fn().mockResolvedValue(true);
    const svc = makeSvc(isGitEditLocked);

    await expect(svc.create(user, dto(APP_TYPES.WORKFLOW))).rejects.toThrow('db-reached');
    expect(isGitEditLocked).not.toHaveBeenCalled();
  });
});
