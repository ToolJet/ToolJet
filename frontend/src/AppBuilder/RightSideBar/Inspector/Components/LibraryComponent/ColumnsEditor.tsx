import React, { useState } from 'react';

import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ListEditor, moveItem, useRowIds } from './ListEditor';
import { ColorField, Field, NumberField, SelectField, SwitchField, TextField } from './fields';

// A table's columns (inspector: 'columns'): add, reorder, rename and remove columns, and per column its data key,
// type, alignment, width, visibility, sorting and search, its type's format (decimals, currency, date format, badge
// colours, link text, image shape, progress maximum, action buttons) and its cell colours. It reads and writes the
// UI 2.0 Table's column objects ({ key, name, columnType, ... }) that the pack's DataTable takes. Keys the editor does
// not show (conditionalStyles, options...) are kept as they are.

type Column = Record<string, unknown>;

const ButtonSolidComponent = ButtonSolid as React.ComponentType<any>;

const isObject = (v: unknown): v is Column => v !== null && typeof v === 'object' && !Array.isArray(v);

export const COLUMN_TYPES: [string, string][] = [
  ['string', 'String'],
  ['number', 'Number'],
  ['currency', 'Currency'],
  ['date', 'Date'],
  ['datetime', 'Date and time'],
  ['badge', 'Badge'],
  ['tags', 'Tags'],
  ['boolean', 'Boolean'],
  ['link', 'Link'],
  ['image', 'Image'],
  ['avatar', 'Avatar'],
  ['progress', 'Progress'],
  ['button', 'Action buttons'],
  ['json', 'JSON'],
  ['html', 'HTML'],
];
const TYPE_LABELS = Object.fromEntries(COLUMN_TYPES);
const BUTTON_VARIANTS: [string, string][] = [
  ['outline', 'Outline'],
  ['default', 'Solid'],
  ['secondary', 'Secondary'],
  ['ghost', 'Ghost'],
  ['destructive', 'Destructive'],
  ['link', 'Link'],
];

export const columnKey = (c: Column): string => String(c.key ?? c.dataIndex ?? c.accessor ?? c.name ?? '');
export const columnName = (c: Column): string => String(c.name ?? c.title ?? c.header ?? c.label ?? columnKey(c));
export const columnType = (c: Column): string => String(c.columnType ?? c.type ?? 'string');

/** The column with `key` set; an emptied optional key is dropped so the table's default applies. */
export const withColumnField = (column: Column, key: string, value: unknown): Column => {
  const next = { ...column };
  if (value === undefined || value === '') delete next[key];
  else next[key] = value;
  return next;
};

const inferType = (v: unknown) => (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string');

/** The columns a table shows when it has none: the keys of its first rows, nested objects skipped (normalizeColumns). */
export const columnsFromData = (data: unknown): Column[] => {
  const rows = (Array.isArray(data) ? data : []).filter(isObject).slice(0, 50);
  const seen = new Map<string, unknown>();
  rows.forEach((row) =>
    Object.keys(row).forEach((key) => {
      if (!seen.has(key) || seen.get(key) === undefined || seen.get(key) === null) seen.set(key, row[key]);
    })
  );
  return [...seen.entries()]
    .filter(([, v]) => !(v !== null && typeof v === 'object'))
    .map(([key, v]) => ({ key, name: key, columnType: inferType(v) }));
};

/** A new column: the first data key no column shows yet, else column_n. */
export const newColumn = (columns: Column[], dataKeys: string[]): Column => {
  const used = new Set(columns.map(columnKey));
  const key = dataKeys.find((k) => !used.has(k));
  if (key) return { key, name: key };
  let n = columns.length + 1;
  while (used.has(`column_${n}`)) n++;
  return { key: `column_${n}`, name: `Column ${n}` };
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    className="font-weight-500 font-size-12 mb-2 mt-1"
    style={{ color: 'var(--slate11)', textTransform: 'uppercase' }}
  >
    {children}
  </div>
);

const RemoveButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    className="btn btn-sm p-0 border-0 bg-transparent"
    aria-label={label}
    title={label}
    style={{ color: 'var(--slate10)', lineHeight: 1 }}
    onClick={onClick}
  >
    ×
  </button>
);

