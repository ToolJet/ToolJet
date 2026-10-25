import React, { useEffect, useRef, useState } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Field } from '../lib/Field';
import { cn } from '../lib/cn';
import { MAX_CHOICES, choiceKey, defaultKey, isDisabledOption, isScalar, shownOptions, toChoiceOptions, type ChoiceOption } from '../lib/ui2/choice/options';
import { choiceValidationValue } from '../lib/ui2/choice/validationValue';
import { moveRovingFocus, rovingEntry } from '../lib/activeElement';
import { lookVars, useDropRemovedChoices, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { TOKEN } from '../lib/styleDefaults';
import { InlineLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Radio group (Ui2/RadioGroup/RadioGroup.tsx) on the pack's CSS: options stacked or side by side, Allow
// deselect, and the mandatory check of the host's Validation section.
export const RadioGroup = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: 'Plain values or [{ label, value, disabled? }].',
    initialValue: ['Standard', 'Premium', 'Charter'],
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: 'Standard' });
  const [allowDeselect] = ToolJet.useStateBoolean({ name: 'allowDeselect', label: 'Allow deselect', initialValue: false });
  const [horizontal] = ToolJet.useStateBoolean({ name: 'horizontal', label: 'Side by side', initialValue: false });
  // Exposed values, and the pack's earlier names (value was its default, orientation its layout).
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setSelectedOption] = ToolJet.useStateObject({ name: 'selectedOption', initialValue: {}, inspector: 'hidden' });
  const [orientation] = ToolJet.useStateEnumeration({
    name: 'orientation',
    label: 'Layout',
    enumDefinition: ['vertical', 'horizontal'],
    enumLabels: { vertical: 'Vertical', horizontal: 'Horizontal' },
    initialValue: 'vertical',
    inspector: 'hidden',
  });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  // One event per change, UI 2.0's name: the pack's earlier onChange fired alongside it.
  const onSelectionChange = ToolJet.useEventCallback({ name: 'onSelectionChange' });
  const accentColor = useColorStyle('accentColor', 'Selected color', TOKEN.brand);
  const labelColor = useColorStyle('labelColor', 'Label color', TOKEN.text);
  const helpTextColor = useColorStyle('helpTextColor', 'Help text color', TOKEN.mutedText);
  const optionTextColor = useColorStyle('optionTextColor', 'Option text color', TOKEN.text);
  const errorColor = useColorStyle('errorColor', 'Error color', TOKEN.error);
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Option text color (earlier name)', inspector: 'hidden', initialValue: '' });
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 11 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const options = toChoiceOptions(rawOptions);
  const byKey = new Map(options.map((o) => [choiceKey(o.value), o] as [string, ChoiceOption]));
  // An app saved before defaultValue existed starts on its `value` when the new default names no option.
  const [key, setKey] = useState(() => {
    const k = isScalar(defaultValue) ? defaultKey(defaultValue) : '';
    return byKey.has(k) || !isScalar(legacyValue) || legacyValue === '' ? k : defaultKey(legacyValue);
  });
  useResetOn(defaultValue, () => setKey(defaultKey(defaultValue)));
  // A Form's clearForm empties what the field shows as well as what it exposes (the SDK clears only `value`).
  ToolJet.useFormClear(() => setKey(''));
  useDropRemovedChoices(options.map((o) => choiceKey(o.value)), key ? [key] : [], () => setKey(''), false);
  const selected = byKey.get(key);
  useEffect(() => {
    setValue((selected?.value ?? '') as string);
    setSelectedOption(selected ?? {});
  }, [key, JSON.stringify(selected)]); // eslint-disable-line react-hooks/exhaustive-deps
  const check = ToolJet.useValidation({ section: 'choice', value: choiceValidationValue(selected), present: !!selected });

  // The key as last chosen, ahead of the next render: an arrow key selects the radio it moves to, and Radix may click
  // that same radio as it takes focus (its arrow-key flag), which must not count as a second change.
  const keyRef = useRef(key);
  keyRef.current = key;
  // As the native Radio button's: both fire onSelectionChange.
  // An action that leaves the same option chosen (or none, as none was) fires nothing.
  const change = (next: string, fromAction = false) => {
    const before = byKey.get(keyRef.current);
    keyRef.current = next;
    setKey(next);
    const option = byKey.get(next);
    setValue((option?.value ?? '') as string);
    setSelectedOption(option ?? {});
    if (fromAction && before === option) return;
    onSelectionChange();
  };
  ToolJet.useAction({ name: 'selectOption', displayName: 'Select option', params: [{ handle: 'value', displayName: 'Value' }] }, (v) =>
    change(v === undefined || v === null || typeof v === 'object' ? '' : choiceKey(v), true)
  );
  ToolJet.useAction({ name: 'deselectOption', displayName: 'Deselect option' }, () => change('', true));

  // Allow deselect (off by default, and never while mandatory): a click on the chosen option clears the choice.
  const deselectable = allowDeselect === true && !check.required && !disabled;
  const sideBySide = horizontal === true || orientation === 'horizontal';
  const vars = lookVars({
    '--ui-primary': accentColor,
    '--lk-label': labelColor,
    '--lk-help': helpTextColor,
    '--lk-fg': optionTextColor || textColor,
    '--ui-destructive': errorColor,
  });
  const itemId = (o: ChoiceOption) => `${fieldId ?? 'radio'}-${choiceKey(o.value)}`;
  // A user's pick: the radio's own click, or an arrow key moving to it. A pick of the chosen radio changes nothing.
  const pickKey = (next: string) => {
    if (next === keyRef.current || isDisabledOption(byKey.get(next))) return;
    change(next);
    check.touch();
  };
  // Arrow keys, Home and End move to the next enabled radio and select it, read from the group's own root: Radix's
  // roving focus compares document.activeElement, which inside the inline runtime's shadow root stays the host, so it
  // walked on past the next radio (SP-22). The move is consumed here, before the item's Radix handler sees it.
  const radios = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLElement>('[role="radio"]')).filter((el) => !(el as HTMLButtonElement).disabled);
  const onKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const moved = moveRovingFocus(e, radios(e.currentTarget), { orientation: sideBySide ? 'horizontal' : 'vertical', loop: true });
    const next = moved?.getAttribute('data-choice-key');
    if (next) pickKey(next);
  };
  // Tab onto the group lands on its checked radio (else its first enabled one), as Radix means to; its own walk ends on
  // the last radio in a shadow root. Focus on a radio itself is Radix's.
  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    rovingEntry(radios(e.currentTarget), (el) => el.getAttribute('aria-checked') === 'true')?.focus();
  };

  return (
    <div className="ui uc" style={vars}>
      <InlineLoading loading={loading} look="inline-top">
        <Field label={label} description={description} htmlFor={fieldId} error={check.error} required={check.required}>
          <RadioGroupPrimitive.Root
            id={fieldId}
            className={cn('uc-radios', sideBySide && 'is-horizontal')}
            value={key}
            orientation={sideBySide ? 'horizontal' : 'vertical'}
            disabled={disabled}
            aria-label={label || undefined}
            aria-invalid={check.error ? true : undefined}
            aria-describedby={fieldId && (check.error || description) ? `${fieldId}-note` : undefined}
            onValueChange={pickKey}
            onKeyDownCapture={onKeyDownCapture}
            onFocus={onFocus}
          >
            {shownOptions(options, selected, MAX_CHOICES).map((o) => (
              <div className="ui-radio-item" key={choiceKey(o.value)}>
                <RadioGroupPrimitive.Item
                  className="ui-radio ui-focus"
                  value={choiceKey(o.value)}
                  data-choice-key={choiceKey(o.value)}
                  id={itemId(o)}
                  disabled={isDisabledOption(o)}
                  onClick={
                    deselectable && choiceKey(o.value) === key
                      ? (e) => {
                          e.preventDefault();
                          change('');
                          check.touch();
                        }
                      : undefined
                  }
                >
                  <RadioGroupPrimitive.Indicator className="ui-radio-dot" />
                </RadioGroupPrimitive.Item>
                <label htmlFor={itemId(o)}>{o.label}</label>
              </div>
            ))}
          </RadioGroupPrimitive.Root>
          {options.length > MAX_CHOICES ? (
            <div className="uc-cap-note">{`Showing ${MAX_CHOICES} of ${options.length} options. A Combobox searches them all.`}</div>
          ) : null}
        </Field>
      </InlineLoading>
    </div>
  );
};
