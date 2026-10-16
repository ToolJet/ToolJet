import React, { useEffect, useRef, useState } from 'react';
import { list, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Slider } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { sliderBounds, sliderValues } from './sliderModel';
import type { SliderBounds } from './sliderModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Field, fieldName } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const ShadSlider = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties } = props;
  const raw = properties.defaultValue;
  const isRange = Array.isArray(raw);
  const bounds = sliderBounds(properties);
  const initial = sliderValues(raw, bounds);
  // The native Range slider's actions: setValue(n) for one value (a range's start), setRangeValue(start, end) for a
  // range, reset() back to the default. Values are kept inside min and max; a non-number changes nothing.
  const numeric = (n: unknown) =>
    (typeof n === 'number' || (typeof n === 'string' && n.trim() !== '')) && Number.isFinite(Number(n));
  // What the actions read: they are published once, so they see this render's values through the ref.
  const latest = useRef<{ bounds: SliderBounds; isRange: boolean; initial: number[]; value: number | number[] }>({
    bounds,
    isRange,
    initial,
    value: isRange ? initial : initial[0],
  });
  const [value, change] = useValue(props, isRange ? initial : initial[0], (set) => ({
    setValue: async (n: unknown) => {
      const { bounds: b, isRange: range, value: current } = latest.current;
      if (!numeric(n)) return;
      const [v] = sliderValues(Number(n), b);
      set(range ? sliderValues([v, Math.max(v, list(current)[1] ?? v)], b) : v);
    },
    setRangeValue: async (a: unknown, z: unknown) => {
      const { bounds: b, isRange: range } = latest.current;
      if (!numeric(a) || !numeric(z)) return;
      const pair = sliderValues([Number(a), Number(z)], b);
      set(range ? pair : pair[0]);
    },
    reset: async () => {
      const { initial: start, isRange: range } = latest.current;
      set(range ? start : start[0]);
    },
  }));
  latest.current = { bounds, isRange, initial, value };
  useExposed(props.setExposedVariables, properties, { label: String(properties.label ?? '') });
  const [live, setLive] = useState(initial);
  useEffect(() => setLive(sliderValues(value, bounds)), [stringify(value), bounds.min, bounds.max]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        label={properties.label ? `${properties.label}${live.length ? `: ${live.join(' to ')}` : ''}` : ''}
        description={properties.description}
      >
        <div className="flex h-5 items-center">
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
