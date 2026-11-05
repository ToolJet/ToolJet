import { QueryRunner } from 'typeorm';
import { withShortLock } from './with-short-lock';

/**
 * App Builder key moves (docs/APP_DEFINITION_MIGRATIONS.md): a key in stored component JSON gets a new place.
 * Release N's data migration copies each key and, in beforeCommit(), adds a trigger that keeps both places equal
 * whatever code writes them: an editor tab opened before the upgrade, an old pod, the release a rollback returns to.
 * The cleanup migration drops the trigger and the old places one upgrade later.
 */

/** JSON columns of `components`, as the database names them. */
export type ComponentJsonColumn =
  | 'properties'
  | 'styles'
  | 'general_properties'
  | 'general_styles'
  | 'validation'
  | 'display_preferences';

export interface ComponentKeyMove {
  /** Component types whose key moves, e.g. ['SvgImage']. */
  types: readonly string[];
  /** Where the previous release reads the key. */
  from: readonly [ComponentJsonColumn, string];
  /** Where this release reads it. */
  to: readonly [ComponentJsonColumn, string];
}

const BATCH_SIZE = 2000;
const NO_ID = '00000000-0000-0000-0000-000000000000';
const SYNC_FUNCTION = 'public.tj_sync_moved_component_keys';

const literal = (text: string) => `'${text.replace(/'/g, "''")}'`;
const json = (column: ComponentJsonColumn) => `COALESCE(${column}::jsonb, '{}'::jsonb)`;
const has = ([column, key]: ComponentKeyMove['from']) => `${json(column)} ? ${literal(key)}`;
const ofTypes = ({ types }: ComponentKeyMove) => `type IN (${types.map(literal).join(', ')})`;
const missingNewKey = (move: ComponentKeyMove) => `(${ofTypes(move)} AND ${has(move.from)} AND NOT ${has(move.to)})`;
const hasBothKeys = (move: ComponentKeyMove) => `(${ofTypes(move)} AND ${has(move.from)} AND ${has(move.to)})`;
const unique = <T>(items: T[]) => [...new Set(items)];
const place = ([column, key]: ComponentKeyMove['from']) => `${column}.${key}`;

/** Readable summary for logs, e.g. "SvgImage styles.visibility -> properties.visibility". */
export const describeMoves = (moves: readonly ComponentKeyMove[]) =>
  moves.map((move) => `${move.types.join('/')} ${place(move.from)} -> ${place(move.to)}`).join(', ');

/** Rows where some move still has to copy its key. */
export const rowsMissingNewKeys = (moves: readonly ComponentKeyMove[]) => moves.map(missingNewKey).join(' OR ');

/** SET list that copies each key to its new place unless it is already there; the old places stay. */
export function copyToNewKeys(moves: readonly ComponentKeyMove[]): string {
  return unique(moves.map(({ to: [column] }) => column))
    .map((column) => {
      const additions = moves
        .filter(({ to }) => to[0] === column)
        .map(
          (move) =>
            `CASE WHEN ${missingNewKey(move)} THEN jsonb_build_object(${literal(move.to[1])}, ` +
            `${move.from[0]}::jsonb -> ${literal(move.from[1])}) ELSE '{}'::jsonb END`
        );
      return `${column} = (${[json(column), ...additions].join(' || ')})::json`;
    })
    .join(',\n');
}

/** SET list that removes each old key where its new key exists; columns with nothing to remove stay as stored. */
function removeOldKeys(moves: readonly ComponentKeyMove[]): string {
  return unique(moves.map(({ from: [column] }) => column))
    .map((column) => {
      const moved = moves.filter(({ from }) => from[0] === column);
      const keys = moved.map((move) => `CASE WHEN ${hasBothKeys(move)} THEN ${literal(move.from[1])} END`);
      return (
        `${column} = CASE WHEN ${moved.map(hasBothKeys).join(' OR ')} ` +
        `THEN (${column}::jsonb - array_remove(ARRAY[${keys.join(', ')}]::text[], NULL))::json ELSE ${column} END`
      );
    })
    .join(',\n');
}

const triggerName = (sync: string) => {
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(sync)) {
    throw new Error(`Key move sync name "${sync}" must be snake_case, at most 40 characters.`);
  }
  return `trg_components_sync_${sync}`;
};

/**
 * Keeps each move's two places equal on every insert and update. A value written at the new place goes to the old
 * place, so the release a rollback returns to shows it; a value written at the old place, by code that still reads
 * it, goes to the new place. On a conflict the new place wins. Removing a key is not copied.
 */
const SYNC_FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION ${SYNC_FUNCTION}() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  move jsonb;
  from_column text;
  from_key text;
  to_column text;
  to_key text;
  row_now jsonb := to_jsonb(NEW);
  row_before jsonb;
  from_value jsonb;
  to_value jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    row_before := to_jsonb(OLD);
  END IF;
  FOR move IN SELECT value FROM jsonb_array_elements(TG_ARGV[0]::jsonb) LOOP
    CONTINUE WHEN NOT (move -> 'types') ? NEW.type;
    from_column := move #>> '{from,0}';
    from_key := move #>> '{from,1}';
    to_column := move #>> '{to,0}';
    to_key := move #>> '{to,1}';
    from_value := row_now -> from_column -> from_key;
    to_value := row_now -> to_column -> to_key;
    IF to_value IS NOT NULL AND to_value IS DISTINCT FROM from_value AND (
         (TG_OP = 'INSERT' AND from_value IS NULL)
         OR (TG_OP = 'UPDATE' AND to_value IS DISTINCT FROM row_before -> to_column -> to_key)) THEN
      NEW := jsonb_populate_record(NEW, jsonb_build_object(from_column, jsonb_set(
        CASE WHEN jsonb_typeof(row_now -> from_column) = 'object' THEN row_now -> from_column ELSE '{}'::jsonb END,
        ARRAY[from_key], to_value)));
    ELSIF from_value IS NOT NULL AND from_value IS DISTINCT FROM to_value AND (
         (TG_OP = 'INSERT' AND to_value IS NULL)
         OR (TG_OP = 'UPDATE' AND from_value IS DISTINCT FROM row_before -> from_column -> from_key)) THEN
      NEW := jsonb_populate_record(NEW, jsonb_build_object(to_column, jsonb_set(
        CASE WHEN jsonb_typeof(row_now -> to_column) = 'object' THEN row_now -> to_column ELSE '{}'::jsonb END,
        ARRAY[to_key], from_value)));
    END IF;
    row_now := to_jsonb(NEW);
  END LOOP;
  RETURN NEW;
