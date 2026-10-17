import React, { useRef } from 'react';
import { toOptions, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { ToggleGroup, ToggleGroupItem, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { MAX_CHOICES, defaultKey, optionsByKey, shownOptions } from '@/AppBuilder/Widgets/Ui2/_shared/choices';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const ShadToggleGroup = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties } = props;
  const options = toOptions(properties.options);
  const byKey = optionsByKey(options);
  const initial = defaultKey(properties.defaultValue);
  // The native Button group's actions: setSelected(value) picks an option (a value no option has changes nothing),
  // clear() leaves none picked.
  const keysRef = useRef(byKey);
  keysRef.current = byKey;
  const [key, change] = useValue(
    props,
    initial,
    (set) => ({
      setSelected: async (v: unknown) => {
        const k = v === undefined || v === null || typeof v === 'object' ? null : String(v);
        if (k !== null && keysRef.current.has(k)) set(k);
      },
      clear: async () => set(''),
    }),
    (k) => byKey.get(k)?.value ?? ''
  );
  return (
    <Shell {...props} innerRef={fit}>
      <ToggleGroup
        type="single"
        value={key}
        disabled={busy(properties)}
        className={cn(
          'tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-bg-[color:var(--lk-bg,var(--sc-muted))] tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
          properties.fullWidth === true && 'tw-flex tw-w-full'
        )}
        onValueChange={(next) => next && change(next)}
      >
        {shownOptions(options, byKey.get(key), MAX_CHOICES).map((o) => (
          <ToggleGroupItem
            key={String(o.value)}
            value={String(o.value)}
            className="tw-rounded-[calc(var(--lk-radius,var(--sc-radius))*0.8)] data-[state=on]:tw-bg-[color:var(--lk-on-bg,var(--sc-background))] data-[state=on]:tw-text-[color:var(--lk-on-fg,var(--sc-foreground))]"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Shell>
  );
};

export default withControlState(ShadToggleGroup);
