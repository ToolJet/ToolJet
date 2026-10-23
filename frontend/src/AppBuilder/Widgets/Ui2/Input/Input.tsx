import React, { useMemo, useRef, useState } from 'react';
import { useAutoHeight, useLatest, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { X } from 'lucide-react';
import { Input, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextField } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import { withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import { ShadNumberInput } from '@/AppBuilder/Widgets/Ui2/NumberInput/NumberInput';

// The Type list (shadInput.js). A bound type outside it shows a text box: 'file' or 'checkbox' with the text value
// crashed the widget.
const TYPES = ['text', 'email', 'url', 'password', 'search'];

// A valid email address as browsers check type=email (the WHATWG pattern): a local part of letters, digits and
// .!#$%&'*+/=?^_`{|}~-, one @, and a domain of dot-separated labels (letters, digits, inner hyphens, at most 63
// characters). A dot in the domain is not required: user@localhost is valid. An empty box is left to the Mandatory
// check.
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const emailRule = (value: unknown): string =>
  typeof value === 'string' && value.trim() && !EMAIL.test(value.trim()) ? 'Enter a valid email address' : '';

// A valid URL as browsers check type=url: an absolute URL of any scheme (https://example.com, mailto:a@b.com), read
// by the URL parser after trimming, as the browser trims the value. example.com has no scheme and is not one. An empty
// box is left to the Mandatory check.
export const urlRule = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    new URL(value.trim()); // eslint-disable-line no-new
    return '';
  } catch {
    return 'Enter a valid URL';
  }
};

// The format check each text Type adds before the Validation section's rules.
const TYPE_RULES: Record<string, (value: unknown) => string> = { email: emailRule, url: urlRule };

// Type number is the Number input's box (NumberInput.tsx) with the Input's label, help text and placeholder: its value
// is a number (null when empty), with arrows at the right that step it by 1, as a browser's number box has. It kept
// the typed text as a string and had no arrows. Its decimals are as typed, without thousands separators.
const NUMBER_BOX = { stepper: 'stacked', step: 1, decimalPlaces: 10, thousandSeparator: false };

/** The Type, now that it can be bound (a password field's show/hide toggle: {{variables.show ? 'text' : 'password'}}):
 *  read in any case, anything else a text box. Switching between text and password keeps what was typed. */
export const inputType = (value: unknown): string => {
  const type = String(value ?? '')
    .trim()
    .toLowerCase();
  return type === 'number' || TYPES.includes(type) ? type : 'text';
};

// A valid floating-point number, as HTML reads a number box's value: an optional minus, digits with an optional
// fraction (or a bare fraction) and an optional exponent. Anything else empties the box when its type turns number.
const FLOAT = /^-?(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?$/;

/** The value a box keeps when its Type switches between text and number, as a browser's input keeps its value
 *  through a type change: number text becomes the number ("123" is 123), a number its text, anything else empty. */
export const carryValue = (value: unknown, toNumber: boolean): unknown => {
  if (toNumber) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const text = typeof value === 'string' ? value.trim() : '';
    return FLOAT.test(text) ? Number(text) : null;
  }
  return value === null || value === undefined ? '' : String(value);
};

/** Keeps what was typed when a bound Type swaps the text box and the number box, which are different components and
 *  so start again from the Default value. The box's published value is watched; on a swap the new box starts from it,
 *  converted (carryValue), until the authored Default value changes, which starts the box again as before. */
const useTypeSwitchCarry = (props: WidgetProps, isNumber: boolean) => {
  const last = useRef<unknown>(undefined);
  const setters = useLatest({ one: props.setExposedVariable, many: props.setExposedVariables });
  const watched = useMemo(
    () => ({
      setExposedVariable: (key: string, value: unknown) => {
        if (key === 'value') last.current = value;
        return setters.current.one(key, value);
      },
      setExposedVariables: (values: Record<string, unknown>) => {
        if (values && 'value' in values) last.current = values.value;
        return setters.current.many(values);
      },
    }),
    [setters]
  );
  const authored = useStable(props.properties.defaultValue);
  const [carry, setCarry] = useState<{ isNumber: boolean; value?: unknown; over?: unknown }>({ isNumber });
  if (carry.isNumber !== isNumber) {
    const next =
      last.current === undefined
        ? { isNumber }
        : { isNumber, value: carryValue(last.current, isNumber), over: authored };
    setCarry(next);
    return { ...watched, defaultValue: 'over' in next ? next.value : authored };
  }
  const kept = 'over' in carry && Object.is(carry.over, authored);
  return { ...watched, defaultValue: kept ? carry.value : authored };
};

export const ShadInput = (props: WidgetProps) => {
  const type = inputType(props.properties.inputType);
  const { defaultValue, ...setters } = useTypeSwitchCarry(props, type === 'number');
  return type === 'number' ? (
    <ShadNumberInput {...props} {...setters} properties={{ ...props.properties, defaultValue, ...NUMBER_BOX }} />
  ) : (
    <TextInput {...props} {...setters} properties={{ ...props.properties, defaultValue, inputType: type }} />
  );
};

const TextInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, fireEvent } = props;
  const type = TYPES.includes(properties.inputType) ? properties.inputType : 'text';
  // Type email and url check the text's form first, then the Validation section's rules; isValid and the message
  // follow.
  const rule = TYPE_RULES[type];
  const { check, fieldProps, change } = useTextField<HTMLInputElement>(rule ? withRule(props, rule) : props);
  // Type search clears as a browser's search box does: an x in the box and Escape empty it, firing onChange. The
  // browser's own x is hidden (it drew in some browsers only, and did not fire onChange).
  const search = type === 'search';
  const clearable = search && !!fieldProps.value && !fieldProps.disabled;
  const input = (
    <Input
      {...fieldProps}
      type={type}
      // A phone shows its URL keyboard (/, .com) for a url box.
      inputMode={type === 'url' ? 'url' : undefined}
      className={cn(
        fieldProps.className,
        search && '[&::-webkit-search-cancel-button]:tw-appearance-none',
        clearable && 'tw-pr-8'
      )}
      onKeyDown={(e) => {
        if (isEnter(e)) fireEvent('onEnterPressed');
        else if (search && e.key === 'Escape' && fieldProps.value) {
          e.preventDefault();
          change('');
        }
      }}
    />
  );
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      {search ? (
        <div className="tw-relative tw-w-full">
          {input}
          {clearable ? (
            <button
              type="button"
              aria-label="Clear"
              className="tw-absolute tw-right-2 tw-top-1/2 tw-flex tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))] hover:tw-text-[color:var(--lk-fg,var(--sc-foreground))]"
              onClick={() => {
                change('');
                fieldProps.ref.current?.focus();
              }}
            >
              <X className="tw-h-4 tw-w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        input
      )}
    </FormField>
  );
};

export default withControlState(ShadInput);