/** Badge colours by cell value ({ Paid: '#16a34a' }): a row per value with the native colour field. */
const BadgeColors = ({ value, onChange }: { value: unknown; onChange: (next: Column | undefined) => void }) => {
  const map: Column = isObject(value) ? value : {};
  const entries = Object.entries(map);
  const [draft, setDraft] = useState('');
  const write = (next: [string, unknown][]) => onChange(next.length ? Object.fromEntries(next) : undefined);
  const add = () => {
    const key = draft.trim();
    if (!key || key in map) return;
    write([...entries, [key, '#3e63dd']]);
    setDraft('');
  };
  return (
    <Field label="Badge colours by value">
      {entries.map(([key, colour]) => (
        <div key={key} className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
          <span className="font-size-12 text-truncate" style={{ width: 80 }} title={key}>
            {key}
          </span>
          <div className="flex-grow-1">
            <ColorField
              value={typeof colour === 'string' ? colour : ''}
              cy={`badge-color-${key}`}
              onChange={(c) => write(entries.map(([k, v]) => [k, k === key ? c : v]))}
            />
          </div>
          <RemoveButton label={`Remove ${key}`} onClick={() => write(entries.filter(([k]) => k !== key))} />
        </div>
      ))}
      <div className="d-flex" style={{ gap: 8 }}>
        <input
          type="text"
          className="form-control text-field"
          placeholder="Value, e.g. Paid"
          aria-label="Badge value"
          data-cy="badge-color-new-value"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <ButtonSolidComponent variant="secondary" size="sm" onClick={add} data-cy="badge-color-add">
          Add
        </ButtonSolidComponent>
      </div>
    </Field>
  );
};

/** A button column's buttons: label, id (what onActionButtonClicked reports), variant and disabled, per button. */
const ActionButtons = ({ value, onChange }: { value: unknown; onChange: (next: Column[]) => void }) => {
  const buttons: Column[] = (Array.isArray(value) ? value : []).filter(isObject);
  const set = (index: number, key: string, v: unknown) =>
    onChange(buttons.map((b, i) => (i === index ? withColumnField(b, key, v) : b)));
  return (
    <Field label="Action buttons">
      {buttons.map((button, index) => (
        <div
          key={index}
          className="mb-2 p-2"
          style={{ border: '1px solid var(--slate5)', borderRadius: 6 }}
          data-cy={`action-button-${index}`}
        >
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="font-size-12 font-weight-500">Button {index + 1}</span>
            <RemoveButton label="Remove button" onClick={() => onChange(buttons.filter((_, i) => i !== index))} />
          </div>
          <TextField
            label="Label"
            value={button.label ?? button.buttonLabel}
            onCommit={(t) => set(index, 'label', t)}
          />
          <TextField
            label="Id (sent with the click event)"
            value={button.id ?? button.buttonId}
            placeholder={`button${index + 1}`}
            onCommit={(t) => set(index, 'id', t)}
          />
          <SelectField
            label="Variant"
            value={String(button.variant ?? 'outline')}
            options={BUTTON_VARIANTS}
            onChange={(v) => set(index, 'variant', v)}
          />
          <SwitchField
            label="Disabled"
            checked={button.disabled === true}
            onChange={(on) => set(index, 'disabled', on || undefined)}
          />
        </div>
      ))}
      <ButtonSolidComponent
        variant="secondary"
        size="sm"
        data-cy="action-button-add"
        onClick={() => onChange([...buttons, { id: `button${buttons.length + 1}`, label: 'Action' }])}
      >
        Add button
      </ButtonSolidComponent>
    </Field>
  );
};

