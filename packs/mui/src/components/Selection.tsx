import React from 'react';
import {
  Checkbox as MuiCheckbox,
  FormControlLabel,
  Radio,
  RadioGroup as MuiRadioGroup,
  Rating as MuiRating,
  Slider as MuiSlider,
  Switch as MuiSwitch,
  ToggleButton,
  ToggleButtonGroup as MuiToggleButtonGroup,
} from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { FormControlField, PALETTE_COLORS, useFieldProps } from '../lib/field';
import { str, toArray, toOptions } from '../lib/data';
import { toNumber } from '../lib/format';
import { Loading, Spinner } from '../lib/loading';
import { SAMPLE } from '../lib/samples';

const bool = (v: unknown) => v === true || v === 'true';

/** checked, the toggle actions and onChange: what Checkbox and Switch share. */
const useChecked = () => {
  const [checked, setChecked] = ToolJet.useStateBoolean({ name: 'checked', label: 'Checked', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const change = (next: boolean) => {
    setChecked(next);
    onChange();
  };
  ToolJet.useAction({ name: 'setChecked', displayName: 'Set checked', params: [{ handle: 'checked', displayName: 'Checked' }] }, (next) => change(bool(next)));
  ToolJet.useAction({ name: 'toggle', displayName: 'Toggle' }, () => change(!bool(checked)));
  return { checked: bool(checked), change };
};

const useLabelPlacement = () => {
  const [labelPlacement] = ToolJet.useStateEnumeration({ name: 'labelPlacement', label: 'Label placement', enumDefinition: ['end', 'start', 'top', 'bottom'], initialValue: 'end' });
  return labelPlacement as 'end';
};

// MUI's Checkbox in a FormControlLabel: label, checked, indeterminate, color, size, labelPlacement, helperText;
// event onChange; actions setChecked, toggle.
export const Checkbox = () => {
  const field = useFieldProps({ label: 'Checkbox' });
  const { checked, change } = useChecked();
  const [indeterminate] = ToolJet.useStateBoolean({ name: 'indeterminate', label: 'Indeterminate', initialValue: false });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: PALETTE_COLORS, initialValue: 'primary' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium' });
  const labelPlacement = useLabelPlacement();
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value: checked, present: checked });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 4.6 });
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<Spinner />}>
        <FormControlField helperText={field.helperText} check={check}>
          <FormControlLabel
            label={field.label}
            labelPlacement={labelPlacement}
            disabled={disabled}
            required={check.required}
            control={
              <MuiCheckbox
                id={fieldId}
                checked={checked}
                indeterminate={indeterminate && !checked}
                color={color as 'primary'}
                size={size as 'medium'}
                onChange={(e) => {
                  change(e.target.checked);
                  check.touch();
                }}
              />
            }
          />
        </FormControlField>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Switch in a FormControlLabel: label, checked, color, size (small, medium), labelPlacement, helperText;
// event onChange; actions setChecked, toggle.
export const Switch = () => {
  const field = useFieldProps({ label: 'Switch' });
  const { checked, change } = useChecked();
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: PALETTE_COLORS, initialValue: 'primary' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium'], initialValue: 'medium' });
  const labelPlacement = useLabelPlacement();
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value: checked, present: checked });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 4.2 });
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<Spinner />}>
        <FormControlField helperText={field.helperText} check={check}>
          <FormControlLabel
            label={field.label}
            labelPlacement={labelPlacement}
            disabled={disabled}
            required={check.required}
            control={<MuiSwitch id={fieldId} checked={checked} color={color as 'primary'} size={size as 'medium'} onChange={(e) => change(e.target.checked)} />}
          />
        </FormControlField>
      </Loading>
    </MuiProvider>
  );
};

// MUI's RadioGroup with a FormLabel: label, options [{ label, value, disabled }], value, row (side by side), color,
// size, helperText; event onChange; actions setValue, clear.
export const RadioGroup = () => {
  const field = useFieldProps({ label: 'Plan' });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: SAMPLE.plans });
  const [value, setValue] = useStateText({ name: 'value', label: 'Value', initialValue: '' });
  const [row] = ToolJet.useStateBoolean({ name: 'row', label: 'Row', description: 'Options side by side.', initialValue: false });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: PALETTE_COLORS, initialValue: 'primary' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium'], initialValue: 'medium' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const options = toOptions(rawOptions);
  const check = ToolJet.useValidation({ section: 'choice', value, present: options.some((o) => o.value === value) });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 10 });
  const change = (next: string) => {
    setValue(next);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(str(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(''));
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<Spinner />}>
        <FormControlField label={field.label} helperText={field.helperText} check={check} htmlFor={fieldId} disabled={disabled}>
          <MuiRadioGroup
            id={fieldId}
            row={row}
            value={value ?? ''}
            onChange={(e) => {
              change(e.target.value);
              check.touch();
            }}
          >
            {options.map((o) => (
              <FormControlLabel
                key={o.value}
                value={o.value}
                label={o.label}
                disabled={o.disabled}
                control={<Radio color={color as 'primary'} size={size as 'medium'} />}
              />
            ))}
          </MuiRadioGroup>
        </FormControlField>
      </Loading>
    </MuiProvider>
  );
};

