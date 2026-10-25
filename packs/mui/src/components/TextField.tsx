import React, { useRef, useState } from 'react';
import { IconButton, InputAdornment, TextField as MuiTextField } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { checkProps, fieldClass, useFieldProps, useTextFieldLook } from '../lib/field';
import { iconOrText } from '../lib/icons';
import { str } from '../lib/data';
import { toNumber } from '../lib/format';
import { FieldSkeleton, Loading } from '../lib/loading';
import { typeRule, useRuleCheck } from '../lib/typeRule';

const adornment = (position: 'start' | 'end', content: React.ReactNode) =>
  content ? <InputAdornment position={position}>{content}</InputAdornment> : undefined;

/** The events and actions every text-like field shares, by MUI's handler names. */
const useTextEvents = () => ({
  onChange: ToolJet.useEventCallback({ name: 'onChange' }),
  onEnterKeyDown: ToolJet.useEventCallback({ name: 'onEnterKeyDown', displayName: 'On Enter key down' }),
  onFocus: ToolJet.useEventCallback({ name: 'onFocus' }),
  onBlur: ToolJet.useEventCallback({ name: 'onBlur' }),
});

/** MUI's show-password button (its "Input Adornments" demo): an eye at the end that shows or hides the text. */
const RevealButton = ({ shown, onToggle, disabled }: { shown: boolean; onToggle: () => void; disabled: boolean }) => (
  <IconButton
    aria-label={shown ? 'Hide password' : 'Show password'}
    aria-pressed={shown}
    edge="end"
    size="small"
    disabled={disabled}
    onClick={onToggle}
    // Keeps the caret in the field: the press does not take focus from the input.
    onMouseDown={(e) => e.preventDefault()}
  >
    {shown ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
  </IconButton>
);

const useFocusActions = (ref: React.RefObject<HTMLInputElement | null>) => {
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());
  ToolJet.useAction({ name: 'blur', displayName: 'Blur' }, () => ref.current?.blur());
};

// MUI's TextField: label, value, placeholder, helperText, type, variant (outlined, filled, standard), size, color,
// startAdornment / endAdornment (text or an icon name); events onChange, onEnterKeyDown, onFocus, onBlur. MUI has no
// form API: actions setValue, clear, focus, blur. The Validation section sets error and required. Type email or url
// also checks the format, as UI 2.0's Input does; type password gets MUI's show/hide button.
export const TextField = () => {
  const field = useFieldProps({ label: 'Name' });
  const [value, setValue] = useStateText({ name: 'value', label: 'Value', initialValue: '' });
  const [placeholder] = useStateText({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter your name' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['text', 'email', 'password', 'url', 'tel', 'search'], initialValue: 'text' });
  const [startAdornment] = useStateText({ name: 'startAdornment', label: 'Start adornment', description: 'Text, or an icon name such as Search.', initialValue: '' });
  const [endAdornment] = useStateText({ name: 'endAdornment', label: 'End adornment', description: 'Text, or an icon name such as Mail.', initialValue: '' });
  const [maxLength] = ToolJet.useStateNumber({ name: 'maxLength', label: 'Max length', description: '0 for no limit.', initialValue: 0, min: 0 });
  const look = useTextFieldLook();
  const events = useTextEvents();
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = useRuleCheck(ToolJet.useValidation({ section: 'text', value }), typeRule(type, value));
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  const change = (next: string) => {
    setValue(next);
    events.onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(str(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(''));
  useFocusActions(ref);
  const end = iconOrText(endAdornment);

  return (
    <MuiProvider overrides={overrides} className={fieldClass(look.variant, field.label)}>
      <Loading loading={loading} look={<FieldSkeleton variant={look.variant} size={look.size} />}>
        <MuiTextField
          inputRef={ref}
          id={fieldId}
          fullWidth
          label={field.label || undefined}
          value={value ?? ''}
          placeholder={placeholder || undefined}
          type={isPassword && revealed ? 'text' : type}
          variant={look.variant}
          size={look.size}
          color={look.color}
          disabled={disabled}
          {...checkProps(check, field.helperText)}
          slotProps={{
            input: {
              startAdornment: adornment('start', iconOrText(startAdornment)),
              endAdornment: isPassword
                ? adornment(
                    'end',
                    <>
                      {end}
                      <RevealButton shown={revealed} disabled={disabled} onToggle={() => setRevealed((r) => !r)} />
                    </>
                  )
                : adornment('end', end),
            },
            htmlInput: Number(maxLength) > 0 ? { maxLength: Number(maxLength) } : undefined,
          }}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) events.onEnterKeyDown();
          }}
          onFocus={() => events.onFocus()}
          onBlur={() => {
            check.touch();
            events.onBlur();
          }}
        />
      </Loading>
    </MuiProvider>
  );
};

// MUI's TextField multiline: label, value, placeholder, helperText, minRows / maxRows (it grows between them),
// variant, size; onChange, onFocus, onBlur. Enter adds a line; Ctrl/Cmd+Enter fires onEnterKeyDown.
export const MultilineTextField = () => {
  const field = useFieldProps({ label: 'Notes' });
  const [value, setValue] = useStateText({ name: 'value', label: 'Value', initialValue: '' });
  const [placeholder] = useStateText({ name: 'placeholder', label: 'Placeholder', initialValue: 'Add a note...' });
  const [minRows] = ToolJet.useStateNumber({ name: 'minRows', label: 'Min rows', initialValue: 3, min: 1, max: 40 });
  const [maxRows] = ToolJet.useStateNumber({ name: 'maxRows', label: 'Max rows', description: '0 for no limit.', initialValue: 8, min: 0, max: 80 });
  const look = useTextFieldLook();
  const events = useTextEvents();
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'text', value });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 12 });

  const change = (next: string) => {
    setValue(next);
    events.onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(str(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(''));
  useFocusActions(ref);

  const min = Math.max(1, Number(minRows) || 3);
  const max = Number(maxRows) > 0 ? Math.max(min, Number(maxRows)) : undefined;
  return (
    <MuiProvider overrides={overrides} className={fieldClass(look.variant, field.label)}>
      <Loading loading={loading} look={<FieldSkeleton variant={look.variant} size={look.size} rows={min} />}>
        <MuiTextField
          inputRef={ref}
          id={fieldId}
          fullWidth
          multiline
          minRows={min}
          maxRows={max}
          label={field.label || undefined}
          value={value ?? ''}
          placeholder={placeholder || undefined}
          variant={look.variant}
          size={look.size}
          color={look.color}
          disabled={disabled}
          {...checkProps(check, field.helperText)}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) events.onEnterKeyDown();
          }}
          onFocus={() => events.onFocus()}
          onBlur={() => {
            check.touch();
            events.onBlur();
          }}
        />
      </Loading>
    </MuiProvider>
  );
};