const ColumnDetails = ({
  column,
  listId,
  set,
}: {
  column: Column;
  listId: string;
  set: (key: string, value: unknown) => void;
}) => {
  const type = columnType(column);
  const numeric = type === 'number' || type === 'currency';
  const off = (key: string) => column[key] === false || column[key] === 'false';
  return (
    <div data-cy="column-details">
      <TextField label="Column name" value={columnName(column)} cy="column-name" onCommit={(t) => set('name', t)} />
      <TextField
        label="Key (data field)"
        value={columnKey(column)}
        list={listId}
        cy="column-key"
        onCommit={(t) => set('key', t)}
      />
      <SelectField
        label="Type"
        value={TYPE_LABELS[type] ? type : 'string'}
        options={COLUMN_TYPES}
        cy="column-type"
        onChange={(v) => set('columnType', v)}
      />
      <SelectField
        label="Alignment"
        value={String(column.horizontalAlignment ?? '')}
        options={[
          ['', 'Default'],
          ['left', 'Left'],
          ['center', 'Center'],
          ['right', 'Right'],
        ]}
        onChange={(v) => set('horizontalAlignment', v)}
      />
      <NumberField
        label="Width (px)"
        value={column.columnSize ?? column.width}
        placeholder="Auto"
        onCommit={(n) => set('columnSize', n)}
      />
      <SwitchField
        label="Visible"
        checked={!off('columnVisibility')}
        cy="column-visible"
        onChange={(on) => set('columnVisibility', on ? undefined : false)}
      />
      {type !== 'button' && (
        <>
          <SwitchField
            label="Sortable"
            checked={!off('sortable')}
            onChange={(on) => set('sortable', on ? undefined : false)}
          />
          <SwitchField
            label="Searchable"
            checked={!off('searchable')}
            onChange={(on) => set('searchable', on ? undefined : false)}
          />
        </>
      )}
      <SwitchField label="Wrap text" checked={column.wrap === true} onChange={(on) => set('wrap', on || undefined)} />

      {(numeric || ['date', 'datetime', 'badge', 'link', 'image', 'avatar', 'progress', 'button'].includes(type)) && (
        <SectionTitle>Format</SectionTitle>
      )}
      {numeric && (
        <>
          <NumberField
            label="Decimal places"
            value={column.decimalPlaces}
            placeholder="Auto"
            onCommit={(n) => set('decimalPlaces', n)}
          />
          {type === 'currency' && (
            <TextField
              label="Currency"
              value={column.currency}
              placeholder="Table default (USD)"
              onCommit={(t) => set('currency', t)}
            />
          )}
          <TextField
            label="Locale"
            value={column.locale}
            placeholder="Table default (en-US)"
            onCommit={(t) => set('locale', t)}
          />
          <TextField label="Prefix" value={column.prefix} onCommit={(t) => set('prefix', t)} />
          <TextField label="Suffix" value={column.suffix} onCommit={(t) => set('suffix', t)} />
        </>
      )}
      {(type === 'date' || type === 'datetime') && (
        <TextField
          label="Date format"
          value={column.dateFormat}
          placeholder="Table default (DD MMM YYYY)"
          onCommit={(t) => set('dateFormat', t)}
        />
      )}
      {type === 'badge' && <BadgeColors value={column.badgeColors} onChange={(next) => set('badgeColors', next)} />}
      {type === 'link' && (
        <>
          <TextField
            label="Link text"
            value={column.linkText ?? column.displayText}
            placeholder="The URL"
            onCommit={(t) => set(column.displayText !== undefined ? 'displayText' : 'linkText', t)}
          />
          <SwitchField
            label="Open in a new tab"
            checked={column.openInNewTab !== false && column.linkTarget !== '_self'}
            onChange={(on) => set('openInNewTab', on ? undefined : false)}
          />
        </>
      )}
      {(type === 'image' || type === 'avatar') && (
        <SelectField
          label="Shape"
          value={String(column.imageShape ?? '')}
          options={[
            ['', 'Default'],
            ['round', 'Round'],
            ['square', 'Square'],
          ]}
          onChange={(v) => set('imageShape', v)}
        />
      )}
      {type === 'progress' && (
        <NumberField label="Maximum" value={column.maxValue} placeholder="100" onCommit={(n) => set('maxValue', n)} />
      )}
      {type === 'button' && <ActionButtons value={column.buttons} onChange={(next) => set('buttons', next)} />}

      <SectionTitle>Cell style</SectionTitle>
      <ColorField
        label="Text colour"
        value={column.textColor}
        cy="column-text-color"
        onChange={(c) => set('textColor', c)}
      />
      <ColorField
        label="Background"
        value={column.cellBackgroundColor}
        cy="column-background"
        onChange={(c) => set('cellBackgroundColor', c)}
      />
      <SelectField
        label="Font weight"
        value={String(column.fontWeight ?? '')}
        options={[
          ['', 'Default'],
          ['400', 'Regular'],
          ['500', 'Medium'],
          ['600', 'Semibold'],
          ['700', 'Bold'],
        ]}
        onChange={(v) => set('fontWeight', v)}
      />
    </div>
  );
};

