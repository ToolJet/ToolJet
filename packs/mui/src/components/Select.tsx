import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete as MuiAutocomplete, Chip, CircularProgress, IconButton, InputAdornment, MenuItem, TextField } from '@mui/material';
import Close from '@mui/icons-material/Close';
import type { AutocompleteRenderInputParams } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { checkProps, fieldClass, useFieldProps, useTextFieldLook } from '../lib/field';
import { str, toArray, toOptions, type Option } from '../lib/data';
import { SAMPLE } from '../lib/samples';
import { FieldSkeleton, Loading } from '../lib/loading';
import { useOwnerGuard } from '../lib/useOwnerGuard';

/** An option given as its value, as an option object, or as a label: the matching option, else null. */
const findOption = (options: Option[], given: unknown): Option | null => {
  if (given === undefined || given === null || given === '') return null;
  const raw = given && typeof given === 'object' ? (given as Record<string, unknown>) : null;
  const key = str(raw ? (raw.value ?? raw.label) : given);
  return options.find((o) => o.value === key) ?? options.find((o) => o.label === key) ?? null;
};

/** The focused element, looked up through open shadow roots (document.activeElement stops at the outer host). */
const deepActiveElement = (): Element | null => {
  let active: Element | null = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
};

/** Whether focus is nowhere the user chose: the body, the trigger itself, the closing menu, or a shadow host the
 *  trigger or the menu sits in (where MUI's own restore leaves it). */
const focusWasLost = (active: Element | null, trigger: Element, menu: Element | null): boolean => {
  if (!active || active === document.body || active === document.documentElement || active === trigger) return true;
  if (menu?.contains(active)) return true;
  const hosts = (el: Element | null) => {
    const found: Element[] = [];
    for (let root = el?.getRootNode(); root instanceof ShadowRoot; root = root.host.getRootNode()) found.push(root.host);
    return found;
  };
  return hosts(trigger).includes(active) || hosts(menu).includes(active);
};

