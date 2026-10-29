import React, { useRef } from 'react';
import { Input } from 'antd';
import type { InputRef } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str } from '../lib/data';
import { ControlSkeleton } from '../lib/Loading';
import { useValueSetter } from '../lib/sameValue';

// Ant's Input.TextArea: value, placeholder, autoSize (minRows/maxRows), maxLength/showCount, allowClear.
export const TextArea = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Description' });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder',
    initialValue: 'Enter a description',
  });
  const [minRows] = ToolJet.useStateNumber({
    name: 'minRows',
    label: 'Min rows',
    description: 'autoSize.minRows',
    initialValue: 3,
    min: 1,
    max: 40,
  });
  const [maxRows] = ToolJet.useStateNumber({
    name: 'maxRows',
    label: 'Max rows',
    description: 'autoSize.maxRows; 0 grows without limit.',
    initialValue: 8,
    min: 0,
    max: 80,
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
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onPressEnter = ToolJet.useEventCallback({ name: 'onPressEnter' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const ref = useRef<InputRef>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ kind: 'text', value });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'textarea',
    fit: true,
    loading: 'own',
    usage:
      "Ant's Input.TextArea: label, value, placeholder, extra, minRows/maxRows (autoSize), showCount with maxLength.",
    roleProps: { description: 'extra', rows: 'minRows' },
    roleEvents: { onEnterPressed: 'onPressEnter' },
    roleActions: { setValue: 'setFieldValue', clear: 'resetFields' },
    defaultWidth: 14,
    defaultHeight: 11,
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

  const min = Math.max(1, Number(minRows) || 3);
  const max = Number(maxRows) > 0 ? Math.max(min, Number(maxRows)) : undefined;
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size} rows={min}>
          <Input.TextArea
            ref={ref as never}
            id={fieldId}
            value={value}
            placeholder={placeholder || undefined}
            disabled={disabled}
            autoSize={{ minRows: min, maxRows: max }}
            allowClear={allowClear}
            maxLength={Number(maxLength) > 0 ? Number(maxLength) : undefined}
            showCount={showCount}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            onChange={(e) => change(e.target.value)}
            onPressEnter={(e) => {
              if (!e.nativeEvent.isComposing && !e.shiftKey) onPressEnter();
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
