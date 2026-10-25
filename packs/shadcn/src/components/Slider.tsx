import React, { useEffect, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Field } from '../lib/Field';
import { TJ } from '../lib/ui2/inputs/sdk';
import { useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { useReseed } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { InlineLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ['accentColor', 'Range and handle color', 'accent', TOKEN.brand],
  ['labelColor', 'Label color', '--lk-label', TOKEN.text],
  ['helpTextColor', 'Help text color', '--lk-help', TOKEN.mutedText],
  ['trackColor', 'Track color', '--lk-track', TOKEN.brand],
];

const numeric = (n: unknown) => (typeof n === 'number' || (typeof n === 'string' && n.trim() !== '')) && Number.isFinite(Number(n));

export const Slider = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [min] = TJ.useStateNumber({ name: 'min', label: 'Minimum', initialValue: 0 });
  const [max] = TJ.useStateNumber({ name: 'max', label: 'Maximum', initialValue: 100 });
  const [step] = TJ.useStateNumber({ name: 'step', label: 'Step', initialValue: 1 });
  const [range] = TJ.useStateBoolean({ name: 'range', label: 'Range', initialValue: false });
  const [defaultValue] = TJ.useStateNumber({ name: 'defaultValue', label: 'Default value (number, or [start, end] for a range)', initialValue: 50 });
  // The pack's own: the value beside the label (UI 2.0 always shows it).
  const [showValue] = TJ.useStateBoolean({ name: 'showValue', label: 'Show value', initialValue: true });
  // Exposed: a number, or [start, end] for a range.
  const [rawValue, setValue] = TJ.useStateNumber({ name: 'value', initialValue: defaultValue, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });

  // Range: two thumbs, from the Range toggle or a default given as an array; a range whose default is one number
  // starts at the minimum and the maximum.
  const isRange = range === true || Array.isArray(defaultValue);
  const bounds = M.sliderBounds({ min, max, step });
  const start = () => {
    const raw = isRange && !Array.isArray(defaultValue) ? [bounds.min, bounds.max] : defaultValue;
    const values = M.sliderValues(raw, bounds);
    return isRange ? values.slice(0, 2) : values[0];
  };
  const stored = M.sliderValues(rawValue, bounds);
  const values = isRange ? (stored.length >= 2 ? stored.slice(0, 2) : [stored[0], bounds.max]) : [stored[0]];
  // From the latest value, so a setValue to the value it has fires nothing, a second call in one batch included.
  const valueSetter = useValueSetter<unknown>(rawValue, (v) => setValue(v as number));
  /** Publishes the thumbs' values; whether the value changed. */
  const publish = (v: number[]) => valueSetter.set(isRange ? v : v[0]);
  // A new default, or Range turned on or off, starts the value again.
  // On mount an untouched Default value leaves a value the app set (`value`, the pack's earlier name) alone.
  const keptOnMount = defaultValue === 50 && (isRange ? Array.isArray(rawValue) : numeric(rawValue));
  useReseed([defaultValue, isRange], () => setValue(start() as number), { onMount: !keptOnMount });
  // New bounds fit the value the user set, so what is exposed is what is drawn.
  useReseed([bounds.min, bounds.max], () => publish(values), { onMount: false });
  // The same for a value kept on mount, whose bounds were already known (a literal Maximum of 10 under the untouched
  // default 50): exposed 50 while the thumb draws 10. A value already within the bounds is published unchanged, and
  // fitting it is not the user's change, so no onChange.
  useEffect(() => {
    if (keptOnMount && JSON.stringify(isRange ? values : values[0]) !== JSON.stringify(rawValue)) publish(values);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  TJ.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'num1', displayName: 'Value' }] }, (n) => {
    if (!numeric(n)) return;
    const [v] = M.sliderValues(Number(n), bounds);
    const now = isRange && Array.isArray(valueSetter.latest.current) ? (valueSetter.latest.current as number[]) : null;
    if (publish(isRange ? M.sliderValues([v, Math.max(v, now?.[1] ?? values[1] ?? v)], bounds) : [v])) onChange();
  });
  TJ.useAction(
    {
      name: 'setRangeValue',
      displayName: 'Set range value',
      params: [
        { handle: 'num1', displayName: 'Start' },
        { handle: 'num2', displayName: 'End' },
      ],
    },
    (a, z) => {
      if (!numeric(a) || !numeric(z)) return;
      const pair = M.sliderValues([Number(a), Number(z)], bounds);
      if (publish(isRange ? pair : [pair[0]])) onChange();
    }
  );
  // As UI 2.0's (and the native Range slider's) reset: back to the default, without onChange.
  TJ.useAction({ name: 'reset', displayName: 'Reset' }, () => setValue(start() as number));

  const control = TJ.useControlState();
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 14, defaultHeight: 6 });

  // The thumbs while dragging; a new value or new bounds put them back on the value.
  const [live, setLive] = useState(values);
  const key = JSON.stringify(values);
  useEffect(() => setLive(values), [key, control.disabled]); // eslint-disable-line react-hooks/exhaustive-deps
  const disabled = legacyDisabled || control.disabled;
  const shownLabel = label ? (showValue !== false ? `${label}: ${live.join(' to ')}` : label) : '';

  return (
    <div className="ui ui2-in" style={looks}>
      <InlineLoading loading={control.loading} look="wide">
        <Field label={shownLabel} description={description}>
          <div className="ui2-slider-row">
            <SliderPrimitive.Root
              // Dragging a thumb moves the value, not the widget, in the ToolJet editor.
              data-tj-no-drag=""
              className="ui-slider"
              min={bounds.min}
              max={bounds.max}
              step={bounds.step}
              value={live}
              disabled={disabled}
              onValueChange={setLive}
              // Fires once per drag, on release.
              onValueCommit={(v) => {
                publish(v);
                onChange();
              }}
            >
              <SliderPrimitive.Track className="ui-slider-track">
                <SliderPrimitive.Range className="ui-slider-range" />
              </SliderPrimitive.Track>
              {live.map((_, i) => (
                <SliderPrimitive.Thumb key={i} className="ui-slider-thumb" aria-label={label || 'Slider'} />
              ))}
            </SliderPrimitive.Root>
          </div>
        </Field>
      </InlineLoading>
    </div>
  );
};
