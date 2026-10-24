import React, { useRef } from 'react';
import { InputNumber as AntInputNumber } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { toNumber } from '../lib/format';
import { ControlSkeleton } from '../lib/Loading';

// Ant's InputNumber: value, min, max, step, precision, prefix, addonBefore/addonAfter, controls, keyboard; events
// onChange, onStep, onPressEnter, onFocus, onBlur. An empty field is null, as in Ant.
export const InputNumber = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Quantity' });
  const [rawValue, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', description: 'Empty for no number.', initialValue: undefined as unknown as number });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '0' });
  const [min] = ToolJet.useStateNumber({ name: 'min', label: 'Min', initialValue: undefined as unknown as number });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', initialValue: undefined as unknown as number });
  const [step] = ToolJet.useStateNumber({ name: 'step', label: 'Step', initialValue: 1 });
  const [precision] = ToolJet.useStateNumber({ name: 'precision', label: 'Precision', description: 'Decimal places; empty to keep what is typed.', initialValue: undefined as unknown as number, min: 0, max: 10 });
  const [prefix] = ToolJet.useStateString({ name: 'prefix', label: 'Prefix', initialValue: '' });
  const [addonBefore] = ToolJet.useStateString({ name: 'addonBefore', label: 'Addon before', initialValue: '' });
  const [addonAfter] = ToolJet.useStateString({ name: 'addonAfter', label: 'Addon after', initialValue: '' });
  const [controls] = ToolJet.useStateBoolean({ name: 'controls', label: 'Controls', description: 'The up and down buttons.', initialValue: true });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onStep = ToolJet.useEventCallback({ name: 'onStep' });
  const onPressEnter = ToolJet.useEventCallback({ name: 'onPressEnter' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const ref = useRef<HTMLInputElement>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const value = toNumber(rawValue);
  const check = ToolJet.useValidation({ section: 'text', value: value === null ? '' : String(value), present: value !== null });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });

  const change = (next: number | null) => {
    setValue(next as number);
    onChange();
  };
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Value' }] },
    (next) => change(toNumber(next))
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(toNumber(props.value)));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());
  ToolJet.useAction({ name: 'blur', displayName: 'Blur' }, () => ref.current?.blur());

  const n = (v: unknown) => toNumber(v) ?? undefined;
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <AntInputNumber
            ref={ref as never}
            id={fieldId}
            style={{ width: '100%' }}
            value={value}
            placeholder={placeholder || undefined}
            disabled={disabled}
            min={n(min)}
            max={n(max)}
            step={n(step) ?? 1}
            precision={toNumber(precision) === null ? undefined : Math.max(0, Math.min(10, Number(precision)))}
            prefix={prefix || undefined}
            addonBefore={addonBefore || undefined}
            addonAfter={addonAfter || undefined}
            controls={controls}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            onChange={(v) => change(typeof v === 'number' ? v : toNumber(v))}
            onStep={() => onStep()}
            onPressEnter={onPressEnter}
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
