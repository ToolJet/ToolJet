import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSource } from '@entities/data_source.entity';
import type { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import type { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { assertGitSyncEditAllowedForOrg } from '@modules/git-sync-configs/guards/git-sync-edit-guard';

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
 *
 * Only scalar (string/number/boolean) values are strictly diffed. Array/object-valued options
 * (headers, custom_auth_params, custom_query_params, access_token_custom_headers, ...) are
 * excluded from the check entirely: the frontend's key-value editor (HttpHeaders/index.js)
 * appends a fresh empty pair on any edit to the current last row, so the same field can arrive
 * structurally different on every save even with no meaningful change — these are config
 * plumbing, not git-tracked secrets, so they can't disqualify a secrets-only edit here.
 */
function isSecretsOnlyEdit(incomingOptions: unknown, storedOptions: Record<string, any> | undefined): boolean {
  if (!Array.isArray(incomingOptions)) return false;
  const stored = storedOptions || {};
  for (const option of incomingOptions) {
    const key = option?.['key'];
    if (!key || OAUTH_FLOW_KEYS.has(key)) continue;
    // encrypted arrives as either a boolean or the string "true" depending on the caller —
    // same defensive check used throughout workspace-git-sync-adapter.ts (sanitizeOptionsForGit,
    // restoreOptionsFromGit).
    if (option?.['encrypted'] === true || option?.['encrypted'] === 'true') continue;
    const value = option?.['value'];
    if (value !== null && typeof value === 'object') continue;
    const storedValue = stored[key]?.['value'];
    if (value !== storedValue) return false;
  }
  return true;
}

export interface DataSourceEditTarget {
  organizationId: string;
  dataSourceId: string;
  branchId?: string;
  environmentId?: string;
  name?: string;
  options?: unknown;
}

/**
 * The git-sync edit rule for one environment of a data source: resolves the DSV from the data
 * source + branch and refuses a synced default-branch edit unless it is secrets only (a name
 * change never is). The services are passed in so edition-resolved instances are used.
 */
export async function assertDataSourceEditAllowed(
  gitSyncConfigsUtilService: GitSyncConfigsUtilService,
  appEnvironmentUtilService: AppEnvironmentUtilService,
  target: DataSourceEditTarget
): Promise<void> {
  const { organizationId, dataSourceId, branchId, environmentId, name, options } = target;

  const dsv = await dbTransactionWrap((manager: EntityManager) =>
    manager.findOne(DataSourceVersion, {
      where: { dataSourceId, ...(branchId ? { branchId } : {}) },
      select: ['id', 'branchId', 'isSynced'],
    })
  );

  let secretsOnly = false;
  if (dsv?.isSynced && Array.isArray(options)) {
    const [storedOptions, dataSource] = await Promise.all([
      appEnvironmentUtilService.getOptions(dataSourceId, organizationId, environmentId, dsv.branchId ?? branchId),
      dbTransactionWrap((manager: EntityManager) =>
        manager.findOne(DataSource, {
          where: { id: dataSourceId },
          select: ['id', 'name'],
        })
      ),
    ]);
    const nameUnchanged = name === undefined || name === dataSource?.name;
    secretsOnly = nameUnchanged && isSecretsOnlyEdit(options, storedOptions?.options);
  }

  await assertGitSyncEditAllowedForOrg(
    gitSyncConfigsUtilService,
    organizationId,
    {
      branchId: dsv?.branchId ?? branchId,
      isSynced: !!dsv?.isSynced,
      secretsOnly,
    },
    'data source'
  );
}
