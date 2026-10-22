import React, { useRef } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Input } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
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

export const ShadInput = (props: WidgetProps) =>
  props.properties.inputType === 'number' ? (
    <ShadNumberInput {...props} properties={{ ...props.properties, ...NUMBER_BOX }} />
  ) : (
    <TextInput {...props} />
  );

const TextInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, fireEvent } = props;
  const type = TYPES.includes(properties.inputType) ? properties.inputType : 'text';
  // Type email checks the address's form first, then the Validation section's rules; isValid and the message follow.
  const { check, fieldProps } = useTextField<HTMLInputElement>(type === 'email' ? withRule(props, emailRule) : props);
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Input {...fieldProps} type={type} onKeyDown={(e) => isEnter(e) && fireEvent('onEnterPressed')} />
    </FormField>
  );
};

export default withControlState(ShadInput);
