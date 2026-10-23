import React, { useEffect, useState } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Field } from '../lib/Field';
import { cn } from '../lib/cn';
import { MAX_CHOICES, choiceKey, defaultKey, isDisabledOption, isScalar, shownOptions, toChoiceOptions, type ChoiceOption } from '../lib/ui2/choice/options';
import { lookVars, useDropRemovedChoices, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
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
  const onSelectionChange = ToolJet.useEventCallback({ name: 'onSelectionChange' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const accentColor = useColorStyle('accentColor', 'Selected color');
  const labelColor = useColorStyle('labelColor', 'Label color');
  const helpTextColor = useColorStyle('helpTextColor', 'Help text color');
  const optionTextColor = useColorStyle('optionTextColor', 'Option text color');
  const errorColor = useColorStyle('errorColor', 'Error color');
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
  useDropRemovedChoices(options.map((o) => choiceKey(o.value)), key ? [key] : [], () => setKey(''), false);
  const selected = byKey.get(key);
  useEffect(() => {
    setValue((selected?.value ?? '') as string);
    setSelectedOption(selected ?? {});
  }, [key, JSON.stringify(selected)]); // eslint-disable-line react-hooks/exhaustive-deps
  const check = ToolJet.useValidation({ section: 'choice', value: selected?.value ?? '', present: !!selected });

  // As the native Radio button's: both fire onSelectionChange.
  const change = (next: string) => {
    setKey(next);
    const option = byKey.get(next);
    setValue((option?.value ?? '') as string);
    setSelectedOption(option ?? {});
    onSelectionChange();
    onChange();
  };
  ToolJet.useAction({ name: 'selectOption', displayName: 'Select option', params: [{ handle: 'value', displayName: 'Value' }] }, (v) =>
    change(v === undefined || v === null || typeof v === 'object' ? '' : choiceKey(v))
  );
  ToolJet.useAction({ name: 'deselectOption', displayName: 'Deselect option' }, () => change(''));
  ToolJet.useAction({ name: 'setValue', displayName: 'Select option (value)', params: [{ handle: 'value', displayName: 'Value' }] }, (v) =>
    change(v === undefined || v === null || typeof v === 'object' ? '' : choiceKey(v))
  );

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
            onValueChange={(next) => {
              if (isDisabledOption(byKey.get(next))) return;
              change(next);
              check.touch();
            }}
          >
            {shownOptions(options, selected, MAX_CHOICES).map((o) => (
              <div className="ui-radio-item" key={choiceKey(o.value)}>
                <RadioGroupPrimitive.Item
                  className="ui-radio ui-focus"
                  value={choiceKey(o.value)}
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
