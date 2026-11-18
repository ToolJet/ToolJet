import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Field, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Rocket/Select/Select';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { Tag } from '@/components/ui/Rocket/Tag/Tag';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { canHaveRelation } from './columnRules';
import {
  canSaveRelation,
  isCompatibleTarget,
  RELATION_ACTIONS,
  toRelationPayload,
  type RelationForm,
} from './relationRules';
import type { DraftColumn, DraftRelation, RelationPayload } from './types';

type RelationFormCardProps = {
  /** The table the relation starts from. Always fixed. */
  tableName: string;
  columns: DraftColumn[];
  /** The relation being edited; omitted for a new one. */
  relation?: DraftRelation;
  onSave: (relation: RelationPayload) => void;
  onCancel: () => void;
};

type TargetColumn = { name: string; type: string | null };

const initialForm = (
  relation: DraftRelation | undefined,
  columns: DraftColumn[],
  tables: TableOption[]
): RelationForm => {
  if (!relation) {
    return {
      sourceColumn: '',
      sourceType: null,
      targetTable: null,
      targetColumn: '',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    };
  }
  const [sourceColumn] = relation.column_names;
  const table = tables.find((item) => item.table_name === relation.referenced_table_name);
  return {
    sourceColumn,
    sourceType: columns.find((column) => column.column_name === sourceColumn)?.data_type ?? null,
    targetTable: { name: relation.referenced_table_name, id: relation.referenced_table_id ?? table?.id },
    targetColumn: relation.referenced_column_names[0],
    onUpdate: relation.on_update,
    onDelete: relation.on_delete,
  };
};

type TableOption = { id?: string; table_name: string };

const Labelled = ({ label, disabled, children }: { label: string; disabled?: boolean; children: React.ReactNode }) => (
  <Field className="tw-gap-0.5">
    <FieldLabel className={`tw-pl-0.5 tw-font-title-default ${disabled ? 'tw-text-text-disabled' : ''}`}>
      {label}
    </FieldLabel>
    {children}
  </Field>
);

const Heading = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="tw-flex tw-flex-col">
    <span className="tw-font-title-default tw-text-text-default">{title}</span>
    {hint && <span className="tw-font-body-small tw-text-text-placeholder">{hint}</span>}
  </div>
);

const Arrow = () => <ArrowRight className="tw-mx-auto tw-mb-2 tw-size-4 tw-text-icon-default" aria-hidden />;

// Where a foreign key is added or changed, inline in the drawer instead of a drawer on top of it (Figma: Relation form).
export function RelationFormCard({ tableName, columns, relation, onSave, onCancel }: RelationFormCardProps) {
  const { tables, organizationId } = useTooljetDatabaseContext() as { tables: TableOption[]; organizationId: string };
  const { fetchTableMetadata } = useTjdbActions();
  const [form, setForm] = useState<RelationForm>(() => initialForm(relation, columns, tables));
  const [targetColumns, setTargetColumns] = useState<TargetColumn[]>([]);
  const isEditing = !!relation;

  const targetTableName = form.targetTable?.name;
  useEffect(() => {
    if (!targetTableName) return setTargetColumns([]);
    let current = true;
    fetchTableMetadata(organizationId, targetTableName).then(
      (metadata: { columns: { accessor: string; dataType: string }[] } | null) => {
        if (current && metadata) {
          setTargetColumns(metadata.columns.map((column) => ({ name: column.accessor, type: column.dataType })));
        }
      }
    );
    return () => {
      current = false;
    };
  }, [targetTableName, organizationId, fetchTableMetadata]);

  const compatible = targetColumns.filter((column) => isCompatibleTarget(form.sourceType, column.type));
  const sourceOptions = columns.filter(
    (column) => column.column_name.trim() !== '' && canHaveRelation(column.data_type)
  );
  const set = (change: Partial<RelationForm>) => setForm((current) => ({ ...current, ...change }));
  const targetColumnDisabled = !form.targetTable || !form.sourceColumn;

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-4 tw-rounded-default tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-4"
      data-cy="relation-form"
    >
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-font-title-default tw-text-text-default">
            {isEditing ? 'Edit relation' : 'New relation'}
          </span>
          <Tag variant="outline">Single</Tag>
        </div>
        <Button variant="ghost" iconOnly size="medium" aria-label="Discard relation" onClick={onCancel}>
          <X />
        </Button>
      </div>

      <div className="tw-grid tw-grid-cols-[1fr_32px_1fr] tw-items-end tw-gap-y-3">
        <Heading title="Source" hint="This table" />
        <div />
        <Heading title="Target" hint="The table being referenced" />

        <Labelled label="Table" disabled>
          <Select value={tableName} disabled>
            <SelectTrigger className="!tw-shadow-none" aria-label="Source table">
              <SelectValue>{tableName}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </Labelled>
        <Arrow />
        <Labelled label="Table">
          <Select
            value={form.targetTable?.name}
            onValueChange={(name) => {
              const table = tables.find((item) => item.table_name === name);
              set({ targetTable: { name, id: table?.id }, targetColumn: '' });
            }}
          >
            <SelectTrigger className="!tw-shadow-none" aria-label="Target table">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent className="tw-z-[1100]">
              {tables
                .filter((table) => table.table_name !== tableName)
                .map((table) => (
                  <SelectItem key={table.table_name} value={table.table_name}>
                    {table.table_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Labelled>

        <Labelled label="Column" disabled={isEditing}>
          <Select
            value={form.sourceColumn || undefined}
            disabled={isEditing}
            onValueChange={(name) => {
              const source = columns.find((column) => column.column_name === name);
              set({ sourceColumn: name, sourceType: source?.data_type ?? null, targetColumn: '' });
            }}
          >
            <SelectTrigger className="!tw-shadow-none" aria-label="Source column">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent className="tw-z-[1100]">
              {sourceOptions.map((column) => (
                <SelectItem key={column.id} value={column.column_name}>
                  {column.column_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labelled>
        <Arrow />
        <Labelled label="Column" disabled={targetColumnDisabled}>
          <Select
            value={form.targetColumn || undefined}
            disabled={targetColumnDisabled}
            onValueChange={(name) => set({ targetColumn: name })}
          >
            <SelectTrigger className="!tw-shadow-none" aria-label="Target column">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent className="tw-z-[1100]">
              {compatible.map((column) => (
                <SelectItem key={column.name} value={column.name}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labelled>
      </div>

      <Separator />

      <div className="tw-flex tw-flex-col tw-gap-3">
        <Heading title="Actions" hint="What happens to this table when a referenced row is updated or removed." />
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <Labelled label="On update">
            <Select value={form.onUpdate} onValueChange={(value) => set({ onUpdate: value })}>
              <SelectTrigger className="!tw-shadow-none" aria-label="On update">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-z-[1100]">
                {RELATION_ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labelled>
          <Labelled label="On remove">
            <Select value={form.onDelete} onValueChange={(value) => set({ onDelete: value })}>
              <SelectTrigger className="!tw-shadow-none" aria-label="On remove">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-z-[1100]">
                {RELATION_ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labelled>
        </div>
      </div>

      <div className="tw-flex tw-justify-end tw-gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" disabled={!canSaveRelation(form)} onClick={() => onSave(toRelationPayload(form))}>
          {isEditing ? 'Save relation' : 'Add relation'}
        </Button>
      </div>
    </div>
  );
}
