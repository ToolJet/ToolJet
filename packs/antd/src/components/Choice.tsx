import React, { useEffect } from 'react';
import { Radio, Rate as AntRate, Segmented as AntSegmented, Slider as AntSlider } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { SpinOver } from '../lib/Loading';
import { FormField, useFieldProps } from '../lib/FormField';
import { str, toOptions } from '../lib/data';
import { toNumber } from '../lib/format';

const useValueActions = (change: (v: unknown) => void, initial: unknown) => {
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Value' }] },
    (next) => change(next)
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(initial));
};

// The value exposed is the value drawn (SP-34): `fit` gives what Ant draws for a number. Fitting is not the user's
// change, so no onChange. It fits the value last set by the app or the user, not an earlier fit: bounds that load after
// the value (a Max bound to a query) fit it again from what was asked, not from what a narrower range left of it. An
// empty value (a cleared Form) stays empty.
const useFittedValue = (value: unknown, fit: (n: number) => number, setValue: (v: number) => void) => {
  const fitted = React.useRef<unknown>(undefined);
  const wanted = React.useRef<unknown>(value);
  if (!Object.is(value, fitted.current)) {
    wanted.current = value;
    fitted.current = undefined;
  }
  const n = toNumber(wanted.current);
  const drawn = n === null ? null : fit(n);
  useEffect(() => {
    if (drawn === null || Object.is(drawn, value)) return;
    fitted.current = drawn;
    setValue(drawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawn, value]);
  return drawn;
};

// Ant's Radio.Group: options, value, optionType (default, button), buttonStyle (outline, solid), direction (Ant's
// vertical radios are a Space); event onChange.
export const RadioGroup = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Shipping' });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: [
    { label: 'Standard', value: 'standard' },
    { label: 'Express', value: 'express' },
    { label: 'Overnight', value: 'overnight' },
  ] });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [optionType] = ToolJet.useStateEnumeration({ name: 'optionType', label: 'Option type', enumDefinition: ['default', 'button'], initialValue: 'default' });
  const [buttonStyle] = ToolJet.useStateEnumeration({
    name: 'buttonStyle',
    label: 'Button style',
    enumDefinition: ['outline', 'solid'],
    initialValue: 'solid',
    visibleWhen: { key: 'optionType', value: 'button' },
  });
  const [vertical] = ToolJet.useStateBoolean({ name: 'vertical', label: 'Vertical', initialValue: false, visibleWhen: { key: 'optionType', value: 'default' } });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value, present: value !== '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 6 });
  const change = (v: unknown) => {
    setValue(str(v));
    check.touch();
    onChange();
  };
  useValueActions(change, props.value);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <SpinOver loading={loading} as="inline">
          <Radio.Group
            id={fieldId}
            options={toOptions(rawOptions)}
            value={value || undefined}
            optionType={optionType as 'default'}
            buttonStyle={buttonStyle as 'solid'}
            size={size as 'middle'}
            disabled={disabled}
            style={vertical && optionType === 'default' ? { display: 'flex', flexDirection: 'column', gap: 8 } : undefined}
            onChange={(e) => change(e.target.value)}
          />
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// Ant's Segmented: options, value, block, size, vertical; event onChange.
export const Segmented = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'View' });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value }]', initialValue: [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ] });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'Empty selects the first option.', initialValue: '' });
  const [block] = ToolJet.useStateBoolean({ name: 'block', label: 'Block', description: 'Fit the width.', initialValue: false });
  const [vertical] = ToolJet.useStateBoolean({ name: 'vertical', label: 'Vertical', initialValue: false });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ section: 'choice', value, present: value !== '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 4 });
  const options = toOptions(rawOptions);
  // An empty value selects nothing (null; undefined would make Ant select the first option), so a required
  // Segmented does not look filled.
  const current = options.some((o) => o.value === value) ? value : (null as unknown as string);
  const change = (v: unknown) => {
    setValue(str(v));
    check.touch();
    onChange();
  };
  useValueActions(change, props.value);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="inline">
          {options.length ? (
            <AntSegmented
              options={options}
              value={current}
              block={block}
              vertical={vertical}
              size={size as 'middle'}
              disabled={disabled}
              onChange={(v) => change(v)}
            />
          ) : (
            <span />
          )}
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// Ant's Rate: value, count, allowHalf, allowClear, tooltips; event onChange, onHoverChange.
export const Rate = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Rating' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: 0 });
  const [count] = ToolJet.useStateNumber({ name: 'count', label: 'Count', initialValue: 5, min: 1, max: 20 });
  const [allowHalf] = ToolJet.useStateBoolean({ name: 'allowHalf', label: 'Allow half', initialValue: false });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const [tooltips] = ToolJet.useStateArray({ name: 'tooltips', label: 'Tooltips', description: "One per star: ['bad', 'normal', 'good']", initialValue: [] });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ section: 'choice', value, present: Number(value) > 0 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 4 });
  const change = (v: unknown) => {
    setValue(toNumber(v) ?? 0);
    check.touch();
    onChange();
  };
  useValueActions(change, props.value);
  const tips = Array.isArray(tooltips) ? tooltips.map(str) : [];
  const stars = Math.max(1, Math.min(20, Number(count) || 5));
  // Ant draws a literal 9 of 5 stars as 5, and 2.3 as 2 (2.5 with halves).
  const drawn = useFittedValue(value, (n) => Math.max(0, Math.min(stars, allowHalf ? Math.round(n * 2) / 2 : Math.round(n))), setValue);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="inline">
          <AntRate
            value={drawn ?? 0}
            count={stars}
            allowHalf={allowHalf}
            allowClear={allowClear}
            tooltips={tips.length ? tips : undefined}
            disabled={disabled}
            onChange={(v) => change(v)}
          />
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// Ant's Slider: value, min, max, step, marks off, dots, tooltip; events onChange, onChangeComplete.
export const Slider = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Volume' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: 0 });
  const [min] = ToolJet.useStateNumber({ name: 'min', label: 'Min', initialValue: 0 });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', initialValue: 100 });
  const [step] = ToolJet.useStateNumber({ name: 'step', label: 'Step', initialValue: 1 });
  const [dots] = ToolJet.useStateBoolean({ name: 'dots', label: 'Dots', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onChangeComplete = ToolJet.useEventCallback({ name: 'onChangeComplete' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ section: 'choice', value: String(value ?? ''), present: true });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 4 });
  const lo = toNumber(min) ?? 0;
  const hi = Math.max(lo, toNumber(max) ?? 100);
  const change = (v: unknown) => {
    setValue(Math.min(hi, Math.max(lo, toNumber(v) ?? lo)));
    onChange();
  };
  useValueActions(change, props.value);
  // A literal 150 under a Max of 100 drew the thumb at 100 but exposed 150.
  const drawn = useFittedValue(value, (n) => Math.min(hi, Math.max(lo, n)), setValue);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="block">
          <div data-tj-no-drag="">
            <AntSlider
              value={drawn ?? lo}
              min={lo}
              max={hi}
              step={toNumber(step) || 1}
              dots={dots}
              disabled={disabled}
              onChange={(v) => change(v)}
              onChangeComplete={() => {
                check.touch();
                onChangeComplete();
              }}
            />
          </div>
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};
