import { QueryRunner } from 'typeorm';
import { withShortLock } from './with-short-lock';

/**
 * App Builder key moves (docs/APP_DEFINITION_MIGRATIONS.md): a key in stored component JSON gets a new place.
 * Release N's data migration copies each key and, in beforeCommit(), adds a trigger that keeps both places equal
 * whatever code writes them: an editor tab opened before the upgrade, an old pod, the release a rollback returns to.
 * When the value's format changes too, each place keeps its own format. The cleanup migration drops the trigger and
 * the old places one upgrade later.
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
  /**
   * Only when the value's format changes too: SQL expressions over `value`, the jsonb being copied. `toNew` turns an
   * old-place value into what this release reads; `toOld` turns a new-place value back into what the previous release
   * reads, so a rollback still renders it. Strings, not functions: TypeORM loads every function a migration file
   * exports, even inside an array, as a migration class.
   */
  convert?: {
    toNew: string;
    toOld: string;
  };
}

const BATCH_SIZE = 2000;
const NO_ID = '00000000-0000-0000-0000-000000000000';

const literal = (text: string) => `'${text.replace(/'/g, "''")}'`;
/** `value` run through `expression`, an SQL expression over `value`; as it is without one. */
const converted = (expression: string | undefined, value: string) =>
  expression ? `(SELECT ${expression} FROM (SELECT ${value} AS value) AS converting)` : value;
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

/** SET list that copies each key to its new place, in the new format, unless it is already there; the old places stay. */
export function copyToNewKeys(moves: readonly ComponentKeyMove[]): string {
  return unique(moves.map(({ to: [column] }) => column))
    .map((column) => {
      const additions = moves
        .filter(({ to }) => to[0] === column)
        .map(
          (move) =>
            `CASE WHEN ${missingNewKey(move)} THEN jsonb_build_object(${literal(move.to[1])}, ` +
            `${converted(move.convert?.toNew, `(${move.from[0]}::jsonb -> ${literal(move.from[1])})`)}) ELSE '{}'::jsonb END`
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

/** One trigger and its function per sync name; a sync name is never reused. */
const syncObjects = (sync: string) => {
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(sync)) {
    throw new Error(`Key move sync name "${sync}" must be snake_case, at most 40 characters.`);
  }
  return { trigger: `trg_components_sync_${sync}`, fn: `public.tj_sync_${sync}` };
};

const valueNow = ([column, key]: ComponentKeyMove['from']) => `(NEW.${column}::jsonb -> ${literal(key)})`;
const valueBefore = ([column, key]: ComponentKeyMove['from']) =>
  `(row_before -> ${literal(column)} -> ${literal(key)})`;
const objectNow = (column: ComponentJsonColumn) =>
  `CASE WHEN jsonb_typeof(NEW.${column}::jsonb) = 'object' THEN NEW.${column}::jsonb ELSE '{}'::jsonb END`;

/**
 * One move's step in the trigger function. A value written at the new place goes to the old place, in the old format,
 * so the release a rollback returns to shows it; a value written at the old place, by code that still reads it, goes
 * to the new place in the new format. An insert fills whichever place is missing. On a conflict the new place wins.
 * Removing a key is not copied.
 */
const syncStep = (move: ComponentKeyMove) => `
  -- ${describeMoves([move])}
  IF NEW.type IN (${move.types.map(literal).join(', ')}) THEN
    old_value := ${valueNow(move.from)};
    new_value := ${valueNow(move.to)};
    IF new_value IS NOT NULL AND (CASE TG_OP WHEN 'INSERT' THEN old_value IS NULL
                                  ELSE new_value IS DISTINCT FROM ${valueBefore(move.to)} END) THEN
      NEW.${move.from[0]} := jsonb_set(${objectNow(move.from[0])}, ARRAY[${literal(move.from[1])}],
        ${converted(move.convert?.toOld, 'new_value')})::json;
    ELSIF old_value IS NOT NULL AND (CASE TG_OP WHEN 'INSERT' THEN new_value IS NULL
                                     ELSE old_value IS DISTINCT FROM ${valueBefore(move.from)} END) THEN
      NEW.${move.to[0]} := jsonb_set(${objectNow(move.to[0])}, ARRAY[${literal(move.to[1])}],
        ${converted(move.convert?.toNew, 'old_value')})::json;
    END IF;
  END IF;`;

/**
 * For a data migration's beforeCommit(): adds the trigger that keeps both places equal until the cleanup, with a
 * function of its own that holds the moves and their conversions as plain SQL. CREATE TRIGGER takes a SHARE ROW
 * EXCLUSIVE lock, which pauses writes to components, never reads, until commit. Guarded instead of DROP + CREATE:
 * data migrations may not drop, and CREATE OR REPLACE TRIGGER needs PostgreSQL 14.
 */
export async function createKeyMoveSync(
  queryRunner: QueryRunner,
  sync: string,
  moves: readonly ComponentKeyMove[]
): Promise<void> {
  const { trigger, fn } = syncObjects(sync);
  const columns = unique(moves.flatMap(({ from, to }) => [from[0], to[0]]));
  const types = unique(moves.flatMap((move) => [...move.types]));
  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $sync$
    DECLARE
      row_before jsonb;
      old_value jsonb;
      new_value jsonb;
    BEGIN
      IF TG_OP = 'UPDATE' THEN
        row_before := to_jsonb(OLD);
      END IF;${moves.map(syncStep).join('')}
      RETURN NEW;
    END
    $sync$`);
  await queryRunner.query(`
    DO $do$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'components'::regclass AND tgname = ${literal(trigger)}) THEN
        CREATE TRIGGER ${trigger}
          BEFORE INSERT OR UPDATE OF ${columns.join(', ')} ON components
          FOR EACH ROW WHEN (NEW.type IN (${types.map(literal).join(', ')}))
          EXECUTE FUNCTION ${fn}();
      END IF;
    END
    $do$`);
}

/** Removes the trigger createKeyMoveSync() added, then its function. */
export const dropKeyMoveSync = (sync: string) => {
  const { trigger, fn } = syncObjects(sync);
  return `DROP TRIGGER IF EXISTS ${trigger} ON components; DROP FUNCTION IF EXISTS ${fn}()`;
};

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
 * For the cleanup migration: drops the trigger and its function in their own short step, then per batch of ids copies
 * any key still missing at its new place and removes the old keys. Each batch is its own short transaction, so it holds
 * row locks only briefly and never runs under the trigger drop's ACCESS EXCLUSIVE lock. Every step is safe to run twice.
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
