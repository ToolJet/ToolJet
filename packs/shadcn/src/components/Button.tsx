import React, { useEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { isSet, lookVars, px } from '../lib/ui2/nav/look';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];
const SIZES = ['sm', 'default', 'lg'];
/** A variant or size, now that they can be bound: a known name in any case, anything else the default. */
const oneOf = (names: string[], value: unknown) => {
  const name = String(value ?? '').trim().toLowerCase();
  return names.includes(name) ? name : 'default';
};

// UI 2.0 Button: the shadcn variants, filling its box as ToolJet's Button does. Each variant keeps its own colours;
// a style replaces them only when set.
export const Button = () => {
  const [text] = ToolJet.useStateString({ name: 'text', label: 'Label', initialValue: 'Button' });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    enumLabels: { default: 'Default', secondary: 'Secondary', outline: 'Outline', ghost: 'Ghost', destructive: 'Destructive', link: 'Link' },
    initialValue: 'default',
    section: 'Appearance',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Sm', default: 'Default', lg: 'Lg' },
    initialValue: 'default',
    inspector: 'switch',
    section: 'Appearance',
  });
  // Kept, hidden, for apps that set it: the button always fills its box, and in a Flex container the box is what
  // stretches (the child's Fill or fixed width), as with ToolJet's Button, so the option changed nothing.
  ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Stretch in flex container', initialValue: false, section: 'Appearance', inspector: 'hidden' });
  // The pack's earlier Disable and Show spinner, hidden for the host's Disable and Loading (setDisable, setLoading) but
  // still honoured when an older app saved them on.
  const [legacyDisabled] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable (legacy)', initialValue: false, inspector: 'hidden' });
  const [legacyLoading] = ToolJet.useStateBoolean({ name: 'loading', label: 'Show spinner', initialValue: false, inspector: 'hidden' });
  const [, setButtonText] = ToolJet.useStateString({ name: 'buttonText', initialValue: 'Button', inspector: 'hidden' });
  const onClickEvent = ToolJet.useEventCallback({ name: 'onClick' });
  // Inside a Form whose submit button this is, a click submits it first, as UI 2.0's and the native Button do.
  const submitForm = (ToolJet as { useFormSubmit?: () => () => void }).useFormSubmit?.();
  const onClick = () => {
    submitForm?.();
    onClickEvent();
  };
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const control = ToolJet.useControlState();

  // setText changes the label until the Label property itself changes, like the native Button's.
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => setOverride(null), [text]);
  const label = override ?? String(text ?? '');
  useEffect(() => setButtonText(label), [label, setButtonText]);

  const loading = control.loading || legacyLoading === true;
  const busy = control.disabled || legacyDisabled === true || loading;
  const latest = useRef(busy);
  latest.current = busy;
  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => {
    if (!latest.current) onClick();
  });
  ToolJet.useAction({ name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: 'New text' }] }, (t) =>
    setOverride(t === undefined || t === null ? '' : String(t))
  );
  const backgroundColor = useThemeColor('backgroundColor', 'Button background', TOKEN.brand);
  const hoverBackgroundColor = useThemeColor('hoverBackgroundColor', 'Button hover background', TOKEN.brand);
  const textColor = useThemeColor('textColor', 'Button text color', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Button border color', 'transparent');
  const radius = useThemeRadius('borderRadius', 'Button radius');
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });

  const look = oneOf(VARIANTS, variant);
  const scale = oneOf(SIZES, size);
  return (
    <div
      className="ui"
      style={{
        display: 'flex',
        alignItems: 'center',
        ...lookVars([
          [backgroundColor, '--lk-bg'],
          [hoverBackgroundColor, '--lk-hover'],
          [textColor, '--lk-fg'],
          [borderColor, '--lk-border'],
          [radius, '--lk-radius', px],
        ]),
      }}
    >
      <button
        type="button"
        className={cn(
          'ui-btn n2-btn n2-btn-fill',
          `ui-btn--${look}`,
          scale !== 'default' && `ui-btn--${scale}`,
          isSet(backgroundColor) && 'has-bg',
          isSet(hoverBackgroundColor) && 'has-hover',
          isSet(textColor) && 'has-fg',
          isSet(borderColor) && 'has-border'
        )}
        disabled={busy}
        onClick={onClick}
        onMouseEnter={onHover}
      >
        {/* Loading (the host's Loading or the pack's Show spinner), UI 2.0's spinner before the label, disabled. */}
        {loading ? <span className="n2-spinner" role="status" aria-label="Loading" /> : null}
        {label}
      </button>
    </div>
  );
};
