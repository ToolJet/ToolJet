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
// vertical radios are a Space); event onChange. Allow deselect (UI 2.0's, off by default): a click on the picked
// option clears the value, with onChange.
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
  const [allowDeselect] = ToolJet.useStateBoolean({ name: 'allowDeselect', label: 'Allow deselect', description: 'A click on the picked option clears it.', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value, present: value !== '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 6 });
  const options = toOptions(rawOptions);
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
            options={allowDeselect === true ? undefined : options}
            value={value || undefined}
            optionType={optionType as 'default'}
            buttonStyle={buttonStyle as 'solid'}
            size={size as 'middle'}
            disabled={disabled}
            style={vertical && optionType === 'default' ? { display: 'flex', flexDirection: 'column', gap: 8 } : undefined}
            onChange={(e) => change(e.target.value)}
          >
            {/* Ant fires no onChange for a click on the checked radio, so deselecting is the option's own click
                (Ant's Radio reports one click for the label and its input). */}
            {allowDeselect === true
              ? options.map((o) => {
                  const Option = optionType === 'button' ? Radio.Button : Radio;
                  return (
                    <Option
                      key={o.value}
                      value={o.value}
                      disabled={o.disabled}
                      onClick={() => {
                        if (!disabled && !o.disabled && o.value === value) change('');
                      }}
                    >
                      {o.label}
                    </Option>
                  );
                })
              : null}
          </Radio.Group>
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

/** A range's [from, to] within lo and hi, in order; anything that is not two numbers is the whole range. */
const toRange = (v: unknown, lo: number, hi: number): [number, number] => {
  const fit = (n: number) => Math.min(hi, Math.max(lo, n));
  const pair = Array.isArray(v) ? v.slice(0, 2).map((x) => toNumber(x)) : [];
  if (pair.length < 2 || pair[0] === null || pair[1] === null) return [lo, hi];
  const [a, b] = [fit(pair[0] as number), fit(pair[1] as number)];
  return a <= b ? [a, b] : [b, a];
};

// Ant's Slider: value, min, max, step, marks off, dots, tooltip; events onChange, onChangeComplete. range (Ant's
// own prop) gives two handles, and value is then [from, to].
export const Slider = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Volume' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', description: 'A number, or [from, to] with Range on.', initialValue: 0 });
  const [range] = ToolJet.useStateBoolean({ name: 'range', label: 'Range', description: 'Two handles; the value is [from, to].', initialValue: false });
  const [min] = ToolJet.useStateNumber({ name: 'min', label: 'Min', initialValue: 0 });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', initialValue: 100 });
  const [step] = ToolJet.useStateNumber({ name: 'step', label: 'Step', initialValue: 1 });
  const [dots] = ToolJet.useStateBoolean({ name: 'dots', label: 'Dots', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onChangeComplete = ToolJet.useEventCallback({ name: 'onChangeComplete' });
  const { disabled, loading } = ToolJet.useControlState();
  const isRange = range === true;
  const isPair = Array.isArray(value);
  const check = ToolJet.useValidation({
    section: 'choice',
    value: isPair ? (value as unknown as unknown[]).join(',') : String(value ?? ''),
    present: true,
  });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 4 });
  const lo = toNumber(min) ?? 0;
  const hi = Math.max(lo, toNumber(max) ?? 100);
  const clamp = (n: number) => Math.min(hi, Math.max(lo, n));
  const change = (v: unknown) => {
    if (isRange) setValue(toRange(v, lo, hi) as unknown as number);
    else setValue(clamp(toNumber(Array.isArray(v) ? v[0] : v) ?? lo));
    onChange();
  };
  useValueActions(change, props.value);
  // A literal 150 under a Max of 100 drew the thumb at 100 but exposed 150. A range value fits only while Range is on:
  // a single number (or a [from, to] left from Range) passes through untouched to the range fit below.
  const drawn = useFittedValue(isRange || isPair ? null : value, (n) => clamp(n), setValue);
  // With Range, anything that is not [from, to] within the bounds (a single number, a Range just turned on) is fitted
  // to one, and a [from, to] left when Range is turned off becomes its first number; fitting is not the user's change,
  // so no onChange. An empty value (a cleared Form) stays empty and draws the whole range.
  const empty = value === null || value === undefined || (value as unknown) === '';
  const pair = toRange(value, lo, hi);
  const fittedKey = isRange ? (empty ? '' : pair.join(',')) : isPair ? String(clamp(toNumber((value as unknown as unknown[])[0]) ?? lo)) : '';
  const valueKey = isPair ? (value as unknown as unknown[]).join(',') : String(value ?? '');
  useEffect(() => {
    if (!fittedKey || fittedKey === valueKey) return;
    setValue((isRange ? pair : clamp(toNumber((value as unknown as unknown[])[0]) ?? lo)) as unknown as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fittedKey, valueKey, isRange]);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="block">
          <div data-tj-no-drag="">
            {isRange ? (
              <AntSlider
                range
                value={pair}
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
            ) : (
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
            )}
          </div>
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};