// A number in MUI's TextField (type number): label, value (a number, null for none), min, max, step,
// startAdornment / endAdornment (a unit or currency sign); onChange, onEnterKeyDown, onFocus, onBlur.
export const NumberField = () => {
  const field = useFieldProps({ label: 'Quantity' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', description: 'A number; empty for none.', initialValue: null });
  const [placeholder] = useStateText({ name: 'placeholder', label: 'Placeholder', initialValue: '0' });
  const [min] = ToolJet.useStateNumber({ name: 'min', label: 'Min', description: 'Empty for no minimum.', initialValue: null });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', description: 'Empty for no maximum.', initialValue: null });
  const [step] = ToolJet.useStateNumber({ name: 'step', label: 'Step', initialValue: 1, min: 0 });
  const [startAdornment] = useStateText({ name: 'startAdornment', label: 'Start adornment', description: 'A unit or sign such as $, or an icon name.', initialValue: '' });
  const [endAdornment] = useStateText({ name: 'endAdornment', label: 'End adornment', description: 'A unit such as kg or %.', initialValue: '' });
  const look = useTextFieldLook();
  const events = useTextEvents();
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const num = toNumber(value);
  const check = ToolJet.useValidation({ section: 'text', value: num === null ? '' : String(num), present: num !== null });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 7 });
  const lo = toNumber(min);
  const hi = toNumber(max);

  const change = (next: number | null) => {
    setValue(next as number);
    events.onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(toNumber(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(null));
  useFocusActions(ref);
  // A number input's unfinished draft ('-', '1e') reads as an empty value, so clearForm, which empties an already empty
  // value, left it showing (and React does not rewrite a focused number input whose value it thinks unchanged).
  ToolJet.useFormClear(() => {
    if (ref.current) ref.current.value = '';
  });

  return (
    <MuiProvider overrides={overrides} className={fieldClass(look.variant, field.label)}>
      <Loading loading={loading} look={<FieldSkeleton variant={look.variant} size={look.size} />}>
        <MuiTextField
          inputRef={ref}
          id={fieldId}
          fullWidth
          type="number"
          label={field.label || undefined}
          value={num ?? ''}
          placeholder={placeholder || undefined}
          variant={look.variant}
          size={look.size}
          color={look.color}
          disabled={disabled}
          {...checkProps(check, field.helperText)}
          slotProps={{
            input: { startAdornment: adornment('start', iconOrText(startAdornment)), endAdornment: adornment('end', iconOrText(endAdornment)) },
            htmlInput: { min: lo ?? undefined, max: hi ?? undefined, step: Number(step) > 0 ? Number(step) : 'any' },
          }}
          onChange={(e) => change(e.target.value === '' ? null : toNumber(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') events.onEnterKeyDown();
          }}
          onFocus={() => events.onFocus()}
          onBlur={() => {
            // Out-of-range input is clamped on blur, as a number field does.
            if (num !== null && ((lo !== null && num < lo) || (hi !== null && num > hi))) change(hi !== null && num > hi ? hi : (lo as number));
            check.touch();
            events.onBlur();
          }}
        />
      </Loading>
    </MuiProvider>
  );
};
