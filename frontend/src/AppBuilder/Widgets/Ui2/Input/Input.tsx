import React, { useRef } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
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
const TYPES = ['text', 'email', 'password', 'search'];

// An address of the form name@domain.tld, as browsers check type=email (no spaces, one @, a dot in the domain). An
// empty box is left to the Mandatory check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emailRule = (value: unknown): string =>
  typeof value === 'string' && value.trim() && !EMAIL.test(value.trim()) ? 'Enter a valid email address' : '';

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

export const ShadInput = (props: WidgetProps) => {
  const type = inputType(props.properties.inputType);
  return type === 'number' ? (
    <ShadNumberInput {...props} properties={{ ...props.properties, ...NUMBER_BOX }} />
  ) : (
    <TextInput {...props} properties={{ ...props.properties, inputType: type }} />
  );
};

const TextInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, fireEvent } = props;
  const type = TYPES.includes(properties.inputType) ? properties.inputType : 'text';
  // Type email checks the address's form first, then the Validation section's rules; isValid and the message follow.
  const { check, fieldProps, change } = useTextField<HTMLInputElement>(
    type === 'email' ? withRule(props, emailRule) : props
  );
  // Type search clears as a browser's search box does: an x in the box and Escape empty it, firing onChange. The
  // browser's own x is hidden (it drew in some browsers only, and did not fire onChange).
  const search = type === 'search';
  const clearable = search && !!fieldProps.value && !fieldProps.disabled;
  const input = (
    <Input
      {...fieldProps}
      type={type}
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
