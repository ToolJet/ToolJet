import React, { useRef } from 'react';
import { Button as MuiButton, Tooltip } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { ICON_NAMES, iconOf } from '../lib/icons';
import { lookOf } from '../lib/field';

// MUI's Button: children is its text; variant (text, outlined, contained) and color (inherit or a palette colour) make
// the look; size, fullWidth, disableElevation, startIcon / endIcon (icon names), href; a Tooltip title. Event onClick.
export const Button = () => {
  const [children] = useStateText({ name: 'children', label: 'Text', initialValue: 'Button' });
  const [variantProp] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['text', 'outlined', 'contained'],
    initialValue: 'contained',
  });
  const [colorProp] = ToolJet.useStateEnumeration({
    name: 'color',
    label: 'Color',
    enumDefinition: ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'],
    initialValue: 'primary',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['small', 'medium', 'large'],
    initialValue: 'medium',
  });
  const [fullWidth] = ToolJet.useStateBoolean({
    name: 'fullWidth',
    label: 'Full width',
    description: 'Stretch the button to the width of its box; off, it is as wide as its label.',
    initialValue: true,
  });
  const [disableElevation] = ToolJet.useStateBoolean({
    name: 'disableElevation',
    label: 'Disable elevation',
    initialValue: false,
  });
  const [startIcon] = useStateText({
    name: 'startIcon',
    label: 'Start icon',
    description: `An icon name: ${ICON_NAMES.join(', ')}.`,
    initialValue: '',
  });
  const [endIcon] = useStateText({
    name: 'endIcon',
    label: 'End icon',
    description: 'An icon name, as startIcon.',
    initialValue: '',
  });
  const [href] = useStateText({
    name: 'href',
    label: 'Href',
    description: 'Makes the button a link.',
    initialValue: '',
  });
  const [tooltip] = useStateText({
    name: 'tooltip',
    label: 'Tooltip',
    description: 'Tooltip title shown on hover.',
    initialValue: '',
  });
  const { variant, color } = lookOf(variantProp, colorProp);
  const onClickEvent = ToolJet.useEventCallback({ name: 'onClick' });
  // Inside a Form whose submit button this is, a click submits it first, as the native Button does.
  const submitForm = (ToolJet as { useFormSubmit?: () => () => void }).useFormSubmit?.();
  const onClick = () => {
    submitForm?.();
    onClickEvent();
  };
  const { disabled, loading } = ToolJet.useControlState();
  const ref = useRef<HTMLButtonElement>(null);
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({
    role: 'button',
    fit: false,
    loading: 'own',
    usage:
      "MUI's Button: children is its text; variant (text, outlined, contained) with color (inherit, primary, secondary, success, error, info, warning); size, fullWidth, disableElevation, startIcon/endIcon (MUI icon names such as Add, Save, Delete), href, tooltip; onClick.",
    roleProps: { text: 'children', variant: 'variant' },
    roleValues: {
      variant: {
        default: { variant: 'contained', color: 'primary' },
        secondary: { variant: 'outlined', color: 'inherit' },
        outline: { variant: 'outlined', color: 'primary' },
        ghost: { variant: 'text', color: 'inherit' },
        destructive: { variant: 'contained', color: 'error' },
        link: { variant: 'text', color: 'primary' },
      },
    },
    labelCase: 'upper',
    defaultWidth: 6,
    defaultHeight: 4,
  });

  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => {
    if (!disabled && !loading) onClick();
  });
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  const button = (
    <MuiButton
      ref={ref}
      variant={variant as 'contained'}
      color={color as 'primary'}
      size={size as 'medium'}
      fullWidth={fullWidth}
      disableElevation={disableElevation}
      startIcon={iconOf(startIcon)}
      endIcon={iconOf(endIcon)}
      {...(href ? ({ href, target: '_blank', rel: 'noopener noreferrer' } as object) : {})}
      disabled={disabled}
      loading={loading}
      // The label stays on one line, cut with an ellipsis; the full text shows on hover (unless there is a tooltip).
      title={tooltip ? undefined : children || undefined}
      onClick={() => onClick()}
    >
      <span className="tj-mui-button-label">{children}</span>
    </MuiButton>
  );
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center">
      {tooltip ? (
        <Tooltip title={tooltip} arrow>
          {/* A disabled button fires no events: the span keeps the tooltip working. */}
          <span className={fullWidth ? 'tj-mui-block' : undefined}>{button}</span>
        </Tooltip>
      ) : (
        button
      )}
    </MuiProvider>
  );
};
