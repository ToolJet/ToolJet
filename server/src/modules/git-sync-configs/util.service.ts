import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { GitSyncEnvUtilService } from '@ee/organization-env/services/gitsync.util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { TransactionLogger } from '@modules/logging/service';
import { GitSyncDetails, IGitSyncConfigsUtilService } from './Interfaces/IUtilService';

@Injectable()
export class GitSyncConfigsUtilService implements IGitSyncConfigsUtilService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly gitSyncEnvUtilService: GitSyncEnvUtilService,
    protected readonly logger: TransactionLogger
  ) {}

  // Single source of truth for "is git sync active for this org" — combines the license
  // entitlement with the org's configured provider (DB row OR env-mapped config).
  // Returns empty options when either gate is off so callers don't need to re-check.
  async getDetails(organizationId: string, isGetConfigs: boolean): Promise<GitSyncDetails> {
    const empty: GitSyncDetails = {
      isEnabled: false,
      options: { type: null, defaultBranch: null, isBranchingEnabled: false },
      orgGit: null,
    };

    const licenseGitSync = await this.licenseTermsService.getLicenseTerms(
      [LICENSE_FIELD.GIT_SYNC, LICENSE_FIELD.GIT_SYNC_MULTI_BRANCH],
      organizationId
    );
    if (!licenseGitSync[LICENSE_FIELD.GIT_SYNC]) return empty;

    return dbTransactionWrap(async (manager: EntityManager) => {
      const orgGit = await manager.findOne(OrganizationGitSync, {
        where: { organizationId },
        relations: ['gitSsh', 'gitHttps', 'gitLab'],
      });
      if (!orgGit) return empty;

      if (orgGit.useEnvConfig) {
        const activeProvider = this.gitSyncEnvUtilService.getActiveProvider(organizationId);
        if (!activeProvider || activeProvider === GITConnectionType.DISABLED) {
          this.logger.warn(
            `Git Sync env config enabled for org ${organizationId} but no provider configs found, treating as disabled`
          );
          return empty;
        }
        if (activeProvider === GITConnectionType.GITHUB_HTTPS) {
          const githubHttpsCfg = await this.gitSyncEnvUtilService.getGitHttpsConfig(organizationId);
          if (!githubHttpsCfg) {
            this.logger.warn(
              `Git Sync env config enabled for org ${organizationId} with active provider ${activeProvider} but no config found, treating as disabled`
            );
            return empty;
          }
          orgGit.gitHttpsEnv = {
            isEnabled: true,
            githubBranch: githubHttpsCfg.githubBranch,
            githubAppId: githubHttpsCfg.githubAppId,
            githubInstallationId: githubHttpsCfg.githubInstallationId,
            githubPrivateKey: githubHttpsCfg.githubPrivateKey,
            githubEnterpriseUrl: githubHttpsCfg.githubEnterpriseUrl,
            githubEnterpriseApiUrl: githubHttpsCfg.githubEnterpriseApiUrl,
          };
        } else if (activeProvider === GITConnectionType.GITHUB_SSH) {
          const githubSshCfg = await this.gitSyncEnvUtilService.getGitSshConfig(organizationId);
          if (!githubSshCfg) {
            this.logger.warn(
              `Git Sync env config enabled for org ${organizationId} with active provider ${activeProvider} but no config found, treating as disabled`
            );
            return empty;
          }
          orgGit.gitSshEnv = {
            isEnabled: true,
            gitUrl: githubSshCfg.gitUrl,
            gitBranch: githubSshCfg.gitBranch,
            sshPrivateKey: githubSshCfg.sshPrivateKey,
            sshPublicKey: githubSshCfg.sshPublicKey,
            keyType: githubSshCfg.keyType,
          };
        } else if (activeProvider === GITConnectionType.GITLAB) {
          const gitlabCfg = await this.gitSyncEnvUtilService.getGitLabConfig(organizationId);
          if (!gitlabCfg) {
            this.logger.warn(
              `Git Sync env config enabled for org ${organizationId} with active provider ${activeProvider} but no config found, treating as disabled`
            );
            return empty;
          }
          orgGit.gitLabEnv = {
            isEnabled: true,
            gitlabUrl: gitlabCfg.gitlabUrl,
            gitlabBranch: gitlabCfg.gitlabBranch,
            gitlabProjectAccessToken: gitlabCfg.gitlabProjectAccessToken,
            gitlabEnterpriseUrl: gitlabCfg.gitlabEnterpriseUrl,
          };
        } else {
          this.logger.warn(
            `Git Sync env config enabled for org ${organizationId} with unrecognized active provider ${activeProvider}, treating as disabled`
          );
          return empty;
        }
        // Mirror BaseGitUtilService.findOrgGitByOrganizationId so callers reading orgGit see
        // the same envGitProvider hint as the rest of the codebase.
        orgGit.envGitProvider = activeProvider;
      }

      const activeType = this.resolveActiveProviderType(orgGit);
      if (!activeType) return empty;

      let defaultBranchRow: { id: string; name: string } | null = await manager.findOne(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
        select: ['id', 'name'],
      });

      if (!defaultBranchRow) {
        // This should never happen since the default branch is seeded on org creation, but if it does we can still operate.
        // Log an error to make sure it's noticed and fixed.
        this.logger.error(
          `Git Sync enabled for org ${organizationId} but no default branch found, attempting to set/create one`
        );
        const defaultBranchName = this.deriveDefaultBranchName(orgGit);

        if (!defaultBranchName) {
          throw new Error(
            `Git Sync enabled for org ${organizationId} but no active provider found to derive default branch name from`
          );
        }

        defaultBranchRow = await this.ensureDefaultBranch(manager, organizationId, defaultBranchName);
      }

      return {
        isEnabled: true,
        options: {
          type: activeType,
          defaultBranch: defaultBranchRow ? { id: defaultBranchRow.id, name: defaultBranchRow.name } : null,
          isBranchingEnabled: true, // Branching always on when Git Sync is on; TODO: derive from LICENSE_FIELD.GIT_SYNC_MULTI_BRANCH once it's wired in helper.ts
        },
        orgGit: isGetConfigs ? orgGit : null,
      };
    });
  }

  // Look up a branch with the derived name; promote it (clearing stale defaults on siblings)
  // when present, otherwise insert. Wrapped in a unique-violation recovery so a lost race
  // (another tx inserted between findOne and save) re-reads and promotes the winner.
  private async ensureDefaultBranch(
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
      this.logger.log(`Promoted branch ${id} (${branchName}) as default for org ${organizationId}`);
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
      this.logger.log(`Created default branch ${created.id} (${branchName}) for org ${organizationId}`);
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

  // Env-config orgs only carry the branch on the *Env shadow fields (the persisted relations
  // are typically absent or have isEnabled=false). Check both shapes so this works for both.
  private deriveDefaultBranchName(orgGit: OrganizationGitSync): string | undefined {
    if (orgGit.gitSsh?.isEnabled) return orgGit.gitSsh.gitBranch;
    if (orgGit.gitHttps?.isEnabled) return orgGit.gitHttps.githubBranch;
    if (orgGit.gitLab?.isEnabled) return orgGit.gitLab.gitlabBranch;
    if (orgGit.gitSshEnv?.isEnabled) return orgGit.gitSshEnv.gitBranch;
    if (orgGit.gitHttpsEnv?.isEnabled) return orgGit.gitHttpsEnv.githubBranch;
    if (orgGit.gitLabEnv?.isEnabled) return orgGit.gitLabEnv.gitlabBranch;
    return;
  }

  // First DB-enabled provider wins; env-config orgs fall through to the *Env shadow fields
  // hydrated above (the persisted relations stay null/false in env-config mode).
  private resolveActiveProviderType(orgGit: OrganizationGitSync): GITConnectionType | null {
    if (orgGit.gitSsh?.isEnabled || orgGit.gitSshEnv?.isEnabled) return GITConnectionType.GITHUB_SSH;
    if (orgGit.gitHttps?.isEnabled || orgGit.gitHttpsEnv?.isEnabled) return GITConnectionType.GITHUB_HTTPS;
    if (orgGit.gitLab?.isEnabled || orgGit.gitLabEnv?.isEnabled) return GITConnectionType.GITLAB;
    return null;
  }
}
