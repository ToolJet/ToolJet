import React, { useRef } from 'react';
import { Autocomplete as MuiAutocomplete, Chip, CircularProgress, MenuItem, TextField } from '@mui/material';
import type { AutocompleteRenderInputParams } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { checkProps, fieldClass, useFieldProps, useTextFieldLook } from '../lib/field';
import { str, toArray, toOptions, type Option } from '../lib/data';
import { FieldSkeleton, Loading } from '../lib/loading';

/** An option given as its value, as an option object, or as a label: the matching option, else null. */
const findOption = (options: Option[], given: unknown): Option | null => {
  if (given === undefined || given === null || given === '') return null;
  const raw = given && typeof given === 'object' ? (given as Record<string, unknown>) : null;
  const key = str(raw ? (raw.value ?? raw.label) : given);
  return options.find((o) => o.value === key) ?? options.find((o) => o.label === key) ?? null;
};

// MUI's Select (TextField select): label, options [{ label, value, disabled }], value (the picked value), helperText,
// displayEmpty with a placeholder, variant, size; events onChange, onOpen, onClose. selectedOption is exposed.
export const Select = () => {
  const field = useFieldProps();
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: [] });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'The picked option value.', initialValue: '' });
  const [displayEmpty] = ToolJet.useStateBoolean({ name: 'displayEmpty', label: 'Display empty', description: 'Show the placeholder while nothing is picked.', initialValue: true });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Select', visibleWhen: { key: 'displayEmpty', value: true } });
  const [, setSelectedOption] = ToolJet.useStateObject({ name: 'selectedOption', initialValue: {}, inspector: 'hidden' });
  const [, setOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: false, inspector: 'hidden' });
  const look = useTextFieldLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const options = toOptions(rawOptions);
  const known = value !== '' && options.some((o) => o.value === value);
  const check = ToolJet.useValidation({ section: 'choice', value, present: known });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6.9 });

  const change = (next: string) => {
    setValue(next);
    setSelectedOption(options.find((o) => o.value === next) ?? {});
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(str(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(''));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  const showEmpty = displayEmpty && !!placeholder;
  return (
    <MuiProvider overrides={overrides} className={fieldClass(look.variant, field.label)}>
      <Loading loading={loading} look={<FieldSkeleton variant={look.variant} size={look.size} />}>
        <TextField
          select
          inputRef={ref}
          id={fieldId}
          fullWidth
          label={field.label || undefined}
          // A value that is not (yet) among the options shows as empty, not as a bare value.
          value={known ? value : ''}
          variant={look.variant}
          size={look.size}
          color={look.color}
          disabled={disabled}
          {...checkProps(check, field.helperText)}
          slotProps={{
            inputLabel: showEmpty ? { shrink: true } : undefined,
            select: {
              displayEmpty: showEmpty,
              renderValue: (v: unknown) =>
                v === '' ? <span className="tj-mui-placeholder">{placeholder}</span> : (options.find((o) => o.value === v)?.label ?? str(v)),
              onOpen: () => {
                setOpen(true);
                onOpen();
              },
              onClose: () => {
                setOpen(false);
                check.touch();
                onClose();
              },
            },
          }}
          onChange={(e) => change(String(e.target.value ?? ''))}
        >
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Loading>
    </MuiProvider>
  );
};

/** MUI's Autocomplete loading look (its "Load on open" demo): a CircularProgress before the popup indicator. */
const loadingSlotProps = ({ slotProps }: AutocompleteRenderInputParams, loading: boolean) =>
  loading
    ? {
        ...slotProps,
        input: {
          ...slotProps.input,
          endAdornment: (
            <>
              <CircularProgress color="inherit" size={20} />
              {slotProps.input.endAdornment}
            </>
          ),
        },
      }
    : slotProps;

/** The Autocomplete props both variants share. */
const useAutocompleteProps = () => {
  const field = useFieldProps();
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: [] });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '' });
  const [noOptionsText] = ToolJet.useStateString({ name: 'noOptionsText', label: 'No options text', initialValue: 'No options' });
  const [disableClearable] = ToolJet.useStateBoolean({ name: 'disableClearable', label: 'Disable clearable', initialValue: false });
  const [inputValue, setInputValue] = ToolJet.useStateString({ name: 'inputValue', initialValue: '', inspector: 'hidden' });
  const look = useTextFieldLook();
  return { field, options: toOptions(rawOptions), placeholder, noOptionsText, disableClearable, inputValue, setInputValue, look };
};

