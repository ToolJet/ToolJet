import React, { useRef } from 'react';
import { Button as AntButton } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';

// Ant's Button (5.21+ API): its text is its children; color (primary, default, danger) and variant (solid, outlined,
// dashed, filled, text, link) together make the look; size, shape, block, href / target; event onClick.
export const Button = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Button' });
  const [color] = ToolJet.useStateEnumeration({
    name: 'color',
    label: 'Color',
    enumDefinition: ['primary', 'default', 'danger'],
    initialValue: 'primary',
  });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['solid', 'outlined', 'dashed', 'filled', 'text', 'link'],
    initialValue: 'solid',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['small', 'middle', 'large'],
    initialValue: 'middle',
  });
  const [shape] = ToolJet.useStateEnumeration({
    name: 'shape',
    label: 'Shape',
    enumDefinition: ['default', 'round'],
    initialValue: 'default',
  });
  const [block] = ToolJet.useStateBoolean({
    name: 'block',
    label: 'Block',
    description: 'Fill the width of the box.',
    initialValue: true,
  });
  const [href] = ToolJet.useStateString({
    name: 'href',
    label: 'Href',
    description: 'Makes the button a link.',
    initialValue: '',
  });
  const [target] = ToolJet.useStateEnumeration({
    name: 'target',
    label: 'Target',
    enumDefinition: ['_self', '_blank'],
    initialValue: '_blank',
  });
  const onClickEvent = ToolJet.useEventCallback({ name: 'onClick' });
  // Inside a Form whose submit button this is, a click submits it first, as the native Button does.
  const submitForm = (ToolJet as { useFormSubmit?: () => () => void }).useFormSubmit?.();
  const onClick = () => {
    submitForm?.();
    onClickEvent();
  };
  const { disabled, loading } = ToolJet.useControlState();
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'button',
    fit: false,
    loading: 'own',
    usage:
      "Ant's Button: children is its text; color (primary, default, danger) with variant (solid, outlined, dashed, filled, text, link); block fills the width; onClick. For a destructive button set color danger.",
    roleProps: { text: 'children', variant: 'variant' },
    roleValues: {
      variant: {
        default: 'solid',
        secondary: 'filled',
        outline: 'outlined',
        ghost: 'text',
        destructive: 'solid',
        link: 'link',
      },
    },
    defaultWidth: 6,
    defaultHeight: 4,
  });

  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => {
    if (!disabled && !loading) onClick();
  });
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());

  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center">
      <AntButton
        ref={ref}
        color={color as 'primary'}
        variant={variant as 'solid'}
        size={size as 'middle'}
        shape={shape as 'default'}
        block={block}
        href={href || undefined}
        target={href ? target : undefined}
        disabled={disabled}
        loading={loading}
        onClick={() => onClick()}
      >
        {children}
      </AntButton>
    </AntProvider>
  );
};
