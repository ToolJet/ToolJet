import React from 'react';
import { Checkbox as AntCheckbox, Form } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { SpinOver } from '../lib/Loading';
import { useFormValue } from '../lib/formValue';

// Ant's Checkbox: its label is its children; checked, indeterminate; event onChange.
export const Checkbox = (props: Record<string, unknown>) => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Label', initialValue: 'Checkbox' });
  const [checked, setChecked] = ToolJet.useStateBoolean({ name: 'checked', label: 'Checked', initialValue: false });
  useFormValue(checked, 'boolean');
  const [indeterminate] = ToolJet.useStateBoolean({ name: 'indeterminate', label: 'Indeterminate', initialValue: false });
  const [extra] = ToolJet.useStateString({ name: 'extra', label: 'Extra', description: 'Help text under the checkbox.', initialValue: '' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value: checked, present: checked === true });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 3 });

  const change = (next: boolean) => {
    setChecked(next);
    check.touch();
    onChange();
  };
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set checked', params: [{ handle: 'checked', displayName: 'Checked', type: 'toggle' }] },
    (next) => change(String(next) === 'true')
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(props.checked === true));
  ToolJet.useAction({ name: 'toggle', displayName: 'Toggle' }, () => {
    // From the latest value, not this render's: two toggles in one batch cancel out.
    setChecked((c: boolean) => !c);
    check.touch();
    onChange();
  });
  // A Form's clearForm unchecks it (the host clears only `value`).
  (ToolJet as { useFormClear?: (f: () => void) => void }).useFormClear?.(() => setChecked(false));

  return (
    <AntProvider tokens={tokens} className="tj-ant-compact">
      <Form component={false}>
        <Form.Item
          validateStatus={check.error ? 'error' : undefined}
          help={check.error || undefined}
          extra={extra || undefined}
          style={{ marginBottom: 0 }}
        >
          <SpinOver loading={loading}>
            <AntCheckbox id={fieldId} checked={checked} indeterminate={indeterminate} disabled={disabled} onChange={(e) => change(e.target.checked)}>
              {children}
              {check.required ? <span className="tj-ant-required"> *</span> : null}
            </AntCheckbox>
          </SpinOver>
        </Form.Item>
      </Form>
    </AntProvider>
  );
};
