import React, { useEffect, useMemo, useRef } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Field } from '../lib/Field';
import { cn } from '../lib/cn';
import { groupButtons, initialSelection, list, selectionExposed, toggleSelection } from '../lib/ui2/nav/model';
import type { GroupButton } from '../lib/ui2/nav/model';
import { isSet, lookVars, px } from '../lib/ui2/nav/look';
import { useStable } from '../lib/ui2/nav/hooks';
import { Icon } from '../lib/ui2/nav/parts';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

const VARIANTS = ['outline', 'secondary', 'default', 'ghost'];

// UI 2.0 Button group: attached buttons that select one value, several, or none (the buttons only act).
export const ButtonGroup = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: '' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [buttons] = ToolJet.useStateArray({
    name: 'buttons',
    label: 'Buttons',
    inspector: 'options',
    description: 'Array of { label, value, icon, disabled, variant, tooltip } objects, or plain strings. An empty label with an icon is an icon button.',
    initialValue: [
      { label: 'Day', value: 'day' },
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
    ],
  });
  const [mode] = ToolJet.useStateEnumeration({
    name: 'mode',
    label: 'Mode',
    enumDefinition: ['actions', 'single', 'multiple', 'none'],
    enumLabels: { actions: 'Actions', single: 'Single', multiple: 'Multiple', none: 'Buttons only (legacy)' },
    initialValue: 'single',
    inspector: 'switch',
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default selected (value, or a list when multiple)', initialValue: '' });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Selected value (single)', initialValue: 'week' });
  const [selected, setSelected] = ToolJet.useStateArray({ name: 'selected', label: 'Selected values (multiple)', initialValue: [] });
  const [allowDeselect] = ToolJet.useStateBoolean({ name: 'allowDeselect', label: 'Allow deselecting (single)', initialValue: false });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['outline', 'secondary', 'default', 'ghost'],
    enumLabels: { outline: 'Outline', secondary: 'Secondary', default: 'Default', ghost: 'Ghost' },
    initialValue: 'outline',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Sm', default: 'Default', lg: 'Lg' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [orientation] = ToolJet.useStateEnumeration({
    name: 'orientation',
    label: 'Orientation',
    enumDefinition: ['horizontal', 'vertical'],
    enumLabels: { horizontal: 'Horizontal', vertical: 'Vertical' },
    initialValue: 'horizontal',
    inspector: 'switch',
  });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: false });
  const [legacyDisabled] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable (legacy)', initialValue: false });
  const [, setLastClicked] = ToolJet.useStateObject({ name: 'lastClicked', initialValue: {}, inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const control = ToolJet.useControlState();
  const backgroundColor = useThemeColor('backgroundColor', 'Button background', TOKEN.surface);
  const hoverBackgroundColor = useThemeColor('hoverBackgroundColor', 'Button hover background', TOKEN.muted);
  const textColor = useThemeColor('textColor', 'Button text color', TOKEN.text);
  const borderColor = useThemeColor('borderColor', 'Border and divider color', TOKEN.border);
  const selectedBg = useThemeColor('selectedBackgroundColor', 'Selected background', TOKEN.brand);
  const selectedText = useThemeColor('selectedTextColor', 'Selected text color', TOKEN.surface);
  const iconColor = useThemeColor('iconColor', 'Icon color', TOKEN.text);
  const labelColor = useThemeColor('labelColor', 'Label color', TOKEN.text);
  const radius = useThemeRadius('borderRadius', 'Group radius');
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 4 });

  const kind = mode === 'none' ? 'actions' : mode;
  const source = useStable(buttons);
  const items = useMemo(() => groupButtons(source), [source]);
  // The selection as keys, read from the exposed values (single: value, multiple: selected).
  const keys = kind === 'multiple' ? list(selected).map(String) : kind === 'single' && value !== '' && value != null ? [String(value)] : [];
  const live = useRef({ kind, items, keys });
  live.current = { kind, items, keys };
  const apply = (next: string[]) => {
    const { value: v, selected: s } = selectionExposed(next, live.current.kind, live.current.items);
    live.current.keys = next;
    if (live.current.kind === 'multiple') setSelected(s);
    else {
      setValue(String(v));
      setSelected(s);
    }
  };
  // A new Default selected (or mode) starts the selection again, as UI 2.0's does.
  const firstRun = useRef(true);
  const stableDefault = useStable(defaultValue);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (defaultValue === '' || defaultValue == null) return;
    }
    const raw = typeof defaultValue === 'string' && defaultValue.trim().startsWith('[') ? safeJson(defaultValue) : defaultValue;
    apply(initialSelection(raw, live.current.kind, live.current.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableDefault, kind]);

  const check = ToolJet.useValidation({ section: 'choice', value: kind === 'multiple' ? keys : keys[0] ?? '', present: keys.length > 0 });
  const disabled = control.disabled || legacyDisabled;
  const click = (button: GroupButton) => {
    if (disabled || button.disabled) return;
    setLastClicked({ label: button.label, value: button.value });
    const next = toggleSelection(keys, String(button.value), kind, allowDeselect === true);
    const changed = next.join('\u0000') !== keys.join('\u0000');
    if (changed) apply(next);
    check.touch();
    onClick();
    if (changed) onChange();
  };
  ToolJet.useAction({ name: 'setSelected', displayName: 'Set selected', params: [{ handle: 'selected', displayName: 'Value (or a list)' }] }, (v) => {
    apply(initialSelection(v, live.current.kind, live.current.items));
  });
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => apply([]));

  const look = VARIANTS.includes(variant) ? variant : 'outline';
  const vertical = orientation === 'vertical';
  const on = new Set(keys);
  const vars = lookVars([
    [backgroundColor, '--lk-bg'],
    [hoverBackgroundColor, '--lk-hover'],
    [textColor, '--lk-fg'],
    [borderColor, '--lk-border'],
    [selectedBg, '--lk-on-bg'],
    [selectedText, '--lk-on-fg'],
    [iconColor, '--lk-icon'],
    [labelColor, '--lk-label'],
    [radius, '--lk-radius', px],
  ]);

  return (
    <div className="ui" style={vars}>
      <Field label={label} description={description} error={check.error} required={check.required} className="n2-group-field">
        {items.length ? (
          <div className={cn('n2-group-row', fullWidth && 'is-full')}>
            <div
              role="group"
              aria-label={label || 'Button group'}
              className={cn(
                'n2-group',
                vertical ? 'is-vertical' : 'is-horizontal',
                fullWidth && 'is-full',
                look === 'outline' ? 'is-outline' : look === 'ghost' ? 'is-ghost' : 'is-filled'
              )}
            >
              {items.map((button) => {
                const isOn = kind !== 'actions' && on.has(String(button.value));
                const own = button.variant || look;
                return (
                  <button
                    key={String(button.value)}
                    type="button"
                    data-state={kind === 'actions' ? undefined : isOn ? 'on' : 'off'}
                    aria-pressed={kind === 'actions' ? undefined : isOn}
                    disabled={disabled || button.disabled}
                    title={button.tooltip || (!button.label ? String(button.value) : fullWidth ? button.label : undefined)}
                    aria-label={!button.label ? String(button.value) : undefined}
                    onClick={() => click(button)}
                    className={cn(
                      'ui-btn n2-btn',
                      `ui-btn--${own}`,
                      size !== 'default' && `ui-btn--${size}`,
                      !button.label && button.icon && 'is-square',
                      isSet(backgroundColor) && 'has-bg',
                      isSet(hoverBackgroundColor) && 'has-hover',
                      isSet(textColor) && 'has-fg',
                      own === 'outline' && isSet(borderColor) && 'has-border'
                    )}
                  >
                    {button.icon ? <Icon name={button.icon} className="n2-group-icon" /> : null}
                    {button.label ? <span className="n2-truncate">{button.label}</span> : null}
                  </button>
                );
              })}
            </div>
            {control.loading ? <span className="n2-spinner" /> : null}
          </div>
        ) : (
          <p className="n2-empty">No buttons</p>
        )}
      </Field>
    </div>
  );
};

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