// MUI's Select (TextField select): label, options [{ label, value, disabled }], value (the picked value), helperText,
// displayEmpty with a placeholder, variant, size; events onChange, onOpen, onClose. selectedOption is exposed. A clear
// button shows while a value is picked, as Ant's Select (allowClear) and this pack's Autocomplete have; Disable
// clearable hides it, by the Autocomplete's name.
export const Select = () => {
  const field = useFieldProps({ label: 'Status' });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: SAMPLE.status });
  const [value, setValue] = useStateText({ name: 'value', label: 'Value', description: 'The picked option value.', initialValue: '' });
  const [displayEmpty] = ToolJet.useStateBoolean({ name: 'displayEmpty', label: 'Display empty', description: 'Show the placeholder while nothing is picked.', initialValue: true });
  const [placeholder] = useStateText({ name: 'placeholder', label: 'Placeholder', initialValue: 'Select', visibleWhen: { key: 'displayEmpty', value: true } });
  const [disableClearable] = ToolJet.useStateBoolean({ name: 'disableClearable', label: 'Disable clearable', description: 'Hide the clear button.', initialValue: false });
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
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

  // selectedOption follows the value however it changes (a pick, a binding, a Form's clearForm, options that load
  // later or drop it): set only on a pick, it kept the old option after a clear or an emptied binding.
  const selected = known ? options.find((o) => o.value === value) : undefined;
  const selectedKey = selected ? JSON.stringify(selected) : '';
  useEffect(() => {
    setSelectedOption(selected ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);
  const change = (next: string) => {
    setValue(next);
    // Set with the value, so an onChange (or onClose) handler reads the new option, not the one the effect would
    // replace a render later (AM-12). The effect above still follows bindings, a Form clear and changed options.
    setSelectedOption(options.find((o) => o.value === next) ?? {});
    onChange();
  };
  // MUI's open state, held here so the guard can close the menu: it portals into the popup layer, out of reach of the
  // host's Disable and of a parent that hides or blocks the widget.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => {
    setMenuOpen(false);
    setOpen(false);
    check.touch();
    onClose();
  };
  const available = useOwnerGuard(rootRef, menuOpen, closeMenu, disabled);
  // Focus goes back to the trigger when the menu closes (a pick, Escape, a dismiss). MUI's FocusTrap restores to the
  // focus event's relatedTarget, and with the menu in the popup layer's own shadow root that is the outer shadow host,
  // not the combobox: focus fell to the body and the closed Select kept its focused outline (AM-13). The trap stays on;
  // only its restore is ours. Focus that moved on purpose (a handler focusing another control) stays where it is, and a
  // disabled or hidden owner gets none.
  const menuRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    const closed = wasOpen.current && !menuOpen;
    wasOpen.current = menuOpen;
    if (!closed || !available()) return;
    const trigger = rootRef.current?.querySelector<HTMLElement>('[role="combobox"]');
    if (trigger && focusWasLost(deepActiveElement(), trigger, menuRef.current)) trigger.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(str(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(''));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  const showEmpty = displayEmpty && !!placeholder;
  // MUI's Select has no clear of its own: a small x before the arrow (the Autocomplete's clear indicator look), only
  // while a known value is picked. It takes no focus on press and does not open the menu; focus goes to the trigger.
  const clearable = !disableClearable && known && !disabled;
  const clearButton = clearable ? (
    <InputAdornment position="end" sx={{ mr: 2.5 }}>
      <IconButton
        aria-label="Clear"
        title="Clear"
        size="small"
        className="tj-mui-select-clear"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!available()) return;
          change('');
          check.touch();
          rootRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
        }}
      >
        <Close fontSize="small" />
      </IconButton>
    </InputAdornment>
  ) : undefined;
  return (
    <MuiProvider overrides={overrides} className={fieldClass(look.variant, field.label)} rootRef={rootRef}>
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
            input: clearButton ? { endAdornment: clearButton } : undefined,
            select: {
              open: menuOpen,
              MenuProps: { disableRestoreFocus: true, ref: menuRef } as Record<string, unknown>,
              displayEmpty: showEmpty,
              renderValue: (v: unknown) =>
                v === '' ? <span className="tj-mui-placeholder">{placeholder}</span> : (options.find((o) => o.value === v)?.label ?? str(v)),
              onOpen: () => {
                if (!available()) return;
                setMenuOpen(true);
                setOpen(true);
                onOpen();
              },
              onClose: () => {
                if (menuOpen) closeMenu();
              },
            },
          }}
          onChange={(e) => {
            if (available()) change(String(e.target.value ?? ''));
          }}
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
const useAutocompleteProps = (defaults: { label: string; placeholder: string; options: unknown[] }) => {
  const field = useFieldProps({ label: defaults.label });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: defaults.options });
  const [placeholder] = useStateText({ name: 'placeholder', label: 'Placeholder', initialValue: defaults.placeholder });
  const [noOptionsText] = useStateText({ name: 'noOptionsText', label: 'No options text', initialValue: 'No options' });
  const [disableClearable] = ToolJet.useStateBoolean({ name: 'disableClearable', label: 'Disable clearable', initialValue: false });
  const [inputValue, setInputValue] = useStateText({ name: 'inputValue', initialValue: '', inspector: 'hidden' });
  const look = useTextFieldLook();
  // The typed text is the field's own draft: a Form's clearForm empties it with the value (MUI resets it only when the
  // value changes, so a draft typed over an empty value stayed).
  ToolJet.useFormClear(() => setInputValue(''));
  // MUI's open state, held here so the guard can close the listbox (it portals out of the widget): see Select.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  return { field, options: toOptions(rawOptions), placeholder, noOptionsText, disableClearable, inputValue, setInputValue, look, rootRef, open, setOpen };
};

