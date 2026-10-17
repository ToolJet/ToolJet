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
  const raw = properties.defaultValue;
  const isRange = Array.isArray(raw);
  const bounds = useStable(sliderBounds(properties));
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
  const [value, change, setValue] = useValue(
    props,
    isRange ? initial : initial[0],
    (set) => ({
      setValue: async (n: unknown) => {
        const { bounds: b, isRange: range, value: current } = latest.current;
        if (!numeric(n)) return;
        const [v] = sliderValues(Number(n), b);
        change(range ? sliderValues([v, Math.max(v, list(current)[1] ?? v)], b) : v);
      },
      setRangeValue: async (a: unknown, z: unknown) => {
        const { bounds: b, isRange: range } = latest.current;
        if (!numeric(a) || !numeric(z)) return;
        const pair = sliderValues([Number(a), Number(z)], b);
        change(range ? pair : pair[0]);
      },
      reset: async () => {
        const { initial: start, isRange: range } = latest.current;
        set(range ? start : start[0]);
      },
    }),
    undefined,
    raw
  );
  // New bounds (a smaller maximum, a larger minimum) fit the value the user set, so what is exposed is what is drawn.
  useEffect(() => {
    const fitted = sliderValues(value, bounds);
    const next = isRange ? fitted : fitted[0];
    if (JSON.stringify(next) !== JSON.stringify(value)) setValue(next);
  }, [value, bounds, isRange, setValue]);
  latest.current = { bounds, isRange, initial, value };
  // A Form's clearForm sets it to its minimum (a range to minimum and minimum), as the native Range slider.
  useFormClearNow(() => {
    const { bounds: b, isRange: range } = latest.current;
    change(range ? [b.min, b.min] : b.min);
  });
  useExposed(props.setExposedVariables, properties, { label: String(properties.label ?? '') });
  // The thumbs shown while dragging; a new value or new bounds put them back on the value.
  const [live, setLive] = useState(initial);
  const current = useStable(value);
  useEffect(() => setLive(sliderValues(current, bounds)), [current, bounds]);
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
            disabled={busy(properties)}
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
