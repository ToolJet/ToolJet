import type { RelationPayload } from './types';

export const RELATION_ACTIONS = ['RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT'] as const;

/** What the relation form holds while it is open. Empty strings mean "not chosen yet". */
export type RelationForm = {
  sourceColumn: string;
  sourceType: string | null;
  targetTable: { name: string; id?: string } | null;
  targetColumn: string;
  onUpdate: string;
  onDelete: string;
};

/** Can a column of `sourceType` reference a column of `targetType`? Integer widths mix; anything else must match. */
export const isCompatibleTarget = (sourceType: string | null, targetType: string | null): boolean => {
  if (sourceType === 'integer') return targetType === 'integer' || targetType === 'serial';
  if (sourceType === 'bigint') return targetType === 'integer' || targetType === 'bigint';
  return sourceType === targetType;
};

export const canSaveRelation = (form: RelationForm): boolean =>
  !!form.sourceColumn && !!form.targetTable && !!form.targetColumn && !!form.onUpdate && !!form.onDelete;

export const toRelationPayload = (form: RelationForm): RelationPayload => ({
  column_names: [form.sourceColumn],
  referenced_table_name: form.targetTable?.name ?? '',
  referenced_table_id: form.targetTable?.id,
  referenced_column_names: [form.targetColumn],
  on_delete: form.onDelete,
  on_update: form.onUpdate,
});
