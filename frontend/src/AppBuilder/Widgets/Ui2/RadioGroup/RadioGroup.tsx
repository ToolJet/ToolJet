import React, { useRef } from 'react';
import { toOptions, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Label, RadioGroup, RadioGroupItem } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { MAX_CHOICES, defaultKey, optionsByKey, shownOptions } from '@/AppBuilder/Widgets/Ui2/_shared/choices';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const ShadRadioGroup = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, id } = props;
  const options = toOptions(properties.options);
  const byKey = optionsByKey(options);
  const initial = defaultKey(properties.defaultValue);
  const [key, change] = useValue(
    props,
    initial,
    () => ({
      // As the native Radio button's: both fire onSelectionChange; deselectOption() clears the choice.
      selectOption: async (v: unknown) =>
        change(v === undefined || v === null || typeof v === 'object' ? '' : String(v), 'onSelectionChange'),
      deselectOption: async () => change('', 'onSelectionChange'),
    }),
    (k) => byKey.get(k)?.value ?? ''
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
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <RadioGroup
          value={key}
          disabled={busy(properties)}
          className={properties.horizontal === true ? 'tw-flex tw-flex-wrap tw-gap-4' : undefined}
          onValueChange={(next) => {
            change(next, 'onSelectionChange');
            check.touch();
          }}
        >
          {shownOptions(options, byKey.get(key), MAX_CHOICES).map((o) => {
            const itemId = `shad-${id}-${String(o.value)}`;
            return (
              <div key={String(o.value)} className="tw-flex tw-items-center tw-gap-2">
                <RadioGroupItem
                  value={String(o.value)}
                  id={itemId}
                  className="tw-border-[color:var(--lk-invalid,var(--sc-primary))]"
                />
                <Label htmlFor={itemId} className="tw-font-normal tw-text-[color:var(--lk-fg,var(--sc-foreground))]">
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
