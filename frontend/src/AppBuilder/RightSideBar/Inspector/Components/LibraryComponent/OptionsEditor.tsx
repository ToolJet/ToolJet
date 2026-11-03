import React from 'react';

import { ListEditor, moveItem, useRowIds } from './ListEditor';
import { Field, IconField, SwitchField, TextField } from './fields';

// An options list (inspector: 'options'): plain values or { label, value, disabled, description, icon } objects, as
// the pack's Select, MultiSelect, Combobox, RadioGroup, ToggleGroup, ButtonGroup and DropdownMenu read them. Keys the
// editor does not show (group, variant, shortcut...) are kept as they are.

type Entry = unknown;
type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);
const isFilled = (v: unknown) => v !== undefined && v !== null && v !== '';

export const entryLabel = (entry: Entry): string => {
  if (!isObject(entry)) return entry === undefined || entry === null ? '' : String(entry);
  const label = [entry.label, entry.title, entry.name, entry.heading, entry.value].find(isFilled);
  return label === undefined ? '' : String(label);
};

export const entryValue = (entry: Entry): unknown => (isObject(entry) ? (entry.value ?? entry.id) : entry);

const VALUE_TYPES: [string, string][] = [
  ['string', 'Text'],
  ['number', 'Number'],
  ['boolean', 'True / false'],
];

const valueType = (v: unknown) => (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string');

/** Text typed for a value of the given type: a number only once the text reads as one. */
const coerce = (text: string, type: string): unknown => {
  if (type === 'boolean') return text === 'true';
  if (type === 'number') {
    const n = Number(text);
    return text.trim() !== '' && Number.isFinite(n) ? n : text;
  }
  return text;
};

/**
 * The entry with `key` set. A plain value stays plain when its label (which is its value) changes, and becomes
 * { label, value } for anything else; an optional key set to '', false or nothing is dropped.
 */
export const withField = (entry: Entry, key: string, value: unknown): Entry => {
  if (!isObject(entry) && key === 'label') return value;
  const base: Obj = isObject(entry) ? { ...entry } : { label: entryLabel(entry), value: entry };
  const required = key === 'label' || key === 'value';
  if (value === undefined || (!required && (value === '' || value === false))) delete base[key];
  else base[key] = value;
  return base;
};

/** A new entry like its siblings: a plain value when every entry is one, else { label, value }. */
export const newEntry = (entries: Entry[]): Entry => {
  const taken = new Set(entries.map((e) => String(entryValue(e))));
  let n = entries.length + 1;
  while (taken.has(`option${n}`) || taken.has(`Option ${n}`)) n++;
  if (entries.length > 0 && entries.every((e) => !isObject(e))) return `Option ${n}`;
  return { label: `Option ${n}`, value: `option${n}` };
};

export interface OptionsEditorProps {
  value: unknown[];
  onChange: (next: unknown[]) => void;
  darkMode: boolean;
  cyLabel: string;
}

export const OptionsEditor = ({ value, onChange, darkMode, cyLabel }: OptionsEditorProps) => {
  const rows = useRowIds(value.length);
  const update = (index: number, key: string, v: unknown) =>
    onChange(value.map((entry, i) => (i === index ? withField(entry, key, v) : entry)));

  const renderLabel = (entry: Entry, index: number) => {
    const label = entryLabel(entry);
    const v = entryValue(entry);
    const notes = [
      isFilled(v) && String(v) !== label && String(v),
      isObject(entry) && entry.disabled === true && 'disabled',
    ].filter(Boolean);
    return (
      <span data-cy={`${cyLabel}-option-${index}`}>
        {label === '' ? <span style={{ color: 'var(--slate9)' }}>(empty)</span> : label}
        {notes.length > 0 && (
          <span className="ms-2 font-size-12" style={{ color: 'var(--slate10)' }}>
            {notes.join(' · ')}
          </span>
        )}
      </span>
    );
  };

  const renderDetails = (entry: Entry, index: number) => {
    const v = entryValue(entry);
    const type = valueType(v);
    const obj = isObject(entry) ? entry : {};
    return (
      <div data-cy={`${cyLabel}-option-details`}>
        <TextField
          label="Label"
          value={entryLabel(entry)}
          cy={`${cyLabel}-option-label`}
          onCommit={(text) => update(index, 'label', text)}
        />
        <Field label="Value">
          <div className="d-flex" style={{ gap: 8 }}>
            <div className="flex-grow-1">
              {type === 'boolean' ? (
                <select
                  className="form-control text-field"
                  aria-label="Value"
                  value={String(v === true)}
                  onChange={(e) => update(index, 'value', e.target.value === 'true')}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <ValueText
                  value={v}
                  type={type}
                  cy={`${cyLabel}-option-value`}
                  onCommit={(nv) => update(index, 'value', nv)}
                />
              )}
            </div>
            <select
              className="form-control text-field"
              style={{ width: 104 }}
              aria-label="Value type"
              value={type}
              onChange={(e) => update(index, 'value', coerce(String(v ?? ''), e.target.value))}
            >
              {VALUE_TYPES.map(([t, l]) => (
                <option key={t} value={t}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <TextField
          label="Description"
          value={obj.description}
          placeholder="Optional"
          cy={`${cyLabel}-option-description`}
          onCommit={(text) => update(index, 'description', text)}
        />
        <IconField
          label="Icon"
          value={obj.icon}
          darkMode={darkMode}
          cy={`${cyLabel}-option-icon`}
          onChange={(icon) => update(index, 'icon', icon)}
        />
        <SwitchField
          label="Disabled"
          checked={obj.disabled === true}
          cy={`${cyLabel}-option-disabled`}
          onChange={(on) => update(index, 'disabled', on)}
        />
      </div>
    );
  };

  return (
    <ListEditor
      items={value}
      ids={rows.ids}
      darkMode={darkMode}
      renderLabel={renderLabel}
      renderDetails={renderDetails}
      onAdd={() => onChange([...value, newEntry(value)])}
      onDelete={(index) => {
        rows.remove(index);
        onChange(value.filter((_, i) => i !== index));
      }}
      onReorder={(from, to) => {
        rows.move(from, to);
        onChange(moveItem(value, from, to));
      }}
      addLabel="Add new option"
      cyLabel={cyLabel}
    />
  );
};

const ValueText = ({
  value,
  type,
  cy,
  onCommit,
}: {
  value: unknown;
  type: string;
  cy: string;
  onCommit: (value: unknown) => void;
}) => {
  const shown = value === undefined || value === null ? '' : String(value);
  const [draft, setDraft] = React.useState(shown);
  React.useEffect(() => setDraft(shown), [shown]);
  const commit = () => draft !== shown && onCommit(coerce(draft, type));
  return (
    <input
      type="text"
      inputMode={type === 'number' ? 'decimal' : undefined}
      className="form-control text-field"
      aria-label="Value"
      data-cy={cy}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
};
