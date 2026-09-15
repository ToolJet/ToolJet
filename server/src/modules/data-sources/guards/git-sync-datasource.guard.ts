import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSource } from '@entities/data_source.entity';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import {
  assertGitSyncEditAllowedForOrg,
  assertGitSyncCreateAllowedForOrg,
} from '@modules/git-sync-configs/guards/git-sync-edit-guard';

// OAuth-handshake keys that ride along with a save but aren't persisted data source content
// (see parseOptionsForOauthDataSource, which strips them after the token exchange) — irrelevant
// to whether this edit is "secrets only".
const OAUTH_FLOW_KEYS = new Set(['code', 'oauth2', 'provider', 'plugin_id']);

/**
 * True when every option in the incoming payload that actually differs from what's stored is
 * either an OAuth handshake key or explicitly marked encrypted. Encrypted fields (client_secret,
 * password, ...) can never survive git sync's export/restore round trip in the first place
 * (sanitizeOptionsForGit drops any encrypted value without a workspace_constant), so allowing
 * their edit on a synced default branch doesn't let anything git-tracked drift — it just lets
 * users complete setup for a data source git sync could never fully carry.
 */
function isSecretsOnlyEdit(incomingOptions: unknown, storedOptions: Record<string, any> | undefined): boolean {
  if (!Array.isArray(incomingOptions)) return false;
  const stored = storedOptions || {};
  for (const option of incomingOptions) {
    const key = option?.['key'];
    if (!key || OAUTH_FLOW_KEYS.has(key)) continue;
    if (option?.['encrypted'] === true) continue;
    const storedValue = stored[key]?.['value'];
    if (option?.['value'] !== storedValue) return false;
  }
  return true;
}

/**
 * CREATE guard: a data source can't be created on the default branch when branching is enabled
 * (and no feature-branch creates when branching is disabled). is_synced isn't checked on create.
 * Branch comes from the `branch_id` query param.
 */
@Injectable()
export class GitSyncDataSourceCreateGuard implements CanActivate {
  constructor(protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;
    if (!organizationId) return true;
    const branchId = request.query?.branch_id;
    await assertGitSyncCreateAllowedForOrg(this.gitSyncConfigsUtilService, organizationId, branchId, 'data source');
    return true;
  }
}

/**
 * EDIT guard: blocks editing a git-synced data source version on the default branch (and
 * feature-branch ops when branching is disabled). Resolves the DSV from `:id` + `branch_id`.
 */
@Injectable()
export class GitSyncDataSourceEditGuard implements CanActivate {
  constructor(
    protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;
    const dataSourceId = request.params?.id;
    if (!organizationId || !dataSourceId) return true;
    const branchId = request.query?.branch_id;
    const environmentId = request.query?.environment_id;

    const dsv = await dbTransactionWrap((manager: EntityManager) =>
      manager.findOne(DataSourceVersion, {
        where: { dataSourceId, ...(branchId ? { branchId } : {}) },
        select: ['id', 'branchId', 'isSynced'],
      })
    );

    let secretsOnly = false;
    if (dsv?.isSynced && Array.isArray(request.body?.options)) {
      const [storedOptions, dataSource] = await Promise.all([
        this.appEnvironmentUtilService.getOptions(
          dataSourceId,
          organizationId,
          environmentId,
          dsv.branchId ?? branchId
        ),
        dbTransactionWrap((manager: EntityManager) =>
          manager.findOne(DataSource, { where: { id: dataSourceId }, select: ['id', 'name'] })
        ),
      ]);
      const nameUnchanged = request.body?.name === undefined || request.body.name === dataSource?.name;
      secretsOnly = nameUnchanged && isSecretsOnlyEdit(request.body.options, storedOptions?.options);
    }

    await assertGitSyncEditAllowedForOrg(
      this.gitSyncConfigsUtilService,
      organizationId,
      { branchId: dsv?.branchId ?? branchId, isSynced: !!dsv?.isSynced, secretsOnly },
      'data source'
    );
    return true;
  }
}