export interface ColumnsEditorProps {
  value: unknown[];
  onChange: (next: unknown[]) => void;
  /** The table's resolved rows: offered as data keys, and the columns to start from when there are none. */
  data: unknown;
  darkMode: boolean;
  cyLabel: string;
}

let lastListId = 0;

export const ColumnsEditor = ({ value, onChange, data, darkMode, cyLabel }: ColumnsEditorProps) => {
  const columns = value.filter(isObject);
  const rows = useRowIds(columns.length);
  const [listId] = useState(() => `columns-keys-${++lastListId}`);
  const fromData = columnsFromData(data);
  const dataKeys = fromData.map((c) => String(c.key));

  const set = (index: number, key: string, v: unknown) =>
    onChange(columns.map((c, i) => (i === index ? withColumnField(c, key, v) : c)));

  const renderLabel = (column: Column, index: number) => {
    const hidden = column.columnVisibility === false || column.columnVisibility === 'false';
    return (
      <span data-cy={`${cyLabel}-column-${index}`} style={{ opacity: hidden ? 0.55 : 1 }}>
        {columnName(column) || <span style={{ color: 'var(--slate9)' }}>(unnamed)</span>}
        <span className="ms-2 font-size-12" style={{ color: 'var(--slate10)' }}>
          {[TYPE_LABELS[columnType(column)] ?? columnType(column), hidden && 'hidden'].filter(Boolean).join(' · ')}
        </span>
      </span>
    );
  };

  return (
    <div className="w-100" data-cy={`${cyLabel}-columns-editor`}>
      <datalist id={listId}>
        {dataKeys.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
      {columns.length === 0 && (
        <div className="font-size-12 mb-2" style={{ color: 'var(--slate11)' }} data-cy={`${cyLabel}-from-data`}>
          {fromData.length > 0
            ? `Showing every field of the data (${dataKeys.slice(0, 4).join(', ')}${dataKeys.length > 4 ? '...' : ''}).`
            : 'No columns: the table shows every field of its data.'}
          {fromData.length > 0 && (
            <ButtonSolidComponent
              variant="secondary"
              size="sm"
              className="mt-2"
              data-cy={`${cyLabel}-customise`}
              onClick={() => onChange(fromData)}
            >
              Customise columns
            </ButtonSolidComponent>
          )}
        </div>
      )}
      <ListEditor
        items={columns}
        ids={rows.ids}
        darkMode={darkMode}
        renderLabel={renderLabel}
        renderDetails={(column, index) => (
          <ColumnDetails column={column} listId={listId} set={(k, v) => set(index, k, v)} />
        )}
        onAdd={() => {
          // A table showing its data's fields keeps them when a first column is added.
          const base = columns.length ? columns : fromData;
          onChange([...base, newColumn(base, dataKeys)]);
        }}
        onDelete={(index) => {
          rows.remove(index);
          onChange(columns.filter((_, i) => i !== index));
        }}
        onReorder={(from, to) => {
          rows.move(from, to);
          onChange(moveItem(columns, from, to));
        }}
        addLabel="Add column"
        cyLabel={cyLabel}
      />
    </div>
  );
};
