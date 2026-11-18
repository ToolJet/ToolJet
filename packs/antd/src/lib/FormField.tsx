import React, { useLayoutEffect, useRef } from 'react';
import { Form } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';

type Check = { error: string; required: boolean };

// The field's validation message. While it shows, the field's own inputs (in the control area, not a popup's) are
// aria-invalid="true", as a ToolJet Text Input's is: Ant sets it only on a Form.Item bound to a Form's field (name),
// so a screen reader was not told the field is invalid (QA PF-063). Marked again after every render, as Ant may draw
// new inputs (the OTP's boxes); unmarked when the message goes.
const InvalidMessage = ({ message }: { message: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const item = ref.current?.closest('.ant-form-item');
    const inputs = item
      ? [...item.querySelectorAll('.ant-form-item-control-input input:not([type="hidden"]), .ant-form-item-control-input textarea')]
      : [];
    inputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
    return () => inputs.forEach((input) => input.removeAttribute('aria-invalid'));
  });
  return <span ref={ref}>{message}</span>;
};

// Ant's own field layout, Form.Item, for every form control: label (with the required mark), the control, `extra`
// help text, and the host's validation message as `help` with validateStatus. No Form state: the control is
// controlled by the component (ToolJet state), the Form only provides the layout context.
export const FormField = ({
  label,
  extra,
  tooltip,
  layout = 'vertical',
  check,
  htmlFor,
  children,
}: {
  label?: string;
  extra?: string;
  tooltip?: string;
  layout?: 'vertical' | 'horizontal';
  check: Check;
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <Form component={false} layout={layout} colon={false}>
    <Form.Item
      label={label || undefined}
      tooltip={tooltip || undefined}
      htmlFor={htmlFor}
      required={check.required}
      validateStatus={check.error ? 'error' : undefined}
      help={check.error ? <InvalidMessage message={check.error} /> : undefined}
      extra={extra || undefined}
      style={{ marginBottom: 0 }}
    >
      {children}
    </Form.Item>
  </Form>
);

/** The props every Ant form control shares: Form.Item's label, extra, tooltip and layout. */
export const useFieldProps = (defaults: { label?: string; layout?: 'vertical' | 'horizontal' } = {}) => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: defaults.label ?? '' });
  const [extra] = ToolJet.useStateString({
    name: 'extra',
    label: 'Extra',
    description: 'Help text under the field (Form.Item extra). A validation message replaces it.',
    initialValue: '',
  });
  const [tooltip] = ToolJet.useStateString({ name: 'tooltip', label: 'Tooltip', description: 'An info icon after the label.', initialValue: '' });
  const [layout] = ToolJet.useStateEnumeration({
    name: 'layout',
    label: 'Layout',
    enumDefinition: ['vertical', 'horizontal'],
    initialValue: defaults.layout ?? 'vertical',
  });
  return { label, extra, tooltip, layout: layout as 'vertical' | 'horizontal' };
};

/** variant and size, the two appearance props of Ant's data-entry controls. */
export const useControlLook = () => {
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['outlined', 'filled', 'borderless', 'underlined'],
    initialValue: 'outlined',
  });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  return {
    variant: variant as 'outlined' | 'filled' | 'borderless' | 'underlined',
    size: size as 'small' | 'middle' | 'large',
  };
};