/** The open, close and guard wiring both Autocomplete variants share. */
const usePopupState = (p: ReturnType<typeof useAutocompleteProps>, disabled: boolean, touch: () => void, onOpen: () => void, onClose: () => void) => {
  const close = () => {
    p.setOpen(false);
    touch();
    onClose();
  };
  const available = useOwnerGuard(p.rootRef, p.open, close, disabled);
  return {
    available,
    props: {
      open: p.open,
      onOpen: () => {
        if (!available()) return;
        p.setOpen(true);
        onOpen();
      },
      onClose: () => {
        if (p.open) close();
      },
    },
  };
};

// MUI's Autocomplete (a searchable single choice): label, options [{ label, value }], value (MUI's shape: the picked
// option { label, value }, or null; a bare value or label also picks), freeSolo, disableClearable, noOptionsText;
// inputValue (the typed text) is exposed. Events onChange, onInputChange, onOpen, onClose.
export const Autocomplete = () => {
  const p = useAutocompleteProps({ label: 'City', placeholder: 'Search a city...', options: SAMPLE.cities });
  const [value, setValue] = ToolJet.useStateObject({ name: 'value', label: 'Value', description: 'The picked option { label, value }, or null.', initialValue: null });
  const [freeSolo] = ToolJet.useStateBoolean({ name: 'freeSolo', label: 'Free solo', description: 'Any typed text is a value.', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onInputChange = ToolJet.useEventCallback({ name: 'onInputChange' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const found = findOption(p.options, value) ?? (freeSolo && typeof value === 'string' && value ? { label: value, value } : null);
  // The same object while the pick is the same (options are rebuilt every render): MUI takes a new value object for a
  // change and resets the typed text to its label, so editing the text of a picked city was undone by the next render.
  const pickedKey = JSON.stringify(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const picked = useMemo(() => found, [pickedKey]);
  const check = ToolJet.useValidation({ section: 'choice', value: picked?.value ?? '', present: !!picked });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

  const change = (next: Option | null) => {
    setValue(next as unknown as Record<string, unknown>);
    onChange();
  };
  const popup = usePopupState(p, disabled, check.touch, onOpen, onClose);
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(findOption(p.options, next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(null));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  return (
    <MuiProvider overrides={overrides} className={fieldClass(p.look.variant, p.field.label)} rootRef={p.rootRef}>
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
        {...popup.props}
        onChange={(_, next) => {
          if (!popup.available()) return;
          change(typeof next === 'string' ? { label: next, value: next } : next ? { label: next.label, value: next.value } : null);
        }}
        onInputChange={(_, text) => {
          p.setInputValue(text);
          onInputChange();
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
  const p = useAutocompleteProps({ label: 'Cities', placeholder: 'Select cities...', options: SAMPLE.cities });
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
  const found = toArray(value)
    .map((v) => findOption(p.options, v))
    .filter((o, i, all): o is Option => !!o && all.findIndex((x) => x?.value === o.value) === i);
  // The same array while the picked options are the same: MUI takes a new value array for a change and resets the typed
  // text, so a search typed into the field was wiped by the very next render.
  const pickedKey = JSON.stringify(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const picked = useMemo(() => found, [pickedKey]);
  const check = ToolJet.useValidation({ section: 'choice', value: picked.map((o) => o.value), present: picked.length > 0 });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 7 });

  const change = (next: Option[]) => {
    setValue(next);
    onChange();
  };
  const popup = usePopupState(p, disabled, check.touch, onOpen, onClose);
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Values' }] }, (next) =>
    change(toArray(next).map((v) => findOption(p.options, v)).filter((o): o is Option => !!o))
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change([]));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  return (
    <MuiProvider overrides={overrides} className={fieldClass(p.look.variant, p.field.label)} rootRef={p.rootRef}>
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
        {...popup.props}
        onChange={(_, next) => {
          if (!popup.available()) return;
          change(next.map((o) => ({ label: o.label, value: o.value })));
        }}
        onInputChange={(_, text) => {
          p.setInputValue(text);
          onInputChange();
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
