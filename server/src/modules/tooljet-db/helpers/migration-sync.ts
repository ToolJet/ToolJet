// Where a table's migrations are not yet applied, for the dot in the table list.
// - `pending_in_development`: development has migrations the next environment (staging) lacks.
// - `pending_in_staging`: development has nothing staging lacks, but production lacks what they have.
// - `null`: nothing is pending (or there is a single environment, so nothing to compare).
export type MigrationSync = 'pending_in_development' | 'pending_in_staging' | null;

const lacks = (source: Set<string>, target: Set<string>) => [...source].some((id) => !target.has(id));

/**
 * `appliedByEnvironment` holds, per licensed environment in priority order (development first, production last),
 * the ids of the migrations confirmed applied there; an environment with no copy of the table has an empty set.
 * Sets, never counts: an environment can hold as many migrations as another and still lack some of them. A migration
 * only a later environment has is not pending anywhere, so it is ignored.
 */
export function computeMigrationSync(appliedByEnvironment: Set<string>[]): MigrationSync {
  if (appliedByEnvironment.length < 2) return null;

  const [development, next] = appliedByEnvironment;
  if (lacks(development, next)) return 'pending_in_development';

  const production = appliedByEnvironment[appliedByEnvironment.length - 1];
  const upstream = appliedByEnvironment.slice(0, -1);
  if (upstream.some((source) => lacks(source, production))) return 'pending_in_staging';

  return null;
}
