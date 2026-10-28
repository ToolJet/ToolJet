import React, { useEffect, useRef, useState } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import {
  MAX_CHOICES,
  choiceKey,
  defaultKey,
  isDisabledOption,
  keyForValue,
  optionKey,
  optionsByKey,
  shownOptions,
  toChoiceOptions,
  toValueList,
  uniqueKeys,
  wantedValue,
  type ChoiceOption,
} from '../lib/ui2/choice/options';
import { lookVars, useDropRemovedChoices, useResetOn } from '../lib/ui2/choice/looks';
import { moveRovingFocus, rovingEntry } from '../lib/activeElement';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { TOKEN, useThemeRadius } from '../lib/styleDefaults';
import { InlineLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Toggle group (Ui2/ToggleGroup/ToggleGroup.tsx) on the pack's CSS: a segmented control like a tabs list,
// one option picked. The pack's own outline and plain looks, and Allow multiple, stay as extras.
export const ToggleGroup = () => {
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: 'Plain values or [{ label, value, disabled? }].',
    initialValue: ['All', 'Open', 'Closed'],
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: 'All' });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: false });
  // Where the group sits when its box is wider than the buttons: a filter toggle that ends a row reads at the row's end.
  const [alignment] = ToolJet.useStateEnumeration({
    name: 'alignment',
    label: 'Alignment',
    enumDefinition: ['left', 'center', 'right'],
    enumLabels: { left: 'Left', center: 'Center', right: 'Right' },
    initialValue: 'left',
    inspector: 'switch',
    visibleWhen: { key: 'fullWidth', value: false },
  });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Look',
    enumDefinition: ['segmented', 'outline', 'default'],
    enumLabels: { segmented: 'Segmented', outline: 'Outline', default: 'Plain' },
    initialValue: 'segmented',
    section: 'Appearance',
  });
  const [multiple] = ToolJet.useStateBoolean({ name: 'multiple', label: 'Allow multiple', initialValue: false });
  const [defaultValues, setValues] = ToolJet.useStateArray({
    name: 'values',
    label: 'Default values',
    description: 'Selected values when "Allow multiple" is on (also exposed as they change).',
    initialValue: [],
  });
  // Exposed value; `value` was also the pack's default value.
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const backgroundColor = useColorStyle('backgroundColor', 'Group background', TOKEN.muted);
  const textColor = useColorStyle('textColor', 'Option text color', TOKEN.mutedText);
  const selectedBackgroundColor = useColorStyle('selectedBackgroundColor', 'Selected option background', TOKEN.surface);
  const selectedTextColor = useColorStyle('selectedTextColor', 'Selected option text color', TOKEN.text);
  const borderRadius = useThemeRadius('borderRadius', 'Group radius');
  const borderColor = useColorStyle('borderColor', 'Border color (outline look)', TOKEN.border);
  const selectedColor = ToolJet.useStyleString({ name: 'selectedColor', label: 'Selected (earlier name)', inspector: 'hidden', initialValue: '' });
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 4 });
  const { disabled, loading } = useBusy(disabledProp);

  const options = toChoiceOptions(rawOptions, 'ToggleGroup');
  const keyFor = (o: ChoiceOption) => optionKey(o, choiceKey);
  const byKey = optionsByKey(options, choiceKey);
  // The keys a value or a list of values names (the option of each value's own type first), once each.
  const keysFor = (v: unknown) => [...new Set(toValueList(v).map((x) => keyForValue(options, x, choiceKey)))];
  const [key, setKey] = useState(() => {
    const k = defaultKey(defaultValue, options);
    return byKey.has(k) || legacyValue === '' || legacyValue === undefined ? k : defaultKey(legacyValue, options);
  });
  const [keys, setKeys] = useState<string[]>(() => keysFor(defaultValues));
  useResetOn(defaultValue, () => setKey(defaultKey(defaultValue, options)));
  useResetOn(defaultValues, () => setKeys(keysFor(defaultValues)));
  useDropRemovedChoices(options.map(keyFor), key ? [key] : [], () => setKey(''), false);
  const selected = byKey.get(key);
  const pickedValues = keys.map((k) => byKey.get(k)?.value).filter((v) => v !== undefined);
  // Live, as keyRef below: an action reads the multiple selection as last set.
  const keysRef = useRef(keys);
  keysRef.current = keys;
  useEffect(() => setValue((selected?.value ?? '') as string), [key, JSON.stringify(selected)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setValues(pickedValues), [JSON.stringify(pickedValues)]); // eslint-disable-line react-hooks/exhaustive-deps

  // The key as last chosen, ahead of the next render: setValue to the option already chosen fires nothing.
  const keyRef = useRef(key);
  keyRef.current = key;
  const change = (next: string, fire = true) => {
    const same = byKey.get(keyRef.current) === byKey.get(next);
    keyRef.current = next;
    setKey(next);
    setValue((byKey.get(next)?.value ?? '') as string);
    if (fire && !same) onChange();
  };
  // With Allow multiple, the actions set the whole selection: the enabled options a value or a list names, in that
  // order (a value no option has is skipped). A list that names no option changes nothing; clear empties it.
  const changeMany = (next: string[], fire: boolean) => {
    const same = next.join('\u0000') === keysRef.current.join('\u0000');
    keysRef.current = next;
    setKeys(next);
    if (fire && !same) onChange();
  };
  const pickMany = (v: unknown, fire: boolean) => {
    const wanted = Array.isArray(v) ? v.map(wantedValue) : [wantedValue(v)];
    const next = keysFor(wanted).filter((k) => byKey.has(k) && !isDisabledOption(byKey.get(k)));
    if (next.length || (Array.isArray(v) && !v.length)) changeMany(next, fire);
  };
  // In single mode a list picks its first value.
  const pickOne = (v: unknown, fire: boolean) => {
    const raw = wantedValue(Array.isArray(v) ? v[0] : v);
    const k = raw === undefined || raw === null || typeof raw === 'object' ? null : keyForValue(options, raw, choiceKey);
    if (k !== null && byKey.has(k)) change(k, fire);
  };
  // The native Button group's actions: setSelected picks an option (a value no option has changes nothing).
  ToolJet.useAction({ name: 'setSelected', displayName: 'Set selected', params: [{ handle: 'selected', displayName: 'Value (or a list)' }] }, (v) =>
    multiple ? pickMany(v, false) : pickOne(v, false)
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => (multiple ? changeMany([], false) : change('', false)));
  ToolJet.useAction({ name: 'setValue', displayName: 'Select option (value)', params: [{ handle: 'value', displayName: 'Value (or a list)' }] }, (v) =>
    multiple ? pickMany(v, true) : pickOne(v, true)
  );

  const look = variant === 'outline' || variant === 'default' ? variant : 'segmented';
  const vars = lookVars({
    '--lk-bg': backgroundColor,
    '--lk-fg': textColor,
    '--lk-on-bg': selectedBackgroundColor || selectedColor,
    '--lk-on-fg': selectedTextColor,
    '--ui-radius': borderRadius,
    '--ui-border': borderColor,
  });
  const shown = shownOptions(options, selected, MAX_CHOICES);
  // Options with the same value are one choice drawn twice: their buttons share a value, so they press together.
  const shownKeys = shown.map(keyFor);
  const reactKeys = uniqueKeys(shownKeys);
  const items = shown.map((o, i) => (
    <ToggleGroupPrimitive.Item key={reactKeys[i]} value={shownKeys[i]} disabled={isDisabledOption(o)} className="ui-toggle ui-focus">
      {o.label}
    </ToggleGroupPrimitive.Item>
  ));
  // Arrow keys, Home and End move focus to the next enabled option, read from the group's own root: Radix's roving
  // focus compares document.activeElement, which inside the inline runtime's shadow root stays the host, so focus
  // stayed put or walked to the far end (SP-22). Tab onto the group lands on the pressed option, else the first enabled
  // one.
  const toggles = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button')).filter((el) => !el.disabled);
  const keyboard = {
    onKeyDownCapture: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!disabled) moveRovingFocus(e, toggles(e.currentTarget), { loop: true });
    },
    onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      rovingEntry(toggles(e.currentTarget), (el) => el.getAttribute('data-state') === 'on')?.focus();
    },
  };
  const className = cn(
    look === 'segmented' ? 'uc-segmented' : cn('ui-toggle-group uc-toggles', look === 'outline' && 'ui-toggle-group--outline'),
    look === 'segmented' && fullWidth === true && 'is-full'
  );

  return (
    <div className="ui uc" style={vars}>
      <InlineLoading loading={loading}>
        <div className="uc-toggle-scroll" data-align={fullWidth === true ? undefined : alignment}>
          {multiple ? (
            <ToggleGroupPrimitive.Root
              type="multiple"
              className={className}
              {...keyboard}
              value={keys}
              disabled={disabled}
              onValueChange={(next) => changeMany([...new Set(next)].filter((k) => !isDisabledOption(byKey.get(k))), true)}
            >
              {items}
            </ToggleGroupPrimitive.Root>
          ) : (
            <ToggleGroupPrimitive.Root
              type="single"
              className={className}
              {...keyboard}
              value={key}
              disabled={disabled}
              // Radix deselects on a second click; a segmented control keeps one value.
              onValueChange={(next) => next && !isDisabledOption(byKey.get(next)) && change(next)}
            >
              {items}
            </ToggleGroupPrimitive.Root>
          )}
        </div>
        {options.length > MAX_CHOICES ? (
          <div className="uc-cap-note">{`Showing ${MAX_CHOICES} of ${options.length} options. A Combobox searches them all.`}</div>
        ) : null}
      </InlineLoading>
    </div>
  );
};
