import React, { useRef } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Input } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextField } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import { withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';

// The Type list (shadInput.js). A bound type outside it shows a text box: 'file' or 'checkbox' with the text value
// crashed the widget.
const TYPES = ['text', 'email', 'number', 'password', 'search'];

// An address of the form name@domain.tld, as browsers check type=email (no spaces, one @, a dot in the domain). An
// empty box is left to the Mandatory check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emailRule = (value: unknown): string =>
  typeof value === 'string' && value.trim() && !EMAIL.test(value.trim()) ? 'Enter a valid email address' : '';

export const ShadInput = (props: WidgetProps) => {
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
