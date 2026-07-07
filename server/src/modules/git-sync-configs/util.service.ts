import { HttpException, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { GetDetailsOptions, GitSyncDetails, IGitSyncConfigsUtilService } from './Interfaces/IUtilService';

const logger = new Logger('GitSyncConfigsUtilService');

// Helpers are module-level functions (not class members) on purpose: the EE
// GitSyncConfigsUtilService is assigned to CE-typed fields across the codebase, and any
// private/protected class member not shared between the two classes would break that
// structural assignability. The CE class therefore exposes only the public getDetails.

// Every org has a default branch (seeded on creation / backfilled by the
// EnsureDefaultBranchForAllOrganizations migration) and branch_id is now mandatory on
// version rows. Resolve it; if it's somehow missing, create one named 'main' as a safety
// net. Mirrors the EE util's resolveDefaultBranch (CE has no provider to derive a name
// from, so it always uses 'main' — the migration's default).
async function resolveDefaultBranch(
  manager: EntityManager,
  organizationId: string
): Promise<{ id: string; name: string }> {
  const existing = await manager.findOne(WorkspaceBranch, {
    where: { organizationId, isDefault: true },
    select: ['id', 'name'],
  });
  if (existing) return { id: existing.id, name: existing.name };

  logger.error(`No default branch found for org ${organizationId}; creating one as a fallback`);
  return ensureDefaultBranch(manager, organizationId, 'main');
}

// Look up a branch with the given name; promote it (clearing stale defaults on siblings)
// when present, otherwise insert. Wrapped in a unique-violation recovery so a lost race
// (another tx inserted between findOne and save) re-reads and promotes the winner.
// Mirrors GitSyncConfigsUtilService.ensureDefaultBranch in the EE util.
async function ensureDefaultBranch(
  manager: EntityManager,
  organizationId: string,
  branchName: string
): Promise<{ id: string; name: string }> {
  const promote = async (id: string): Promise<{ id: string; name: string }> => {
    await manager
      .createQueryBuilder()
      .update(WorkspaceBranch)
      .set({ isDefault: false })
      .where('organization_id = :organizationId', { organizationId })
      .andWhere('is_default = true')
      .andWhere('id <> :id', { id })
      .execute();
    await manager.update(WorkspaceBranch, { id }, { isDefault: true });
    return { id, name: branchName };
  };

  const existing = await manager.findOne(WorkspaceBranch, {
    where: { organizationId, name: branchName },
    select: ['id'],
  });
  if (existing) return promote(existing.id);

  try {
    const created = await manager.save(
      manager.create(WorkspaceBranch, {
        organizationId,
        name: branchName,
        isDefault: true,
      })
    );
    return { id: created.id, name: branchName };
  } catch (err: any) {
    // Postgres unique_violation — another tx inserted the same (organizationId, name)
    // between the findOne and save. Re-read and promote that row instead of failing.
    if (err?.code === '23505') {
      const winner = await manager.findOne(WorkspaceBranch, {
        where: { organizationId, name: branchName },
        select: ['id'],
      });
      if (winner) return promote(winner.id);
    }
    throw err;
  }
}

// CE stub. Git sync is an EE-only feature, so the community edition always reports the
// disabled state. The full implementation lives in ee/git-sync-configs/util.service.ts.
// The default branch, however, is edition-independent — every org has one (branch_id is
// mandatory on version rows) — so it is resolved (and lazily created as a safety net)
// and returned even on CE, mirroring the EE util.
@Injectable()
export class GitSyncConfigsUtilService implements IGitSyncConfigsUtilService {
  async getDetails(
    organizationId: string,
    _orgGitObj?: OrganizationGitSync,
    options: GetDetailsOptions = {}
  ): Promise<GitSyncDetails> {
    const { isGitMandatory = false, isMultiBranchingMandatory = false } = options;
    // Mandatory-git (or mandatory multi-branch, which requires git) callers expect git to be
    // enabled; on CE it never is, so surface the same 451 the EE license gate would. Non-mandatory
    // callers get the disabled shape, still carrying the org's default branch.
    if (isGitMandatory || isMultiBranchingMandatory) {
      throw new HttpException('Git Sync is not available on the current license plan.', 451);
    }
    return dbTransactionWrap(async (manager: EntityManager) => {
      const defaultBranch = await resolveDefaultBranch(manager, organizationId);
      return {
        isEnabled: false,
        isMultiBranchingEnabled: false,
        options: {
          type: null,
          defaultBranch: { id: defaultBranch.id, name: defaultBranch.name },
          isBranchingEnabled: false,
        },
        orgGit: null,
      };
    });
  }
}
