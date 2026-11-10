import { v4 as uuidv4 } from 'uuid';
import { TableSchemaSnapshot } from './table-schema-snapshot';

/**
 * A column present in the new snapshot with no prior uuid (`column.uuid` undefined - there is no
 * `normalize*` step for arbitrary SQL to have minted one) is new: mint one now, the one place this
 * standing invariant ("a column uuid is minted only in a normalize* method") deliberately bends.
 * The `SQL *` dropped a prior column no longer in the snapshot - its entry is not carried forward.
 * Everything else keeps its existing uuid untouched.
 */
export function reconcileColumns(
  snapshot: TableSchemaSnapshot,
  currentConfigurations: { columns?: { configurations?: Record<string, unknown> } }
): { column_names: Record<string, string>; configurations: Record<string, unknown> } {
  const priorConfigurations = currentConfigurations?.columns?.configurations || {};

  const column_names: Record<string, string> = {};
  const configurations: Record<string, unknown> = {};

  for (const column of snapshot.columns) {
    const uuid = column.uuid || uuidv4();
    column_names[column.name] = uuid;
    configurations[uuid] = priorConfigurations[uuid] ?? {};
  }

  return { column_names, configurations };
}
