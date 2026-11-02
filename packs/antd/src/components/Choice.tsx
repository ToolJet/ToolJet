import React, { useEffect } from 'react';
import { Radio, Rate as AntRate, Segmented as AntSegmented, Slider as AntSlider } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { SpinOver } from '../lib/Loading';
import { FormField, useFieldProps } from '../lib/FormField';
import { keyForValue, str, toOptions, valueForKey, type Option } from '../lib/data';
import { toNumber } from '../lib/format';
import { useValueSetter } from '../lib/sameValue';

// A wanted value as a choice stores it: the option it names, with that option's own value (1 stays a number, and the text
// '1' picks the option 1 when no option is '1'), else the value as text; nothing is ''. lib/data Option has the keys.
const storedChoice = (options: Option[], v: unknown): unknown =>
  v === undefined || v === null || v === '' ? '' : valueForKey(options, keyForValue(options, v));

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
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: 'Plain values or [{ label, value, disabled? }].',
    initialValue: [
      { label: 'Standard', value: 'standard' },
      { label: 'Express', value: 'express' },
      { label: 'Overnight', value: 'overnight' },
    ],
  });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [optionType] = ToolJet.useStateEnumeration({
    name: 'optionType',
    label: 'Option type',
    enumDefinition: ['default', 'button'],
    initialValue: 'default',
  });
  const [buttonStyle] = ToolJet.useStateEnumeration({
    name: 'buttonStyle',
    label: 'Button style',
    enumDefinition: ['outline', 'solid'],
    initialValue: 'solid',
    visibleWhen: { key: 'optionType', value: 'button' },
  });
  const [vertical] = ToolJet.useStateBoolean({
    name: 'vertical',
    label: 'Vertical',
    initialValue: false,
    visibleWhen: { key: 'optionType', value: 'default' },
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['small', 'middle', 'large'],
    initialValue: 'middle',
  });
  const [allowDeselect] = ToolJet.useStateBoolean({
    name: 'allowDeselect',
    label: 'Allow deselect',
    description: 'A click on the picked option clears it.',
    initialValue: false,
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ kind: 'choice', value: str(value), present: value !== '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'radio',
    fit: true,
    loading: 'own',
    usage:
      "Ant's Radio.Group: label, options [{label, value}], value, optionType (default, button), buttonStyle, vertical; onChange.",
    roleProps: { description: 'extra' },
    roleActions: { setValue: 'setFieldValue', clear: 'resetFields' },
    defaultWidth: 14,
    defaultHeight: 6,
  });
  const options = toOptions(rawOptions, 'RadioGroup');
  // The radios hold option keys; the value keeps its type (lib/data Option).
  const key = value === '' ? '' : keyForValue(options, value);
  // A value it already has changes nothing and fires nothing (lib/sameValue).
  const valueSetter = useValueSetter<unknown>(value, (v) => setValue(v as never));
  const change = (v: unknown) => {
    if (!valueSetter.set(storedChoice(options, v))) return;
    check.touch();
    onChange();
  };
  // A radio's own key, picked by a click.
  const pick = (k: unknown) => change(k === '' ? '' : valueForKey(options, k));
  useValueActions(change, props.value);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <SpinOver loading={loading} as="inline">
          <Radio.Group
            id={fieldId}
            value={key || undefined}
            optionType={optionType as 'default'}
            buttonStyle={buttonStyle as 'solid'}
            size={size as 'middle'}
            disabled={disabled}
            style={
              vertical && optionType === 'default' ? { display: 'flex', flexDirection: 'column', gap: 8 } : undefined
            }
            onChange={(e) => pick(e.target.value)}
          >
            {/* The radios are drawn here, not from Ant's options, so each has a React key of its own (two options
                with one value drew with one key). Ant fires no onChange for a click on the checked radio, so
                deselecting is the option's own click (Ant's Radio reports one click for the label and its input). */}
            {options.map((o) => {
              const Item = optionType === 'button' ? Radio.Button : Radio;
              return (
                <Item
                  key={o.key}
                  value={o.value}
                  disabled={o.disabled}
                  onClick={
                    allowDeselect === true
                      ? () => {
                          if (!disabled && !o.disabled && o.value === key) change('');
                        }
                      : undefined
                  }
                >
                  {o.label}
                </Item>
              );
            })}
          </Radio.Group>
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// Ant's Segmented: options, value, block, size, vertical; event onChange.
export const Segmented = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'View' });
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: 'Plain values or [{ label, value, disabled? }].',
    initialValue: [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
    ],
  });
  const [value, setValue] = ToolJet.useStateString({
    name: 'value',
    label: 'Value',
    description: 'Empty selects the first option.',
    initialValue: '',
  });
  const [block] = ToolJet.useStateBoolean({
    name: 'block',
    label: 'Block',
    description: 'Fit the width.',
    initialValue: false,
  });
  // Where the group sits when its box is wider than the buttons: a filter toggle that ends a row reads at the row's end.
  const [alignment] = ToolJet.useStateEnumeration({
    name: 'alignment',
    label: 'Alignment',
    enumDefinition: ['left', 'center', 'right'],
    enumLabels: { left: 'Left', center: 'Center', right: 'Right' },
    initialValue: 'left',
    visibleWhen: { key: 'block', value: false },
  });
  const [vertical] = ToolJet.useStateBoolean({ name: 'vertical', label: 'Vertical', initialValue: false });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['small', 'middle', 'large'],
    initialValue: 'middle',
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ kind: 'choice', value: str(value), present: value !== '' });
  const tokens = useTokenStyles();
  // Its label over a 32px control, as Ant's Input (the 4-row box cut the control by 20px).
  ToolJet.useComponentSettings({
    role: 'togglegroup',
    fit: true,
    loading: 'own',
    usage: "Ant's Segmented: options [{label, value}], value (empty: the first), block; onChange.",
    roleActions: { setValue: 'setFieldValue' },
    defaultWidth: 14,
    defaultHeight: 6,
  });
  const options = toOptions(rawOptions, 'Segmented');
  // Ant's Segmented keys each item by its value, so it gets each option's own React key as the value (two options with
  // one value drew with one key); the value keeps its type (lib/data Option). An option drawn twice shows the first.
  const items = options.map((o) => ({ label: o.label, value: o.key, disabled: o.disabled }));
  const key = value === '' ? '' : keyForValue(options, value);
  // An empty value selects nothing (null; undefined would make Ant select the first option), so a required
  // Segmented does not look filled.
  const current = options.find((o) => o.value === key)?.key ?? (null as unknown as string);
  // A value it already has changes nothing and fires nothing (lib/sameValue).
  const valueSetter = useValueSetter<unknown>(value, (v) => setValue(v as never));
  const change = (v: unknown) => {
    if (!valueSetter.set(storedChoice(options, v))) return;
    check.touch();
    onChange();
  };
  useValueActions(change, props.value);

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <div style={{ width: '100%', textAlign: block ? undefined : (alignment as 'left') }}>
          <SpinOver loading={loading} as="inline">
            {options.length ? (
              <AntSegmented
                options={items}
                value={current}
                block={block}
                vertical={vertical}
                size={size as 'middle'}
                disabled={disabled}
                onChange={(v) => change(options.find((o) => o.key === v)?.data ?? '')}
              />
            ) : (
              <span />
            )}
          </SpinOver>
        </div>
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
  const [tooltips] = ToolJet.useStateArray({
    name: 'tooltips',
    label: 'Tooltips',
    description: "One per star: ['bad', 'normal', 'good']",
    initialValue: [],
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ kind: 'choice', value, present: Number(value) > 0 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'rating',
    fit: true,
    loading: 'own',
    usage: "Ant's Rate: value, count, allowHalf; onChange.",
    roleProps: { max: 'count' },
    roleActions: { setValue: 'setFieldValue', clear: 'resetFields' },
    defaultWidth: 10,
    defaultHeight: 4,
  });
  // A value it already has changes nothing and fires nothing (lib/sameValue).
  const valueSetter = useValueSetter<unknown>(value, (v) => setValue(v as never));
  const change = (v: unknown) => {
    if (!valueSetter.set(toNumber(v) ?? 0)) return;
    check.touch();
    onChange();
  };
  useValueActions(change, props.value);
  const tips = Array.isArray(tooltips) ? tooltips.map(str) : [];
  const stars = Math.max(1, Math.min(20, Number(count) || 5));
  // Ant draws a literal 9 of 5 stars as 5, and 2.3 as 2 (2.5 with halves).
  const drawn = useFittedValue(
    value,
    (n) => Math.max(0, Math.min(stars, allowHalf ? Math.round(n * 2) / 2 : Math.round(n))),
    setValue
  );

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
  const [value, setValue] = ToolJet.useStateNumber({
    name: 'value',
    label: 'Value',
    description: 'A number, or [from, to] with Range on.',
    initialValue: 0,
  });
  const [range] = ToolJet.useStateBoolean({
    name: 'range',
    label: 'Range',
    description: 'Two handles; the value is [from, to].',
    initialValue: false,
  });
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
    kind: 'choice',
    value: isPair ? (value as unknown as unknown[]).join(',') : String(value ?? ''),
    present: true,
  });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'slider',
    fit: true,
    loading: 'own',
    usage: "Ant's Slider: value, min, max, step; onChange while dragging, onChangeComplete on release.",
    roleActions: { setValue: 'setFieldValue' },
    defaultWidth: 14,
    defaultHeight: 4,
  });
  const lo = toNumber(min) ?? 0;
  const hi = Math.max(lo, toNumber(max) ?? 100);
  // Within the bounds and on the step grid, as Ant draws the thumb (its closest point: a grid step, or Max): an action's
  // 1.5 on a step of 1 drew the thumb at 2 and exposed 1.5.
  const stepSize = Math.abs(toNumber(step) || 1);
  const clamp = (n: number) => {
    const within = Math.min(hi, Math.max(lo, n));
    const grid = Math.min(hi, lo + Math.round((within - lo) / stepSize) * stepSize);
    const snapped = Math.abs(hi - within) < Math.abs(grid - within) ? hi : grid;
    return Number(snapped.toFixed(10));
  };
  // A value it already has changes nothing and fires nothing (lib/sameValue).
  const valueSetter = useValueSetter<unknown>(value, (v) => setValue(v as never));
  const change = (v: unknown) => {
    const next = isRange ? toRange(v, lo, hi).map(clamp) : clamp(toNumber(Array.isArray(v) ? v[0] : v) ?? lo);
    if (valueSetter.set(next)) onChange();
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
  const fittedKey = isRange
    ? empty
      ? ''
      : pair.join(',')
    : isPair
      ? String(clamp(toNumber((value as unknown as unknown[])[0]) ?? lo))
      : '';
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
