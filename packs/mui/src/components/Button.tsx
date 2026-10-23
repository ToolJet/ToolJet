import React, { useRef } from 'react';
import { Button as MuiButton, Tooltip } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { ICON_NAMES, iconOf } from '../lib/icons';
import { lookOf } from '../lib/field';

// MUI's Button: children is its text; variant (text, outlined, contained) and color (inherit or a palette colour) make
// the look; size, fullWidth, disableElevation, startIcon / endIcon (icon names), href; a Tooltip title. Event onClick.
export const Button = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Button' });
  const [variantProp] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['text', 'outlined', 'contained'], initialValue: 'contained' });
  const [colorProp] = ToolJet.useStateEnumeration({
    name: 'color',
    label: 'Color',
    enumDefinition: ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'],
    initialValue: 'primary',
  });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium' });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: true });
  const [disableElevation] = ToolJet.useStateBoolean({ name: 'disableElevation', label: 'Disable elevation', initialValue: false });
  const [startIcon] = ToolJet.useStateString({ name: 'startIcon', label: 'Start icon', description: `An icon name: ${ICON_NAMES.join(', ')}.`, initialValue: '' });
  const [endIcon] = ToolJet.useStateString({ name: 'endIcon', label: 'End icon', description: 'An icon name, as startIcon.', initialValue: '' });
  const [href] = ToolJet.useStateString({ name: 'href', label: 'Href', description: 'Makes the button a link.', initialValue: '' });
  const [tooltip] = ToolJet.useStateString({ name: 'tooltip', label: 'Tooltip', description: 'Tooltip title shown on hover.', initialValue: '' });
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
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4.1 });

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
      onClick={() => onClick()}
    >
      {children}
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
