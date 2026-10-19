import React, { useRef } from 'react';
import { toOptions, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Label, RadioGroup, RadioGroupItem } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Field, controlAria, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  MAX_CHOICES,
  choiceKey,
  defaultKey,
  optionsByKey,
  shownOptions,
} from '@/AppBuilder/Widgets/Ui2/_shared/choices';
import { isDisabledOption } from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { useDropRemovedChoices } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const ShadRadioGroup = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties } = props;
  const options = toOptions(properties.options);
  const byKey = optionsByKey(options);
  const initial = defaultKey(properties.defaultValue);
  const [key, change, setKey] = useValue(
    props,
    initial,
    () => ({
      // As the native Radio button's: both fire onSelectionChange; deselectOption() clears the choice.
      selectOption: async (v: unknown) =>
        change(v === undefined || v === null || typeof v === 'object' ? '' : choiceKey(v), 'onSelectionChange'),
      deselectOption: async () => change('', 'onSelectionChange'),
    }),
    (k) => byKey.get(k)?.value ?? ''
  );
  // An option that is removed takes its choice with it, so it does not come back selected when it reappears (as
  // Select). An empty list is not a removal (missingIsGone).
  useDropRemovedChoices(
    options.map((o) => choiceKey(o.value)),
    key ? [key] : [],
    () => setKey(''),
    false
  );
  useExposed(props.setExposedVariables, properties, {
    label: String(properties.label ?? ''),
    selectedOption: byKey.get(key) || {},
    options,
  });
  const check = useValidation(props, byKey.get(key)?.value ?? '', () => change(''), byKey.has(key));
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={fieldIdOf(props)}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <RadioGroup
          id={fieldIdOf(props)}
          aria-label={toText(properties.label) || undefined}
          {...controlAria(props, check.error)}
          value={key}
          disabled={busy(properties)}
          // Each label is a 24px touch target (WCAG 2.5.8), as tall as a 16px row and the list's old 8px gap.
          className={properties.horizontal === true ? 'tw-flex tw-flex-wrap tw-gap-x-4' : 'tw-gap-0'}
          onValueChange={(next) => {
            // A disabled option (`disabled`, or the native Radio button's `disable`) takes no click (the item is
            // disabled too).
            if (isDisabledOption(byKey.get(next))) return;
            change(next, 'onSelectionChange');
            check.touch();
          }}
        >
          {shownOptions(options, byKey.get(key), MAX_CHOICES).map((o) => {
            const itemId = `${fieldIdOf(props)}-${String(o.value)}`;
            return (
              <div key={String(o.value)} className="tw-flex tw-items-center tw-gap-2">
                <RadioGroupItem
                  value={choiceKey(o.value)}
                  id={itemId}
                  disabled={isDisabledOption(o)}
                  className="tw-border-[color:var(--lk-invalid,var(--sc-primary))]"
                />
                <Label
                  htmlFor={itemId}
                  className="tw-flex tw-min-h-6 tw-items-center tw-font-normal tw-text-[color:var(--lk-fg,var(--sc-foreground))]"
                >
                  {o.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadRadioGroup);
