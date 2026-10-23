import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { OptionsListEditor } from '@/AppBuilder/RightSideBar/Inspector/Components/shared/OptionsListEditor';
import {
  coerceValue,
  convertValue,
  entryLabel,
  entryValue,
  entryValueType,
  isDisabledEntry,
  moveEntry,
  newEntry,
  readDefaultValues,
  readOptionsCode,
  withDisabled,
  withLabel,
  withValue,
  writeDefault,
  writeOptionsCode,
} from '@/AppBuilder/RightSideBar/Inspector/Components/shared/utils/optionsLiteral';

/**
 * What a UI 2.0 options field's list needs besides the fx renderer's props: the field's own code (the list is read
 * from it, not from its resolved value), the widget's other properties (its default value) and a way to set one.
 * The inspector's Code element provides it for a field of type optionsList.
 */
export const OptionsListFieldContext = createContext(null);

let lastRowId = 0;
const rowId = () => `option-row-${++lastRowId}`;

/** Rows for the entries in `code`, keeping the ids of the rows they replace (an open popover stays open). */
const toRows = (code, previous) => {
  const { entries } = readOptionsCode(code);
  if (!entries) return previous;
  return entries.map((entry, i) => ({ id: previous[i]?.id ?? rowId(), entry }));
};

const VALUE_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'True / false' },
];

const fieldLabel = 'font-weight-500 mb-1 font-size-12 d-block';