// MUI's Autocomplete (a searchable single choice): label, options [{ label, value }], value (MUI's shape: the picked
// option { label, value }, or null; a bare value or label also picks), freeSolo, disableClearable, noOptionsText;
// inputValue (the typed text) is exposed. Events onChange, onInputChange, onOpen, onClose.
export const Autocomplete = () => {
  const p = useAutocompleteProps();
  const [value, setValue] = ToolJet.useStateObject({ name: 'value', label: 'Value', description: 'The picked option { label, value }, or null.', initialValue: null });
  const [freeSolo] = ToolJet.useStateBoolean({ name: 'freeSolo', label: 'Free solo', description: 'Any typed text is a value.', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onInputChange = ToolJet.useEventCallback({ name: 'onInputChange' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const picked = findOption(p.options, value) ?? (freeSolo && typeof value === 'string' && value ? { label: value, value } : null);
  const check = ToolJet.useValidation({ section: 'choice', value: picked?.value ?? '', present: !!picked });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6.9 });

  const change = (next: Option | null) => {
    setValue(next as unknown as Record<string, unknown>);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(findOption(p.options, next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(null));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  return (
    <MuiProvider overrides={overrides} className={fieldClass(p.look.variant, p.field.label)}>
      <MuiAutocomplete<Option, false, boolean, boolean>
        id={fieldId}
        fullWidth
        options={p.options}
        value={picked}
        freeSolo={freeSolo}
        disableClearable={p.disableClearable}
        loading={loading}
        disabled={disabled}
        size={p.look.size}
        noOptionsText={p.noOptionsText}
        inputValue={p.inputValue ?? ''}
        getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
        getOptionDisabled={(o) => !!o.disabled}
        isOptionEqualToValue={(o, v) => o.value === (typeof v === 'string' ? v : v.value)}
        onChange={(_, next) => change(typeof next === 'string' ? { label: next, value: next } : next ? { label: next.label, value: next.value } : null)}
        onInputChange={(_, text) => {
          p.setInputValue(text);
          onInputChange();
        }}
        onOpen={() => onOpen()}
        onClose={() => {
          check.touch();
          onClose();
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={ref}
            label={p.field.label || undefined}
            placeholder={p.placeholder || undefined}
            variant={p.look.variant}
            color={p.look.color}
            {...checkProps(check, p.field.helperText)}
            slotProps={loadingSlotProps(params, loading)}
          />
        )}
      />
    </MuiProvider>
  );
};

// MUI's Autocomplete multiple: picked options as Chips. value is MUI's shape, an array of options [{ label, value }]
// (bare values or labels also pick); limitTags, disableCloseOnSelect, filterSelectedOptions. Events onChange,
// onInputChange, onOpen, onClose.
export const AutocompleteMultiple = () => {
  const p = useAutocompleteProps();
  const [value, setValue] = ToolJet.useStateArray({ name: 'value', label: 'Value', description: 'The picked options [{ label, value }].', initialValue: [] });
  const [limitTags] = ToolJet.useStateNumber({ name: 'limitTags', label: 'Limit tags', description: 'Chips shown while not focused; -1 for all.', initialValue: -1, min: -1 });
  const [disableCloseOnSelect] = ToolJet.useStateBoolean({ name: 'disableCloseOnSelect', label: 'Disable close on select', initialValue: true });
  const [filterSelectedOptions] = ToolJet.useStateBoolean({ name: 'filterSelectedOptions', label: 'Filter selected options', initialValue: false });
  const [chipColor] = ToolJet.useStateEnumeration({
    name: 'chipColor',
    label: 'Chip color',
    enumDefinition: ['default', 'primary', 'secondary', 'success', 'error', 'info', 'warning'],
    initialValue: 'default',
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onInputChange = ToolJet.useEventCallback({ name: 'onInputChange' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const picked = toArray(value)
    .map((v) => findOption(p.options, v))
    .filter((o, i, all): o is Option => !!o && all.findIndex((x) => x?.value === o.value) === i);
  const check = ToolJet.useValidation({ section: 'choice', value: picked.map((o) => o.value), present: picked.length > 0 });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 6.9 });

  const change = (next: Option[]) => {
    setValue(next);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Values' }] }, (next) =>
    change(toArray(next).map((v) => findOption(p.options, v)).filter((o): o is Option => !!o))
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change([]));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  return (
    <MuiProvider overrides={overrides} className={fieldClass(p.look.variant, p.field.label)}>
      <MuiAutocomplete<Option, true, boolean, false>
        multiple
        id={fieldId}
        fullWidth
        options={p.options}
        value={picked}
        disableClearable={p.disableClearable}
        disableCloseOnSelect={disableCloseOnSelect}
        filterSelectedOptions={filterSelectedOptions}
        limitTags={Number(limitTags)}
        loading={loading}
        disabled={disabled}
        size={p.look.size}
        noOptionsText={p.noOptionsText}
        inputValue={p.inputValue ?? ''}
        getOptionLabel={(o) => o.label}
        getOptionDisabled={(o) => !!o.disabled}
        isOptionEqualToValue={(o, v) => o.value === v.value}
        onChange={(_, next) => change(next.map((o) => ({ label: o.label, value: o.value })))}
        onInputChange={(_, text) => {
          p.setInputValue(text);
          onInputChange();
        }}
        onOpen={() => onOpen()}
        onClose={() => {
          check.touch();
          onClose();
        }}
        renderValue={(items, getItemProps) =>
          items.map((o, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return <Chip key={key} label={o.label} size="small" color={chipColor as 'default'} {...itemProps} />;
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={ref}
            label={p.field.label || undefined}
            placeholder={picked.length ? undefined : p.placeholder || undefined}
            variant={p.look.variant}
            color={p.look.color}
            {...checkProps(check, p.field.helperText)}
            slotProps={loadingSlotProps(params, loading)}
          />
        )}
      />
    </MuiProvider>
  );
};
