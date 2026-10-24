import React from 'react';
import { Switch as AntSwitch } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { FormField, useFieldProps } from '../lib/FormField';
import { useFormValue } from '../lib/formValue';

// Ant's Switch: checked, checkedChildren / unCheckedChildren (text inside the track), size (default, small); its label
// is Form.Item's, beside it (layout horizontal); events onChange, onClick.
export const Switch = (props: Record<string, unknown>) => {
  const field = useFieldProps({ layout: 'horizontal', label: 'Enabled' });
  const [checked, setChecked] = ToolJet.useStateBoolean({ name: 'checked', label: 'Checked', initialValue: false });
  useFormValue(checked, 'boolean');
  const [checkedChildren] = ToolJet.useStateString({ name: 'checkedChildren', label: 'Checked text', initialValue: '' });
  const [unCheckedChildren] = ToolJet.useStateString({ name: 'unCheckedChildren', label: 'Unchecked text', initialValue: '' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'small'], initialValue: 'default' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
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
    <AntProvider tokens={tokens} className="tj-ant-switch tj-ant-compact">
      <FormField {...field} check={check} htmlFor={fieldId}>
        <AntSwitch
          id={fieldId}
          checked={checked}
          checkedChildren={checkedChildren || undefined}
          unCheckedChildren={unCheckedChildren || undefined}
          size={size as 'default'}
          disabled={disabled}
          loading={loading}
          onChange={(next) => change(next)}
          onClick={() => onClick()}
        />
      </FormField>
    </AntProvider>
  );
};