/** An option's value: text or a number typed as text (a number commits once the text reads as one), or true/false. */
const ValueInput = ({ value, type, onCommit, dataCy }) => {
  const shown = value === undefined || value === null ? '' : String(value);
  const [draft, setDraft] = useState(shown);
  useEffect(() => {
    if (coerceValue(draft, type) !== value) setDraft(shown);
    // Only a new value from outside replaces what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, type]);

  if (type === 'boolean') {
    return (
      <select
        className="form-control text-field"
        aria-label="Option value"
        data-cy={dataCy}
        value={String(value === true)}
        onChange={(e) => onCommit(e.target.value === 'true')}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <input
      type="text"
      inputMode={type === 'number' ? 'decimal' : undefined}
      className="form-control text-field"
      aria-label="Option value"
      data-cy={dataCy}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const next = coerceValue(e.target.value, type);
        if (next !== undefined) onCommit(next);
      }}
      onBlur={() => setDraft(shown)}
    />
  );
};

const Switch = ({ label, checked, disabled, title, onChange, dataCy }) => (
  <label
    className="form-check form-switch mb-0 d-flex align-items-center justify-content-between ps-0"
    title={title}
    style={{ gap: '8px' }}
  >
    <span className="font-weight-500 font-size-12">{label}</span>
    <input
      className="form-check-input ms-0"
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      data-cy={dataCy}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

/**
 * A UI 2.0 options field (Select, Radio group, Toggle group, Multiselect, Combobox...) as a list: add, remove, drag to
 * reorder, and per option its label, value (keeping its type: 0 and false stay a number and a boolean), disabled and,
 * when the config names its default value property (defaultParam), whether it is selected by default. Every change
 * writes the whole list back into the same options value as {{[...]}}, so saved apps and bindings read it as before.
 * The fx button switches the field to code (SingleLineCodeEditor's DynamicEditorBridge); options bound to data stay
 * in code.
 */
export const OptionsList = ({ onChange, meta, cyLabel = 'options', darkMode }) => {
  const field = useContext(OptionsListFieldContext);
  const code = field?.code;
  const [rows, setRows] = useState(() => toRows(code, []));
  // The values this list wrote that have not come back as `code` yet: they are not changes from outside.
  const pending = useRef([]);

  useEffect(() => {
    const at = pending.current.indexOf(code);
    if (at !== -1) {
      pending.current = pending.current.slice(at + 1);
      return;
    }
    pending.current = [];
    setRows((previous) => toRows(code, previous));
  }, [code]);

  const write = (next) => {
    setRows(next);
    const value = writeOptionsCode(next.map((row) => row.entry));
    pending.current.push(value);
    onChange(value);
  };
  const update = (index, change) =>
    write(rows.map((row, i) => (i === index ? { ...row, entry: change(row.entry) } : row)));

  const defaultParam = meta?.defaultParam;
  const multipleDefaults = meta?.multipleDefaults === true;
  const defaults = defaultParam ? readDefaultValues(field?.properties?.[defaultParam]?.value) : null;
  const isDefault = (entry) => !!defaults?.values.some((v) => String(v) === String(entryValue(entry)));
  const setDefault = (entry, on) => {
    const value = entryValue(entry);
    const others = defaults.values.filter((v) => String(v) !== String(value));
    const values = multipleDefaults ? (on ? [...others, value] : others) : on ? [value] : [];
    field.setProperty(defaultParam, writeDefault(values, multipleDefaults));
  };

  const renderLabel = (row, index) => {
    const label = entryLabel(row.entry);
    const value = entryValue(row.entry);
    const notes = [
      String(value) !== label && String(value),
      isDefault(row.entry) && 'default',
      isDisabledEntry(row.entry) && 'disabled',
    ].filter(Boolean);
    return (
      <span data-cy={`${cyLabel}-option-${index}`}>
        {label === '' ? <span style={{ color: 'var(--slate9)' }}>(empty)</span> : label}
        {notes.length ? (
          <span className="ms-2 font-size-12" style={{ color: 'var(--slate10)' }}>
            {notes.join(' · ')}
          </span>
        ) : null}
      </span>
    );
  };

  const renderDetails = (row, index) => {
    const type = entryValueType(row.entry);
    return (
      <div data-cy={`${cyLabel}-option-details`}>
        <div className="field mb-3">
          <label className={fieldLabel}>
            Option label
            <input
              type="text"
              className="form-control text-field mt-1"
              aria-label="Option label"
              data-cy={`${cyLabel}-option-label-input`}
              value={entryLabel(row.entry)}
              onChange={(e) => update(index, (entry) => withLabel(entry, e.target.value))}
            />
          </label>
        </div>
        <div className="field mb-3">
          <span className={fieldLabel}>Option value</span>
          <div className="d-flex" style={{ gap: '8px' }}>
            <div className="flex-grow-1">
              <ValueInput
                value={entryValue(row.entry)}
                type={type}
                dataCy={`${cyLabel}-option-value-input`}
                onCommit={(v) => update(index, (entry) => withValue(entry, v))}
              />
            </div>
            <select
              className="form-control text-field"
              style={{ width: '104px' }}
              aria-label="Value type"
              data-cy={`${cyLabel}-option-value-type`}
              value={type}
              onChange={(e) =>
                update(index, (entry) => withValue(entry, convertValue(entryValue(entry), e.target.value)))
              }
            >
              {VALUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field mb-2">
          <Switch
            label="Disabled"
            checked={isDisabledEntry(row.entry)}
            dataCy={`${cyLabel}-option-disabled`}
            onChange={(on) => update(index, (entry) => withDisabled(entry, on))}
          />
        </div>
        {defaults && (
          <div className="field">
            <Switch
              label={multipleDefaults ? 'Selected by default' : 'Default option'}
              checked={isDefault(row.entry)}
              disabled={defaults.bound}
              title={
                defaults.bound ? 'The default value is set by code: change it in the default value field.' : undefined
              }
              dataCy={`${cyLabel}-option-default`}
              onChange={(on) => setDefault(row.entry, on)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-100 mt-2" data-cy={`${cyLabel}-options-list`}>
      <OptionsListEditor
        options={rows}
        darkMode={darkMode}
        getItemId={(row) => row.id}
        renderLabel={renderLabel}
        renderDetails={renderDetails}
        onAdd={() => {
          const entries = rows.map((row) => row.entry);
          write([...rows, { id: rowId(), entry: newEntry(entries) }]);
        }}
        onDelete={(index) => write(rows.filter((_, i) => i !== index))}
        onReorder={(from, to) => write(moveEntry(rows, from, to))}
        addLabel="Add new option"
        addDataCy={`${cyLabel}-add-option`}
      />
    </div>
  );
};

export default OptionsList;
