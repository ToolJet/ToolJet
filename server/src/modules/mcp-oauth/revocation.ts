import { Logger } from '@nestjs/common';
import { EntityManager, EntityTarget, In } from 'typeorm';
import { getTooljetEdition } from '@helpers/utils.helper';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { SSOConfigs } from '@entities/sso_config.entity';
import { SsoConfigOidcGroupSync } from '@entities/sso_config_oidc_group_sync.entity';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_LOGIN_SECURITY_KEYS, sameSecurityValue, ssoSecurityConfig } from './security-policy';

type RevocationScope = { userId?: string; organizationId?: string; clientId?: string };
type SecurityEntity = User | Organization | OrganizationUser | SSOConfigs | SsoConfigOidcGroupSync | InstanceSettings;
const fields = new Map<EntityTarget<any>, string[]>([
  [User, ['status']],
  [Organization, ['status', 'slug', 'domain', 'passwordAllowedDomains', 'passwordRestrictedDomains', 'inheritSSO']],
  [OrganizationUser, ['status', 'userId', 'organizationId']],
  [SSOConfigs, ['enabled', 'sso', 'configScope', 'organizationId', 'configs']],
  [SsoConfigOidcGroupSync, ['ssoConfigId', 'organizationId', 'claimName', 'groupMapping', 'enableGroupSync']],
  [InstanceSettings, ['key', 'value']],
]);

async function inTransaction<T>(manager: EntityManager, operation: (manager: EntityManager) => Promise<T>): Promise<T> {
  return manager.queryRunner?.isTransactionActive ? operation(manager) : manager.transaction(operation);
}

async function bestEffort(manager: EntityManager, operation: (manager: EntityManager) => Promise<void>) {
  try {
    // A savepoint is required: catching a failed SQL statement alone leaves the
    // enclosing platform transaction aborted. Do not log database error bodies.
    await manager.transaction(operation);
  } catch (error) {
    if (['57014', 'P0004'].includes(error?.code)) throw error;
    Logger.warn('External credential invalidation skipped after a database error', 'McpOAuthRevocation');
  }
}

/** Await inside the transaction that changes access. Independent security writes
 * share this lock; consent takes it exclusively before inserting and rechecking. */
export async function revokeMcpOAuthGrants(manager: EntityManager, scope: RevocationScope) {
  if (getTooljetEdition() !== 'cloud') return;
  await inTransaction(manager, (transaction) =>
    bestEffort(transaction, async (isolated) => {
      await isolated.query("SELECT pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'))");
      const values: string[] = [];
      const conditions = ['revoked_at IS NULL'];
      for (const [key, column] of [
        ['userId', 'user_id'],
        ['organizationId', 'organization_id'],
        ['clientId', 'client_id'],
      ]) {
        if (scope[key]) {
          values.push(scope[key]);
          conditions.push(`${column} = $${values.length}`);
        }
      }
      await isolated.query(`UPDATE mcp_oauth_grants SET revoked_at = now() WHERE ${conditions.join(' AND ')}`, values);
    })
  );
}

export async function lockSecurityChange(manager: EntityManager) {
  if (getTooljetEdition() !== 'cloud') return;
  await bestEffort(manager, async (isolated) => {
    await isolated.query("SELECT pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'))");
  });
}

/** Administrative termination and instance bans use this one path, including
 * while OAuth is disabled. Ordinary logout deliberately does not call it. */
export async function invalidateUserCredentials(manager: EntityManager, userId: string) {
  if (getTooljetEdition() !== 'cloud') return;
  await inTransaction(manager, (transaction) =>
    bestEffort(transaction, async (isolated) => {
      await isolated.query("SELECT pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'))");
      await isolated.query('SELECT id FROM users WHERE id=$1 FOR NO KEY UPDATE', [userId]);
      await revokeMcpOAuthGrants(isolated, { userId });
      await bestEffort(isolated, async (patManager) => {
        await patManager.query(
          'UPDATE user_personal_access_tokens SET expires_at = LEAST(expires_at, now()) WHERE user_id=$1',
          [userId]
        );
      });
    })
  );
}

function securityValue(target: EntityTarget<any>, row: any) {
  if (!row) return null;
  if (target === InstanceSettings && !INSTANCE_LOGIN_SECURITY_KEYS.includes(row.key)) return null;
  return Object.fromEntries(
    fields
      .get(target)
      .map((key) => [
        key,
        target === SSOConfigs && key === 'configs' ? ssoSecurityConfig(row.sso, row.configs) : (row[key] ?? null),
      ])
  );
}

