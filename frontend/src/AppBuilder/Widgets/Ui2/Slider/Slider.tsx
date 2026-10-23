import React, { useEffect, useRef, useState } from 'react';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Slider } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { sliderBounds, sliderValues } from './sliderModel';
import type { SliderBounds } from './sliderModel';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Field, fieldName } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useFormClearNow, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const ShadSlider = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties } = props;
  // Range: two thumbs. The Range toggle, or a default given as an array (as before); a range whose default is one
  // number (or none) starts at the minimum and the maximum. A range was only reachable by typing an array.
  const isRange = properties.range === true || Array.isArray(properties.defaultValue);
  const bounds = useStable(sliderBounds(properties));
  const raw = isRange && !Array.isArray(properties.defaultValue) ? [bounds.min, bounds.max] : properties.defaultValue;
  const initial = sliderValues(raw, bounds);
  // The native Range slider's actions: setValue(n) for one value (a range's start), setRangeValue(start, end) for a
  // range, reset() back to the default. Values are kept inside min and max; a non-number changes nothing. As the
  // native ones, setValue and setRangeValue fire onChange and reset fires nothing.
  const numeric = (n: unknown) =>
    (typeof n === 'number' || (typeof n === 'string' && n.trim() !== '')) && Number.isFinite(Number(n));
  // What the actions read: they are published once, so they see this render's values through the ref.
  const latest = useRef<{ bounds: SliderBounds; isRange: boolean; initial: number[]; value: number | number[] }>({
    bounds,
    isRange,
    initial,
    value: isRange ? initial : initial[0],
  });
  // Puts the thumbs back on the value (below): an action or a Form's clear sets it even while a drag holds them
  // elsewhere, and may set the value it already has.
  const [placed, setPlaced] = useState(0);
  const place = () => setPlaced((n) => n + 1);
  const [value, change, setValue] = useValue(
    props,
    isRange ? initial : initial[0],
    (set) => ({
      setValue: async (n: unknown) => {
        const { bounds: b, isRange: range, value: current } = latest.current;
        if (!numeric(n)) return;
        const [v] = sliderValues(Number(n), b);
        place();
        change(range ? sliderValues([v, Math.max(v, list(current)[1] ?? v)], b) : v);
      },
      setRangeValue: async (a: unknown, z: unknown) => {
        const { bounds: b, isRange: range } = latest.current;
        if (!numeric(a) || !numeric(z)) return;
        const pair = sliderValues([Number(a), Number(z)], b);
        place();
        change(range ? pair : pair[0]);
      },
      reset: async () => {
        const { initial: start, isRange: range } = latest.current;
        place();
        set(range ? start : start[0]);
      },
    }),
    undefined,
    // Turning Range on or off starts the value again, as a new default does.
    [raw, isRange]
  );
  // New bounds (a smaller maximum, a larger minimum) fit the value the user set, so what is exposed is what is drawn.
  // It fits the value queued before it (an updater): a new default arriving in the same update has reset it already.
  useEffect(() => {
    const fit = (v: number | number[]) => {
      const fitted = sliderValues(v, bounds);
      return isRange ? fitted : fitted[0];
    };
    const same = (v: number | number[]) => JSON.stringify(fit(v)) === JSON.stringify(v);
    if (!same(value)) setValue((v) => (same(v) ? v : fit(v)));
  }, [value, bounds, isRange, setValue]);
  latest.current = { bounds, isRange, initial, value };
  // A Form's clearForm sets it to its minimum (a range to minimum and minimum), as the native Range slider.
  useFormClearNow(() => {
    const { bounds: b, isRange: range } = latest.current;
    place();
    change(range ? [b.min, b.min] : b.min);
  });
  useExposed(props.setExposedVariables, properties, { label: String(properties.label ?? '') });
  // The thumbs shown while dragging; a new value or new bounds put them back on the value, and so do an action and the
  // control turning disabled or loading: that cuts a drag short without committing it, and the thumbs stayed where
  // they were dragged while the value and the Form kept the old one.
  const [live, setLive] = useState(initial);
  const current = useStable(value);
  const disabled = busy(properties);
  useEffect(() => setLive(sliderValues(current, bounds)), [current, bounds, disabled, placed]);
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        label={properties.label ? `${properties.label}${live.length ? `: ${live.join(' to ')}` : ''}` : ''}
        description={properties.description}
      >
        <div className="tw-flex tw-h-5 tw-items-center">
          <Slider
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            value={live}
            disabled={disabled}
            thumbLabel={fieldName(props, 'Slider') ?? String(properties.label)}
            onValueChange={setLive}
            onValueCommit={(v) => change(isRange ? v : v[0])}
          />
        </div>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadSlider);
