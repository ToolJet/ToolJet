/**
 * GitSyncConfigsUtilService (CE) + its module-level branch helpers
 * (resolveDefaultBranch / ensureDefaultBranch, exercised through getDetails).
 *
 * dbTransactionWrap is stubbed to invoke its callback with a fake EntityManager (the existing
 * pattern in git-sync-configs/service.spec.ts). No Nest app / DB.
 *
 * @group gitsync
 */
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any, manager?: any) => operation(manager ?? globalThis.__fakeManager)),
}));

import { HttpException } from '@nestjs/common';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';

describe('GitSyncConfigsUtilService (CE)', () => {
  let svc: GitSyncConfigsUtilService;
  let manager: any;
  let qb: any;

  beforeEach(() => {
    qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    manager = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((_e: any, v: any) => v),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };
    (globalThis as any).__fakeManager = manager;
    svc = new GitSyncConfigsUtilService();
  });

  describe('getDetails — license gate', () => {
    it('throws 451 when git is mandatory', async () => {
      await expect(svc.getDetails('org', undefined, { isGitMandatory: true })).rejects.toMatchObject({
        status: 451,
      } as Partial<HttpException>);
    });
    it('throws 451 when multi-branching is mandatory', async () => {
      await expect(svc.getDetails('org', undefined, { isMultiBranchingMandatory: true })).rejects.toBeInstanceOf(
        HttpException
      );
    });
  });

  describe('getDetails — disabled shape (CE)', () => {
    it('returns the disabled shape carrying the existing default branch', async () => {
      manager.findOne.mockResolvedValue({ id: 'b-default', name: 'main' }); // resolveDefaultBranch hit
      const res = await svc.getDetails('org1');
      expect(res).toMatchObject({
        isEnabled: false,
        isMultiBranchingEnabled: false,
        orgGit: null,
        options: { type: null, isBranchingEnabled: false, defaultBranch: { id: 'b-default', name: 'main' } },
      });
    });

    it('lazily creates a `main` default branch when none exists', async () => {
      // resolveDefaultBranch: no default → ensureDefaultBranch: no branch named main → insert
      manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      manager.save.mockResolvedValue({ id: 'new-main' });
      const res = await svc.getDetails('org1');
      expect(manager.save).toHaveBeenCalled();
      expect(res.options.defaultBranch).toEqual({ id: 'new-main', name: 'main' });
    });

    it('promotes an existing `main` branch (clearing sibling defaults) when there is no current default', async () => {
      // no default; a branch named main already exists → promote it
      manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'main-existing' });
      const res = await svc.getDetails('org1');
      expect(qb.update).toHaveBeenCalled(); // cleared stale sibling defaults
      expect(manager.update).toHaveBeenCalledWith(expect.anything(), { id: 'main-existing' }, { isDefault: true });
      expect(res.options.defaultBranch).toEqual({ id: 'main-existing', name: 'main' });
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('recovers from a unique-violation race (23505) by re-reading and promoting the winner', async () => {
      manager.findOne
        .mockResolvedValueOnce(null) // no default
        .mockResolvedValueOnce(null) // no branch named main (pre-insert)
        .mockResolvedValueOnce({ id: 'race-winner' }); // re-read after 23505
      manager.save.mockRejectedValue({ code: '23505' });
      const res = await svc.getDetails('org1');
      expect(res.options.defaultBranch).toEqual({ id: 'race-winner', name: 'main' });
      expect(manager.update).toHaveBeenCalledWith(expect.anything(), { id: 'race-winner' }, { isDefault: true });
    });

    it('rethrows a non-unique-violation save error', async () => {
      manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      manager.save.mockRejectedValue({ code: '42P01', message: 'boom' });
      await expect(svc.getDetails('org1')).rejects.toMatchObject({ code: '42P01' });
    });
  });

  describe('isGitEditLocked', () => {
    it('is always false on CE', async () => {
      await expect(svc.isGitEditLocked('org1')).resolves.toBe(false);
    });
  });
});