async function changed(manager: EntityManager, target: EntityTarget<any>, before: any, after: any) {
  if (sameSecurityValue(securityValue(target, before), securityValue(target, after))) return;
  const scopes = new Map<string, RevocationScope>();
  for (const row of [before, after].filter(Boolean)) {
    const scope: RevocationScope =
      target === User
        ? { userId: row.id }
        : target === Organization
          ? { organizationId: row.id }
          : target === OrganizationUser
            ? { userId: row.userId, organizationId: row.organizationId }
            : target === InstanceSettings || (target === SSOConfigs && row.configScope === 'instance')
              ? {}
              : row.organizationId
                ? { organizationId: row.organizationId }
                : {};
    scopes.set(JSON.stringify(scope), scope);
  }
  for (const scope of scopes.values()) await revokeMcpOAuthGrants(manager, scope);
}

function defined(values: Record<string, any>) {
  return Object.fromEntries(Object.entries(values || {}).filter(([, value]) => value !== undefined));
}

function where(criteria: any) {
  return typeof criteria === 'string' ? { id: criteria } : Array.isArray(criteria) ? { id: In(criteria) } : criteria;
}

// These explicit write helpers are called by platform services/repositories, not
// ORM subscribers. Migrations and direct SQL do not acquire revocation behavior.
export async function updateSecurityEntity<T extends SecurityEntity>(
  manager: EntityManager,
  target: EntityTarget<T>,
  criteria: any,
  patch: any
) {
  const changesSecurity = fields.get(target).some((key) => patch[key] !== undefined);
  const changesPassword = target === User && patch.password !== undefined;
  if (getTooljetEdition() !== 'cloud' || (!changesSecurity && !changesPassword)) {
    return manager.update(target, criteria, patch);
  }
  return inTransaction(manager, async (transaction) => {
    await lockSecurityChange(transaction);
    const before = await transaction.find(target, {
      where: where(criteria),
      select: ['id', ...fields.get(target)] as any,
      loadEagerRelations: false,
      order: { id: 'ASC' } as any,
      lock: { mode: 'for_no_key_update' },
    });
    const result = await transaction.update(target, criteria, patch);
    for (const row of before) await changed(transaction, target, row, { ...row, ...defined(patch) });
    return result;
  });
}

export async function saveSecurityEntity<T extends SecurityEntity>(
  manager: EntityManager,
  target: EntityTarget<T>,
  entity: any
): Promise<T> {
  if (getTooljetEdition() !== 'cloud') return manager.save(target, entity);
  return inTransaction(manager, async (transaction) => {
    await lockSecurityChange(transaction);
    const before = entity.id
      ? await transaction.findOne(target, {
          where: { id: entity.id } as any,
          select: ['id', ...fields.get(target)] as any,
          loadEagerRelations: false,
          lock: { mode: 'for_no_key_update' },
        })
      : null;
    const result = await transaction.save(target, entity);
    await changed(transaction, target, before, { ...before, ...defined(result) });
    return result;
  });
}

export async function deleteSecurityEntity<T extends SecurityEntity>(
  manager: EntityManager,
  target: EntityTarget<T>,
  criteria: any
) {
  if (getTooljetEdition() !== 'cloud') return manager.delete(target, criteria);
  return inTransaction(manager, async (transaction) => {
    await lockSecurityChange(transaction);
    const before = await transaction.find(target, {
      where: where(criteria),
      select: ['id', ...fields.get(target)] as any,
      loadEagerRelations: false,
      order: { id: 'ASC' } as any,
      lock: { mode: 'for_no_key_update' },
    });
    const result = await transaction.delete(target, criteria);
    for (const row of before) await changed(transaction, target, row, null);
    return result;
  });
}

/** Application entry point for administrative client disabling. Keep the client
 * row before the policy lock, matching consent's client/policy lock order. */
export async function disableMcpOAuthClient(manager: EntityManager, clientId: string) {
  await inTransaction(manager, async (transaction) => {
    await transaction.query('UPDATE mcp_oauth_clients SET disabled=true WHERE id=$1', [clientId]);
    await revokeMcpOAuthGrants(transaction, { clientId });
  });
}