// MUI's ToggleButtonGroup: options [{ label, value }], exclusive (one value) or not (value is an array, MUI's shape),
// value, color, size, orientation, fullWidth; event onChange.
export const ToggleButtonGroup = () => {
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: SAMPLE.periods });
  const [exclusive] = ToolJet.useStateBoolean({ name: 'exclusive', label: 'Exclusive', description: 'One value at a time; off, value is an array.', initialValue: true });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'The value; an array when not exclusive.', initialValue: '' });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: ['standard', ...PALETTE_COLORS], initialValue: 'primary' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium' });
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 5.2 });
  const options = toOptions(rawOptions);
  const current: string | string[] | null = exclusive ? (Array.isArray(value) ? str(value[0]) : str(value)) || null : toArray(value).map(str);
  const change = (next: string | string[] | null) => {
    setValue(next as string);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) =>
    change(exclusive ? str(next) || null : toArray(next).map(str))
  );
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center tj-mui-start">
      <Loading loading={loading} look={<Spinner />}>
        <MuiToggleButtonGroup
          exclusive={exclusive}
          value={current}
          color={color as 'primary'}
          size={size as 'small'}
          orientation={orientation as 'horizontal'}
          fullWidth={fullWidth}
          disabled={disabled}
          onChange={(_, next) => {
            // An exclusive group reports null when the picked button is pressed again: keep the value.
            if (exclusive && next === null) return;
            change(next);
          }}
        >
          {options.map((o) => (
            <ToggleButton key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </ToggleButton>
          ))}
        </MuiToggleButtonGroup>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Rating: label, value (a number, null for none), max, precision (1, or 0.5 for halves), size, readOnly,
// highlightSelectedOnly; event onChange (and onChangeActive while hovering). Actions setValue, clear.
export const Rating = () => {
  const field = useFieldProps({ label: 'Rating' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: null });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', initialValue: 5, min: 1, max: 10 });
  const [precision] = ToolJet.useStateEnumeration({ name: 'precision', label: 'Precision', enumDefinition: ['1', '0.5'], initialValue: '1' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium' });
  const [readOnly] = ToolJet.useStateBoolean({ name: 'readOnly', label: 'Read only', initialValue: false });
  const [highlightSelectedOnly] = ToolJet.useStateBoolean({ name: 'highlightSelectedOnly', label: 'Highlight selected only', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onChangeActive = ToolJet.useEventCallback({ name: 'onChangeActive' });
  const [, setHover] = ToolJet.useStateNumber({ name: 'hover', initialValue: -1, inspector: 'hidden' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const num = toNumber(value);
  const check = ToolJet.useValidation({ section: 'choice', value: num ?? '', present: num !== null && num > 0 });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 5 });
  const change = (next: number | null) => {
    setValue(next as number);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => change(toNumber(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(null));
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<Spinner />}>
        <FormControlField label={field.label} helperText={field.helperText} check={check} htmlFor={fieldId}>
          <MuiRating
            name={fieldId ?? 'rating'}
            value={num}
            max={Math.max(1, Number(max) || 5)}
            precision={Number(precision) || 1}
            size={size as 'medium'}
            readOnly={readOnly}
            highlightSelectedOnly={highlightSelectedOnly}
            disabled={disabled}
            onChange={(_, next) => {
              change(next);
              check.touch();
            }}
            onChangeActive={(_, hover) => {
              setHover(hover);
              onChangeActive();
            }}
          />
        </FormControlField>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Slider: label, value, min, max, step, marks, valueLabelDisplay (auto, on, off), color, size; events onChange
// (while dragging) and onChangeCommitted (on release).
export const Slider = () => {
  const field = useFieldProps({ label: 'Volume' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: 50 });
  const [min] = ToolJet.useStateNumber({ name: 'min', label: 'Min', initialValue: 0 });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', initialValue: 100 });
  const [step] = ToolJet.useStateNumber({ name: 'step', label: 'Step', initialValue: 1, min: 0 });
  const [marks] = ToolJet.useStateBoolean({ name: 'marks', label: 'Marks', description: 'A mark at every step.', initialValue: false });
  const [valueLabelDisplay] = ToolJet.useStateEnumeration({ name: 'valueLabelDisplay', label: 'Value label display', enumDefinition: ['auto', 'on', 'off'], initialValue: 'auto' });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: PALETTE_COLORS, initialValue: 'primary' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium'], initialValue: 'medium' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onChangeCommitted = ToolJet.useEventCallback({ name: 'onChangeCommitted' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value, present: true });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 5.6 });
  const lo = toNumber(min) ?? 0;
  const hi = Math.max(lo, toNumber(max) ?? 100);
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => {
    setValue(Math.min(hi, Math.max(lo, toNumber(next) ?? lo)));
    onChange();
  });
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<Spinner />}>
        <FormControlField label={field.label} helperText={field.helperText} check={check} htmlFor={fieldId}>
          <MuiSlider
            id={fieldId}
            value={Math.min(hi, Math.max(lo, toNumber(value) ?? lo))}
            min={lo}
            max={hi}
            step={Number(step) > 0 ? Number(step) : null}
            marks={marks}
            valueLabelDisplay={valueLabelDisplay as 'auto'}
            color={color as 'primary'}
            size={size as 'medium'}
            disabled={disabled}
            onChange={(_, next) => {
              setValue(next as number);
              onChange();
            }}
            onChangeCommitted={() => onChangeCommitted()}
          />
        </FormControlField>
      </Loading>
    </MuiProvider>
  );
};
