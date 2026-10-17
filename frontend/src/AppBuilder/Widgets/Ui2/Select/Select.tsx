import React, { useEffect, useRef, useState } from 'react';
import { toOptions, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { useFocusEvents } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CONTROL, FormField, HELP, controlAria, fieldName } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { defaultKey, optionsByKey, shownOptions } from '@/AppBuilder/Widgets/Ui2/_shared/choices';
import type { Option } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const EMPTY_OPTION_KEY = '\u0000empty';

export const MAX_SELECT_OPTIONS = 500;

export const ShadSelect = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  // Radix Select keys its items by string; keep the original values for the exposed value. It refuses an item keyed
  // by the empty string (that means "nothing selected"), so an option valued '' (an "All" choice) gets its own key.
  const options = toOptions(properties.options);
  const optionKey = (v: unknown) => (String(v) === '' ? EMPTY_OPTION_KEY : String(v));
  const byKey = optionsByKey(options, optionKey);
  const initial = defaultKey(properties.defaultValue);
  const [key, setKey] = useState(initial);
  useEffect(() => setKey(initial), [initial]);
  const selectedOption: Partial<Option> = byKey.get(key) || {};
  // Radix mounts every item even while closed, so a 10k-option binding froze the page: the list shows the first
  // MAX_SELECT_OPTIONS (and the selected one, wherever it is); actions still reach every option.
  const shown = shownOptions(options, byKey.get(key), MAX_SELECT_OPTIONS);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focus = useFocusEvents(fireEvent);
  useExposed(setExposedVariables, properties, {
    value: selectedOption.value ?? '',
    selectedOption,
    options,
    label: String(properties.label ?? ''),
    selectOption: async (v: unknown) =>
      setKey(v === undefined || v === null || typeof v === 'object' ? '' : optionKey(v)),
    clear: async () => setKey(''),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  const check = useValidation(props, selectedOption.value ?? '', () => {
    setKey('');
    setExposedVariable('value', '');
    setExposedVariable('selectedOption', {});
  });
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Select
        value={key}
        disabled={busy(properties)}
        onOpenChange={(open) => {
          focus.opened(open);
          if (!open) check.touch();
        }}
        onValueChange={(next) => {
          setKey(next);
          setExposedVariable('value', byKey.get(next)?.value ?? '');
          setExposedVariable('selectedOption', byKey.get(next) || {});
          fireEvent('onSelect');
        }}
      >
        <SelectTrigger
          ref={triggerRef}
          id={`shad-${id}`}
          // role="combobox" takes no name from its content: without a label, the placeholder names it.
          aria-label={fieldName(props, 'Select')}
          {...controlAria(props, check.error)}
          {...focus.handlers}
          className={cn(CONTROL, 'data-[placeholder]:tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]')}
        >
          <SelectValue placeholder={String(properties.placeholder ?? '')} />
        </SelectTrigger>
        {/* The list opens in the pack's portal root, outside the widget: it takes the widget's style variables itself. */}
        <SelectContent style={lookVars(props.componentType, props.styles)}>
          {shown.map((o) => (
            <SelectItem key={optionKey(o.value)} value={optionKey(o.value)}>
              {o.label}
            </SelectItem>
          ))}
          {options.length > shown.length ? (
            <div className={cn('tw-px-2 tw-py-1.5 tw-text-xs', HELP)}>
              {`Showing ${MAX_SELECT_OPTIONS} of ${options.length} options. A Combobox searches them all.`}
            </div>
          ) : null}
        </SelectContent>
      </Select>
    </FormField>
  );
};

export default withControlState(ShadSelect);
