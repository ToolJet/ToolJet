import React, { useMemo, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Field, FieldError, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Rocket/Select/Select';
import { getLocalTimeZone, timeZonesWithOffsets } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { dataTypes } from '../../constants';
import { canBeUnique } from '../TableDrawer/columnRules';
import { DefaultValueCell } from '../TableDrawer/DefaultValueCell';
import { NameField } from '../TableDrawer/NameField';
import { TypeSelect } from '../TableDrawer/TypeSelect';
import type { DraftRelation } from '../TableDrawer/types';
import { COLUMN_NAME_EMPTY_ERROR, getColumnNameError } from './columnNameRules';
import { ConstraintCheckbox } from './ConstraintCheckbox';
import type { useColumnDraft } from './useColumnDraft';

export const DEFAULT_REQUIRED_ERROR =
  'Default value is required to populate this field in existing rows as NOT NULL constraint is added';

type ColumnFieldsProps = {
  draft: ReturnType<typeof useColumnDraft>;
  /** The table's other columns, for the duplicate check. */
  otherNames: string[];
  /** Relations the default value picks from; named by the column's saved name. */
  defaultRelations: DraftRelation[];
  /** The type cannot change; says why. */
  typeLockReason?: string | null;
  /** The types offered; all by default. */
  types?: typeof dataTypes;
  /** In the type list, under the options. */
  typeFooter?: ReactNode;
  /** Under the type field (what changing the type will do to the rows). */
  typeNotice?: ReactNode;
  /** The default cannot change (a primary key, an auto-incrementing column). */
  defaultLocked?: boolean;
  /** A note under the default field. */
  defaultWarning?: string | null;
};

const uniqueReason = (type: string | null, isPrimaryKey: boolean) => {
  if (isPrimaryKey) return 'Primary key values must be unique';
  if (type === 'serial') return 'Serial data type value must be unique';
  if (type === 'boolean') return 'Unique constraint cannot be added for boolean type column';
  if (type === 'jsonb') return 'Unique constraint cannot be added for JSON type column';
  return 'Unique constraint cannot be added for this type column';
};

// The fields both column drawers share. What differs between adding and editing comes in as props.
export function ColumnFields({
  draft,
  otherNames,
  defaultRelations,
  typeLockReason,
  types,
  typeFooter,
  typeNotice,
  defaultLocked,
  defaultWarning,
}: ColumnFieldsProps) {
  const { column } = draft;
  const type = column.data_type;
  const isPrimaryKey = column.constraints_type.is_primary_key;
  const isSerial = type === 'serial';
  const notNullFixed = isPrimaryKey || isSerial;
  const uniqueFixed = isPrimaryKey || isSerial || !canBeUnique(type);

  const timezones = useMemo(() => {
    const seen = new Set<string>();
    // The browser's own zone comes first and is listed again further down.
    return timeZonesWithOffsets().filter((zone: { value: string }) => !seen.has(zone.value) && !!seen.add(zone.value));
  }, []);
  const timezone = (column.configurations.timezone as string | undefined) || getLocalTimeZone();

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <NameField
        id="column-name"
        label="Column name"
        placeholder="Enter column name"
        value={column.column_name}
        onChange={draft.setName}
        autoFocus
        getError={(name) => getColumnNameError(name, otherNames)}
        emptyError={COLUMN_NAME_EMPTY_ERROR}
        data-cy="column-name-input-field"
        labelDataCy="column-name-input-field-label"
      />

      <Field className="tw-gap-0.5" data-cy="data-type-dropdown-section">
        <FieldLabel className="tw-pl-0.5 tw-font-title-default" data-cy="data-type-input-field-label">
          Data type
        </FieldLabel>
        <TypeSelect
          value={type}
          onChange={draft.setType}
          disabled={!!typeLockReason}
          types={types}
          footer={typeFooter}
          className="tw-w-full"
        />
        {typeLockReason && (
          <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder" data-cy="data-type-locked-reason">
            {typeLockReason}
          </p>
        )}
        {typeNotice}
      </Field>

      {type === 'timestamp with time zone' && (
        <Field className="tw-gap-0.5" data-cy="timezone-type-dropdown-section">
          <FieldLabel className="tw-pl-0.5 tw-font-title-default">Display time</FieldLabel>
          <Select value={timezone} onValueChange={draft.setTimezone}>
            <SelectTrigger className="tw-w-full" aria-label="Display time">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent className="tw-z-[1100]">
              {timezones.map((zone: { value: string; label: string }) => (
                <SelectItem key={zone.value} value={zone.value}>
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field className="tw-gap-0.5">
        <FieldLabel className="tw-pl-0.5 tw-font-title-default" data-cy="default-value-input-field-label">
          Default value
        </FieldLabel>
        <DefaultValueCell
          column={column}
          relations={defaultRelations}
          onChange={draft.setDefault}
          onInvalid={draft.setDefaultInvalid}
          editing
          field
          disabled={defaultLocked}
          className="tw-px-2 md:tw-text-base"
          data-cy="default-value-input-field"
        />
        {draft.requiresDefault && (
          <div className="tw-flex tw-items-start tw-gap-0.5">
            <TriangleAlert className="tw-mt-0.5 tw-size-3 tw-shrink-0 tw-text-icon-danger" aria-hidden />
            <FieldError className="tw-font-body-small">{DEFAULT_REQUIRED_ERROR}</FieldError>
          </div>
        )}
        {defaultWarning && <p className="tw-m-0 tw-font-body-small tw-text-text-warning">{defaultWarning}</p>}
      </Field>

      <div className="tw-flex tw-flex-col tw-gap-3">
        <ConstraintCheckbox
          id="column-not-null"
          label="Not null"
          description="Don’t allow NULL values in this column."
          checked={column.constraints_type.is_not_null || isPrimaryKey}
          disabled={notNullFixed}
          reason={isPrimaryKey ? 'Primary key values cannot be null' : 'Serial data type cannot have null value'}
          onChange={draft.setNotNull}
          data-cy={column.constraints_type.is_not_null ? 'not-null-checkbox' : 'null-checkbox'}
        />
        <ConstraintCheckbox
          id="column-unique"
          label="Unique"
          description="Don’t allow duplicate values in this column."
          checked={column.constraints_type.is_unique || isPrimaryKey}
          disabled={uniqueFixed}
          reason={uniqueReason(type, isPrimaryKey)}
          onChange={draft.setUnique}
          data-cy="unique-checkbox"
        />
      </div>
    </div>
  );
}
