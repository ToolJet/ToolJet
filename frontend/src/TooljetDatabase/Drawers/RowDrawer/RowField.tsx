import React, { memo, useEffect, useRef } from 'react';
import { KeyRound, TriangleAlert } from 'lucide-react';
import { Field, FieldError } from '@/components/ui/Rocket/Field/Field';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Switch } from '@/components/ui/Rocket/Switch/Switch';
import {
  ToggleGroup as RocketToggleGroup,
  ToggleGroupItem as RocketToggleGroupItem,
} from '@/components/ui/Rocket/ToggleGroup/ToggleGroup';
import { cn } from '@/lib/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';
import { TimestampField } from '../TableDrawer/TimestampField';
import { getUTCOffset } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { dataTypes } from '../../constants';
import { RowForeignKeyPicker } from './RowForeignKeyPicker';
import type { GridColumn } from '../../Table/Grid/useTableGrid';
import { canBeNull, hasDefault, isLocked, isPrimaryKey, isSerial, switchMode } from './rowRules';
import type { RowFieldState, RowFormKind, RowMode } from './rowRules';
// The JSON editor's look lives here (`tjdb-codehinter-wrapper-drawer`).
import '../../Forms/styles.scss';

// The legacy JS components infer their props from usage; these are the ones used here.
// ToggleGroup is untyped JS.
const ToggleGroup = RocketToggleGroup as unknown as React.ComponentType<Record<string, unknown>>;
const ToggleGroupItem = RocketToggleGroupItem as unknown as React.ComponentType<Record<string, unknown>>;
const Hinter = CodeHinter as unknown as React.ComponentType<Record<string, unknown>>;

const FOREIGN_KEY_TYPES = ['character varying', 'integer', 'bigint', 'serial', 'double precision'];

export type RowForeignKey = {
  column_names: string[];
  referenced_table_name: string;
  referenced_column_names: string[];
  referenced_table_id?: string;
};

type RowFieldProps = {
  column: GridColumn;
  kind: RowFormKind;
  state: RowFieldState;
  /** Edit: the stored value, so a trip through NULL comes back to it. */
  stored?: unknown;
  /** Server refusal or a rule that belongs to this field. */
  error?: string;
  foreignKey?: RowForeignKey;
  timezone: string;
  onChange: (state: RowFieldState) => void;
  /** Reports whether the JSON editor currently holds invalid JSON. */
  onInvalid: (invalid: boolean) => void;
  autoFocus?: boolean;
};

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

// What a column on Default stands for.
const defaultLabel = (column: GridColumn): string => {
  const fallback: unknown = column.column_default;
  return typeof fallback === 'object' ? JSON.stringify(fallback) : String(fallback);
};

// The editor reads its starting value once and holds its own text from then on: re-rendering it from the draft would
// reset the cursor on every keystroke, so it is memoised on the column name only.
const JsonValue = memo(
  ({
    columnName,
    initialValue,
    onChange,
    onInvalid,
  }: {
    columnName: string;
    initialValue: unknown;
    onChange: (value: unknown) => void;
    onInvalid: (invalid: boolean) => void;
  }) => (
    <div className="tjdb-codehinter-wrapper-drawer tw-w-full" onKeyDown={(event) => event.stopPropagation()}>
      <Hinter
        type="tjdbHinter"
        inEditor={false}
        initialValue={initialValue ? JSON.stringify(initialValue) : ''}
        lang="javascript"
        onChange={(value: string) => onChange((resolveReferences(`{{${value}}}`) as unknown[])[2])}
        componentName={`{} ${columnName}`}
        errorCallback={onInvalid}
        lineNumbers={false}
        placeholder="{}"
        columnName={columnName}
        showErrorMessage
      />
    </div>
  ),
  (previous, next) => previous.columnName === next.columnName
);
JsonValue.displayName = 'JsonValue';

