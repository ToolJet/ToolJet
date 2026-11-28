import { buildTypeChangeSql, castFor } from '../../columnTypeChange';
import type { DraftColumn, DraftConstraints } from '../TableDrawer/types';

/** The column as the server has it. */
export type SavedColumn = {
  name: string;
  dataType: string;
  columnDefault: string | null;
  constraints: DraftConstraints;
  configurations: Record<string, unknown>;
};

/** One line of the confirmation. A type change is shown as an arrow: the form draws it. */
export type PlannedChange = {
  type: 'edit';
  name: string;
  oldName?: string;
  detail?: string | { from: string; to: string };
};

export type ColumnEditPlan = {
  isRenamed: boolean;
  title: string;
  changes: PlannedChange[];
  /** A cast other than a lossless one is a SQL step, filled in here and required. */
  initialSql?: string;
  sqlRequired?: true;
  /** The `update_column` body. */
  request: (migrationName: string) => {
    column: {
      column_name: string;
      data_type: string;
      column_default?: string | null;
      constraints_type: DraftConstraints;
      configurations: Record<string, unknown>;
      new_column_name?: string;
    };
    migration_name?: string;
  };
};

/**
 * What saving the edit asks of the server: the title and lines of the confirmation, the request, and the SQL step of a
 * cast the request cannot do itself. Pure; the drawer runs it through the migration confirmation.
 */
export function planColumnEdit(saved: SavedColumn, edited: DraftColumn): ColumnEditPlan {
  const name = edited.column_name;
  const type = edited.data_type as string;
  const isRenamed = name !== saved.name;
  const isTypeChanged = !!type && type !== saved.dataType;
  const defaultValue = edited.column_default ?? '';
  const { is_not_null: notNull, is_unique: unique } = edited.constraints_type;

  // A lossless widening is the only cast `edit_column` performs itself. Every other supported cast needs a USING clause,
  // generated into a SQL step that runs after the request; the request then resends the *current* type, so it applies
  // the rename, default and constraints while that step performs the cast.
  const cast = isTypeChanged ? castFor(saved.dataType, type) : null;
  const isStructuredTypeChange = cast?.tier === 'lossless';
  const needsGeneratedSql = !!cast && !isStructuredTypeChange;

  // One line per changed dimension, all against the (possibly renamed) new name.
  const changes: PlannedChange[] = [];
  if (isRenamed) changes.push({ type: 'edit', name, oldName: saved.name });
  if (isTypeChanged) changes.push({ type: 'edit', name, detail: { from: saved.dataType, to: type } });
  if (notNull !== saved.constraints.is_not_null) {
    changes.push({ type: 'edit', name, detail: notNull ? 'add NOT NULL constraint' : 'drop NOT NULL constraint' });
  }
  if (defaultValue !== (saved.columnDefault ?? ''))
    changes.push({ type: 'edit', name, detail: `default ${defaultValue}` });
  if (unique !== saved.constraints.is_unique) {
    changes.push({ type: 'edit', name, detail: unique ? 'add UNIQUE constraint' : 'drop UNIQUE constraint' });
  }
  // Nothing above (a time zone alone): a plain line, so the list is not empty.
  if (changes.length === 0) changes.push({ type: 'edit', name });

  // A default that was null and is untouched stays null; one that was cleared goes as an empty string.
  const requestDefault = edited.column_default ?? (saved.columnDefault == null ? null : '');

  return {
    isRenamed,
    title: isRenamed ? `Rename column "${saved.name}" to "${name}"` : `Edit column "${saved.name}"`,
    changes,
    ...(needsGeneratedSql && {
      // The request runs first, so the cast names the column by its new name.
      initialSql: buildTypeChangeSql({
        columnName: name,
        targetType: type,
        hasDefault: !!edited.column_default || !!saved.columnDefault,
      }),
      sqlRequired: true as const,
    }),
    request: (migrationName) => ({
      column: {
        column_name: saved.name,
        data_type: isStructuredTypeChange ? type : saved.dataType,
        ...(saved.dataType !== 'serial' && { column_default: requestDefault }),
        constraints_type: {
          is_not_null: notNull,
          is_primary_key: saved.constraints.is_primary_key,
          is_unique: unique,
        },
        configurations: {
          ...saved.configurations,
          ...(saved.dataType === 'timestamp with time zone' && { timezone: edited.configurations.timezone }),
        },
        ...(isRenamed && { new_column_name: name }),
      },
      ...(migrationName && { migration_name: migrationName }),
    }),
  };
}
