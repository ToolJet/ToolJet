import { capitalize } from 'lodash';

import {
  envHasRelation,
  findHeadMigrationId,
  formatMigrationNumber,
  isEnvironmentLocked,
  TABLE_ABSENT_TOOLTIP,
} from '../constants';

// The number of the migration an environment is at: the latest one it has applied that is still in the table's chain.
const headMigrationNumber = (migrations, appliedMigrationIds) => {
  const head = migrations.find((migration) => migration.id === findHeadMigrationId(migrations, appliedMigrationIds));
  return head ? formatMigrationNumber(head.migration_number) : undefined;
};

/**
 * The environment list for the header select, from two backend shapes:
 * - `relationsByEnvironment` (the open table's `environments` in the table list) says which environments have the table.
 * - `tableMigrations` (per table) holds the full migration chain and, per environment, which of those it has applied.
 * With no table open there is nothing to report per environment, so every environment is selectable and has no number.
 *
 * An environment without the table is not "behind": a table with a `baseline_error` still has a relation and stays
 * selectable, so this reads `has_relation` only.
 */
export function buildHeaderEnvironments({
  environments,
  selectedEnvironment,
  tableId,
  relationsByEnvironment,
  tableMigrations,
  multiEnvLocked,
  lockMessage,
}) {
  const hasTableContext = !!tableId;
  const migrations = tableMigrations?.migrations ?? [];

  return environments.map((environment) => {
    const isSelected = environment.id === selectedEnvironment.id;
    // The backend names environments in lower case.
    const base = { id: environment.id, name: capitalize(environment.name) };

    // The open environment stays selectable even when locked, or the user could not leave it.
    if (!isSelected && isEnvironmentLocked(environment, multiEnvLocked)) {
      return { ...base, disabled: true, disabledReason: lockMessage };
    }

    if (!hasTableContext) return base;

    const hasRelation = envHasRelation(relationsByEnvironment, environment.id);
    if (!hasRelation && !isSelected) return { ...base, disabled: true, disabledReason: TABLE_ABSENT_TOOLTIP };
    if (!hasRelation) return base;

    const applied = tableMigrations?.environments?.find((e) => e.environment_id === environment.id);
    return { ...base, meta: headMigrationNumber(migrations, applied?.applied_migration_ids ?? []) };
  });
}
