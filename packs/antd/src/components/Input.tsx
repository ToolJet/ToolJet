import React, { useRef } from 'react';
import { Input as AntInput } from 'antd';
import type { InputRef } from 'antd';
import { iconOr } from '../lib/icons';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str } from '../lib/data';
import { ControlSkeleton } from '../lib/Loading';
import { typeRule } from '../lib/typeRule';
import { useValueSetter } from '../lib/sameValue';

// Ant's Input: value, placeholder, allowClear, maxLength/showCount, prefix/suffix, addonBefore/addonAfter, variant,
// size; events onChange, onPressEnter, onFocus, onBlur, onClear; Form-style actions setFieldValue and resetFields.
// Type email or url also checks the format, as UI 2.0's Input does: a bad address is reported once the field is left.
export const Input = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Label' });
  const [value, setValue] = ToolJet.useStateString({
    name: 'value',
    label: 'Value',
    description: 'The text; also the value resetFields returns to.',
    initialValue: '',
  });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder',
    initialValue: 'Enter your input',
  });
  const [type] = ToolJet.useStateEnumeration({
    name: 'type',
    label: 'Type',
    enumDefinition: ['text', 'email', 'password', 'url', 'tel', 'search'],
    initialValue: 'text',
  });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: false });
  const [maxLength] = ToolJet.useStateNumber({
    name: 'maxLength',
    label: 'Max length',
    description: '0 for no limit.',
    initialValue: 0,
    min: 0,
  });
  const [showCount] = ToolJet.useStateBoolean({ name: 'showCount', label: 'Show count', initialValue: false });
  const [prefix] = ToolJet.useStateString({
    name: 'prefix',
    label: 'Prefix',
    description: 'Text, or an icon name such as SearchOutlined.',
    initialValue: '',
  });
  const [suffix] = ToolJet.useStateString({
    name: 'suffix',
    label: 'Suffix',
    description: 'Text, or an icon name such as MailOutlined.',
    initialValue: '',
  });
  const [addonBefore] = ToolJet.useStateString({ name: 'addonBefore', label: 'Addon before', initialValue: '' });
  const [addonAfter] = ToolJet.useStateString({ name: 'addonAfter', label: 'Addon after', initialValue: '' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onPressEnter = ToolJet.useEventCallback({ name: 'onPressEnter' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const onClear = ToolJet.useEventCallback({ name: 'onClear' });
  const ref = useRef<InputRef>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ kind: 'text', value, rule: typeRule(type, value) });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'input',
    fit: true,
    loading: 'own',
    usage:
      "Ant's Input in a Form.Item: label, value, placeholder, extra (help text), allowClear, prefix/suffix, addonBefore/addonAfter; onChange, onPressEnter; setFieldValue, resetFields (back to the value property). The Validation section sets isValid.",
    roleProps: { description: 'extra' },
    roleEvents: { onEnterPressed: 'onPressEnter' },
    roleActions: { setValue: 'setFieldValue', clear: 'resetFields' },
    defaultWidth: 10,
    defaultHeight: 6,
  });

  // A value it already has changes nothing and fires nothing (lib/sameValue).
  const valueSetter = useValueSetter<unknown>(value, (v) => setValue(v as never));
  const change = (next: string) => {
    if (!valueSetter.set(next)) return;
    onChange();
  };
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Value' }] },
    (next) => change(str(next))
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(str(props.value)));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());
  ToolJet.useAction({ name: 'blur', displayName: 'Blur' }, () => ref.current?.blur());

  const Control = type === 'password' ? AntInput.Password : AntInput;
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <Control
            ref={ref}
            id={fieldId}
            type={type === 'password' ? undefined : type}
            value={value}
            placeholder={placeholder || undefined}
            disabled={disabled}
            allowClear={allowClear}
            maxLength={Number(maxLength) > 0 ? Number(maxLength) : undefined}
            showCount={showCount}
            prefix={iconOr(prefix)}
            suffix={iconOr(suffix)}
            addonBefore={addonBefore || undefined}
            addonAfter={addonAfter || undefined}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            onChange={(e) => {
              change(e.target.value);
              if (e.type === 'click' && e.target.value === '') onClear();
            }}
            onPressEnter={(e) => {
              if (!e.nativeEvent.isComposing) onPressEnter();
            }}
            onFocus={onFocus}
            onBlur={() => {
              check.touch();
              onBlur();
            }}
          />
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};
