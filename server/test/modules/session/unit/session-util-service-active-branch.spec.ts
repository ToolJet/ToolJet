/**
 * SessionUtilService.getActiveOrDefaultBranchId — last-active-branch tier for JwtStrategy.
 * @group platform
 */
const mockManager = {
  findOne: jest.fn(),
};
jest.mock('src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((cb: (manager: any) => Promise<any>) => cb(mockManager)),
}));

import { SessionUtilService } from '@modules/session/util.service';

const makeSvc = () => Object.create(SessionUtilService.prototype) as SessionUtilService;

describe('SessionUtilService.getActiveOrDefaultBranchId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null with no organizationId', async () => {
    const svc = makeSvc();
    await expect(svc.getActiveOrDefaultBranchId(undefined as any)).resolves.toBeNull();
  });

  it('uses the org default when no userId is given', async () => {
    const svc = makeSvc();
    (svc as any).getDefaultBranchId = jest.fn().mockResolvedValue('default-branch');
    await expect(svc.getActiveOrDefaultBranchId('org-1')).resolves.toBe('default-branch');
    expect(mockManager.findOne).not.toHaveBeenCalled();
  });

  it('uses the last-active branch when it still exists', async () => {
    const svc = makeSvc();
    (svc as any).getDefaultBranchId = jest.fn().mockResolvedValue('default-branch');
    mockManager.findOne
      .mockResolvedValueOnce({ lastBranchId: 'branch-x' }) // OrganizationUser lookup
      .mockResolvedValueOnce({ id: 'branch-x' }); // WorkspaceBranch existence check
    await expect(svc.getActiveOrDefaultBranchId('org-1', 'user-1')).resolves.toBe('branch-x');
    expect((svc as any).getDefaultBranchId).not.toHaveBeenCalled();
  });

  it('falls back to default when the last-active branch was deleted', async () => {
    const svc = makeSvc();
    (svc as any).getDefaultBranchId = jest.fn().mockResolvedValue('default-branch');
    mockManager.findOne.mockResolvedValueOnce({ lastBranchId: 'branch-deleted' }).mockResolvedValueOnce(undefined);
    await expect(svc.getActiveOrDefaultBranchId('org-1', 'user-1')).resolves.toBe('default-branch');
  });

  it('falls back to default when the user has no last-active branch', async () => {
    const svc = makeSvc();
    (svc as any).getDefaultBranchId = jest.fn().mockResolvedValue('default-branch');
    mockManager.findOne.mockResolvedValueOnce(undefined);
    await expect(svc.getActiveOrDefaultBranchId('org-1', 'user-1')).resolves.toBe('default-branch');
  });
});