END
$$`;

/**
 * For a data migration's beforeCommit(): adds the trigger that keeps both places equal until the cleanup.
 * CREATE TRIGGER takes a SHARE ROW EXCLUSIVE lock, which pauses writes to components, never reads, until commit.
 * Guarded instead of DROP + CREATE: data migrations may not drop, and CREATE OR REPLACE TRIGGER needs PostgreSQL 14.
 */
export async function createKeyMoveSync(
  queryRunner: QueryRunner,
  sync: string,
  moves: readonly ComponentKeyMove[]
): Promise<void> {
  const trigger = triggerName(sync);
  const columns = unique(moves.flatMap(({ from, to }) => [from[0], to[0]]));
  const types = unique(moves.flatMap((move) => [...move.types]));
  const args = JSON.stringify(moves.map(({ types: moveTypes, from, to }) => ({ types: moveTypes, from, to })));
  await queryRunner.query(SYNC_FUNCTION_SQL);
  await queryRunner.query(`
    DO $do$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'components'::regclass AND tgname = ${literal(trigger)}) THEN
        CREATE TRIGGER ${trigger}
          BEFORE INSERT OR UPDATE OF ${columns.join(', ')} ON components
          FOR EACH ROW WHEN (NEW.type IN (${types.map(literal).join(', ')}))
          EXECUTE FUNCTION ${SYNC_FUNCTION}(${literal(args)});
      END IF;
    END
    $do$`);
}

/** Removes the trigger createKeyMoveSync() added. The shared trigger function stays; other moves may use it. */
export const dropKeyMoveSync = (sync: string) => `DROP TRIGGER IF EXISTS ${triggerName(sync)} ON components`;

/**
 * For a data migration's up(): copies each key to its new place where it is missing, in batches by id, with one
 * bulk UPDATE per batch. Returns the app versions it touched, for deleteAppHistoryForStructuralMigration.
 */
export async function copyMovedKeys(
  queryRunner: QueryRunner,
  migrationName: string,
  moves: readonly ComponentKeyMove[]
): Promise<string[]> {
  const needsCopy = rowsMissingNewKeys(moves);
  const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${needsCopy}`);
  const total = parseInt(count, 10);
  console.log(`${migrationName}: [START] Copy ${describeMoves(moves)} | Total: ${total}`);

  const touchedVersions = new Set<string>();
  let lastId = NO_ID;
  let done = 0;
  while (true) {
    const rows: { id: string }[] = await queryRunner.query(
      `SELECT id FROM components WHERE (${needsCopy}) AND id > $1 ORDER BY id LIMIT $2`,
      [lastId, BATCH_SIZE]
    );
    if (!rows.length) break;
    lastId = rows[rows.length - 1].id;
    const ids = rows.map((row) => row.id);
    await queryRunner.query(`UPDATE components SET ${copyToNewKeys(moves)} WHERE id = ANY($1::uuid[])`, [ids]);
    const versions: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id FROM components c JOIN pages p ON p.id = c.page_id WHERE c.id = ANY($1::uuid[])`,
      [ids]
    );
    versions.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
    done += rows.length;
    console.log(`${migrationName}: [PROGRESS] ${done}/${total} (${((done / total) * 100).toFixed(1)}%)`);
  }
  console.log(`${migrationName}: [SUCCESS] Copy finished. Updated: ${done}`);
  return [...touchedVersions];
}

/**
 * For the cleanup migration: drops the trigger in its own short step, then per batch of ids copies any key still
 * missing at its new place and removes the old keys. Each batch is its own short transaction, so it holds row locks
 * only briefly and never runs under the trigger drop's ACCESS EXCLUSIVE lock. Every step is safe to run twice.
 */
export async function contractMovedKeys(
  queryRunner: QueryRunner,
  sync: string,
  moves: readonly ComponentKeyMove[]
): Promise<void> {
  await withShortLock(queryRunner, [dropKeyMoveSync(sync)]);
  const needsCopy = rowsMissingNewKeys(moves);
  const hasOldKeys = moves.map(hasBothKeys).join(' OR ');
  let lastId = NO_ID;
  while (true) {
    const rows: { id: string }[] = await queryRunner.query(
      `SELECT id FROM components WHERE (${needsCopy} OR ${hasOldKeys}) AND id > $1 ORDER BY id LIMIT $2`,
      [lastId, BATCH_SIZE]
    );
    if (!rows.length) break;
    lastId = rows[rows.length - 1].id;
    const batch = `id = ANY(${literal(`{${rows.map((row) => row.id).join(',')}}`)}::uuid[])`;
    await withShortLock(queryRunner, [
      `UPDATE components SET ${copyToNewKeys(moves)} WHERE ${batch} AND (${needsCopy})`,
      `UPDATE components SET ${removeOldKeys(moves)} WHERE ${batch} AND (${hasOldKeys})`,
    ]);
  }
}
