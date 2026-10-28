import React from 'react';
import { FormControl, FormHelperText, FormLabel } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from './text';

type Check = { error: string; required: boolean };

export type TextFieldVariant = 'outlined' | 'filled' | 'standard';
export type FieldSize = 'small' | 'medium';
export type PaletteColor = 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
export const PALETTE_COLORS: PaletteColor[] = ['primary', 'secondary', 'error', 'info', 'success', 'warning'];

/** label and helperText, the two texts of every MUI form control. The host's validation message replaces helperText. */
export const useFieldProps = (defaults: { label?: string } = {}) => {
  const [label] = useStateText({ name: 'label', label: 'Label', initialValue: defaults.label ?? '' });
  const [helperText] = useStateText({
    name: 'helperText',
    label: 'Helper text',
    description: 'Text under the field. A validation message replaces it.',
    initialValue: '',
  });
  return { label, helperText };
};

/** variant, size and color of MUI's TextField family (TextField, Select, Autocomplete, the pickers). */
export const useTextFieldLook = () => {
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['outlined', 'filled', 'standard'],
    initialValue: 'outlined',
  });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium'], initialValue: 'medium' });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', description: 'The focused colour.', enumDefinition: PALETTE_COLORS, initialValue: 'primary' });
  return { variant: variant as TextFieldVariant, size: size as FieldSize, color: color as PaletteColor };
};

/**
 * The root class of an outlined field with a label. MUI's outlined label floats up onto the outline, 9px above the
 * 56px field, and ToolJet clips the widget box: the class reserves that space inside the box.
 */
export const fieldClass = (variant: string, label: string) => (variant === 'outlined' && label ? 'tj-mui-field--outlined-label' : undefined);

/** What the validation check adds to a TextField: error, required and the message as helperText. */
export const checkProps = (check: Check, helperText: string) => ({
  error: !!check.error,
  required: check.required,
  helperText: check.error || helperText || undefined,
});

// MUI's FormControl layout for controls without their own label (Checkbox, Switch, RadioGroup, ToggleButtonGroup,
// Rating, Slider): a FormLabel, the control, and a FormHelperText with the help or the validation message.
export const FormControlField = ({
  label,
  helperText,
  check,
  htmlFor,
  disabled,
  children,
}: {
  label?: string;
  helperText?: string;
  check: Check;
  htmlFor?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const help = check.error || helperText;
  return (
    <FormControl error={!!check.error} required={check.required} disabled={disabled} fullWidth component="fieldset" variant="standard">
      {label ? (
        <FormLabel htmlFor={htmlFor} component="legend" sx={{ fontSize: '0.875rem', mb: 0.25 }}>
          {label}
        </FormLabel>
      ) : null}
      {children}
      {help ? <FormHelperText sx={{ mx: 0 }}>{help}</FormHelperText> : null}
    </FormControl>
  );
};

// A role value can set variant and color together (pack.json roleValues: { variant: 'outlined', color: 'inherit' }).
export const lookOf = (variant: unknown, color: unknown) => {
  if (variant && typeof variant === 'object') {
    const v = variant as Record<string, unknown>;
    return { variant: String(v.variant ?? 'contained'), color: String(v.color ?? color ?? 'primary') };
  }
  return { variant: String(variant ?? 'contained'), color: String(color ?? 'primary') };
};