// One column of the row drawers (Figma "Row field"): the type icon and name, a Null / Default / Custom toggle, and the
// value control for the column's type.
export function RowField({
  column,
  kind,
  state,
  stored,
  error,
  foreignKey,
  timezone,
  onChange,
  onInvalid,
  autoFocus,
}: RowFieldProps) {
  const { accessor, dataType, Header } = column;
  const locked = isLocked(column, kind);
  const key = isPrimaryKey(column) || isSerial(column);
  const typeIcon = dataTypes.find((type: { value: string }) => type.value === dataType)?.icon;
  const showDefault = hasDefault(column) && !isSerial(column) && !isLocked(column, kind);
  const dataCy = `${slug(Header)}-input-field`;
  const inputRef = useRef<HTMLInputElement>(null);
  // The first field takes the focus once the drawer is up. Not `autoFocus`: the menu that opened the drawer hands the
  // focus back to its trigger as it closes, which would win over a focus taken on mount.
  useEffect(() => {
    if (!autoFocus) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 150);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const pick = (mode: string) => {
    if (mode) onChange(switchMode(column, state, mode as RowMode, stored));
  };
  const toCustom = () => onChange(switchMode(column, state, 'custom', stored));

  const control = () => {
    if (locked) {
      const shown = isSerial(column) && kind === 'create' ? 'Auto-generated' : String(state.value ?? '');
      return (
        <Input
          value={shown}
          disabled
          readOnly
          title={isSerial(column) ? 'Serial values are generated and cannot be edited' : 'Key values cannot be edited'}
          data-cy={dataCy}
        />
      );
    }
    if (state.mode !== 'custom') {
      // A column on NULL or its default shows that as a disabled field; clicking it takes it back to Custom.
      return (
        <div className="tw-relative">
          <Input
            value={state.mode === 'null' ? 'NULL' : defaultLabel(column)}
            placeholder="Empty string"
            disabled
            readOnly
            data-cy={dataCy}
          />
          <button
            type="button"
            aria-label={`Edit ${Header}`}
            className="tw-absolute tw-inset-0 tw-cursor-pointer tw-border-0 tw-bg-transparent"
            onClick={toCustom}
          />
        </div>
      );
    }
    if (dataType === 'boolean') {
      return (
        <div className="tw-flex tw-h-8 tw-items-center">
          <Switch
            checked={state.value === true}
            onCheckedChange={(checked: boolean) => onChange({ mode: 'custom', value: checked })}
            data-cy={`${slug(Header)}-check-input`}
            aria-label={Header}
          />
        </div>
      );
    }
    if (dataType === 'timestamp with time zone') {
      return (
        <TimestampField
          value={state.value as string | null}
          onChange={(value) => onChange({ mode: 'custom', value: value ?? '' })}
          timezone={timezone}
          data-cy={dataCy}
        />
      );
    }
    if (dataType === 'jsonb') {
      return (
        <JsonValue
          columnName={accessor}
          initialValue={state.value}
          onChange={(value) => onChange({ mode: 'custom', value })}
          onInvalid={onInvalid}
        />
      );
    }
    if (foreignKey && FOREIGN_KEY_TYPES.includes(dataType)) {
      return (
        <RowForeignKeyPicker
          column={column}
          value={String(state.value ?? '')}
          foreignKey={foreignKey}
          onChange={(value) => onChange({ mode: 'custom', value })}
        />
      );
    }
    return (
      <Input
        ref={inputRef}
        value={String(state.value ?? '')}
        autoComplete="off"
        placeholder="Enter a value"
        aria-invalid={!!error}
        onChange={(event) => onChange({ mode: 'custom', value: event.target.value })}
        data-cy={dataCy}
      />
    );
  };

  return (
    <Field className="tw-gap-2">
      <div className="tw-flex tw-h-7 tw-items-center tw-justify-between tw-gap-2">
        <div
          className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1.5"
          data-cy={`${slug(Header)}-column-name-label`}
        >
          <span className="tw-flex tw-shrink-0 tw-items-center tw-text-icon-strong [&>svg]:tw-size-3.5">
            {key ? <KeyRound /> : typeIcon}
          </span>
          <span className="tw-truncate tw-font-title-default tw-text-text-default" title={Header}>
            {Header}
          </span>
          {dataType === 'timestamp with time zone' && (
            <span className="tw-shrink-0 tw-font-body-small tw-text-text-placeholder">{`UTC ${getUTCOffset(timezone)}`}</span>
          )}
          {foreignKey && (
            <span
              className="tw-shrink-0 tw-font-body-small tw-text-text-placeholder"
              title={`Foreign key relation: ${foreignKey.column_names[0]} → ${foreignKey.referenced_table_name}.${foreignKey.referenced_column_names[0]}`}
            >
              {`→ ${foreignKey.referenced_table_name}.${foreignKey.referenced_column_names[0]}`}
            </span>
          )}
        </div>
        {!locked && (
          <ToggleGroup type="single" size="medium" value={state.mode} onValueChange={pick}>
            <ToggleGroupItem value="null" disabled={!canBeNull(column)} data-cy={`${slug(Header)}-null-tab`}>
              Null
            </ToggleGroupItem>
            {showDefault && (
              <ToggleGroupItem value="default" data-cy={`${slug(Header)}-default-tab`}>
                Default
              </ToggleGroupItem>
            )}
            <ToggleGroupItem value="custom" data-cy={`${slug(Header)}-custom-tab`}>
              Custom
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      <div className={cn('tw-flex tw-flex-col tw-gap-0.5')}>
        {control()}
        {error && (
          <div className="tw-flex tw-items-center tw-gap-0.5">
            <TriangleAlert className="tw-size-3 tw-text-icon-danger" aria-hidden />
            <FieldError className="tw-font-body-small" data-cy="app-name-error-label">
              {error}
            </FieldError>
          </div>
        )}
      </div>
    </Field>
  );
}
