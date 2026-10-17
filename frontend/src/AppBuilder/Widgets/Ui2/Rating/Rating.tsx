import React, { useRef, useState } from 'react';
import { Circle, Heart, Star } from 'lucide-react';
import { FormField, controlAria } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isStringOrNumber, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Rating --------------------------------------------------------------------------------------------------------

const RATING_SIZES: Record<string, number> = { sm: 16, default: 20, lg: 28 };

export const RATING_ICONS: Record<string, LucideIcon> = { star: Star, heart: Heart, circle: Circle };

// Filled icons: the filledColor style, else a colour that suits the icon (amber stars, red hearts, primary dots).
export const FILLED: Record<string, string> = {
  star: 'tw-fill-[color:var(--lk-on,var(--sc-warning))] tw-text-[color:var(--lk-on,var(--sc-warning))]',
  heart: 'tw-fill-[color:var(--lk-on,var(--sc-destructive))] tw-text-[color:var(--lk-on,var(--sc-destructive))]',
  circle: 'tw-fill-[color:var(--lk-on,var(--sc-primary))] tw-text-[color:var(--lk-on,var(--sc-primary-ink))]',
};

export const EMPTY =
  'tw-fill-[color:var(--lk-off,color-mix(in_srgb,var(--sc-muted-foreground)_22%,transparent))] tw-text-[color:var(--lk-off,color-mix(in_srgb,var(--sc-muted-foreground)_22%,transparent))]';

export const ShadRating = (props: WidgetProps) => {
  const { properties, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const max = M.clampMax(properties.max);
  const half = properties.allowHalf === true;
  const initial = M.normalizeRating(properties.defaultValue, max, half);
  const limits = useRef({ max, half, initial });
  limits.current = { max, half, initial };
  const [stored, change] = useValue(props, initial, (set) => ({
    setValue: async (v: unknown) => set(M.normalizeRating(v, limits.current.max, limits.current.half)),
    clear: async () => set(0),
    // The native Star rating's resetValue(): back to the default.
    resetValue: async () => set(limits.current.initial),
  }));
  useExposed(props.setExposedVariables, properties, { label: String(properties.label ?? '') });
  const value = Math.min(Number(stored) || 0, max);
  // No stars is no rating, though 0 is a number.
  const check = useValidation(props, value, () => change(0), value > 0);
  const [hover, setHover] = useState<number | null>(null);
  const radios = useRef<(HTMLSpanElement | null)[]>([]);
  const readOnly = properties.readOnly === true;
  const interactive = !readOnly && !busy(properties);
  const shown = interactive && hover !== null ? hover : value;
  const kind = RATING_ICONS[properties.icon] ? properties.icon : 'star';
  const Icon = RATING_ICONS[kind];
  const size = RATING_SIZES[properties.size] || RATING_SIZES.default;
  const labels = list(properties.valueLabels).map((l) => (isStringOrNumber(l) ? String(l) : ''));
  const setTo = (next: number) => {
    if (next !== value) change(next);
    check.touch();
  };
  const pointAt = (e: MouseEvent<HTMLSpanElement>, position: number) => {
    const r = e.currentTarget.getBoundingClientRect?.();
    return half && r?.width && e.clientX - r.left < r.width / 2 ? position - 0.5 : position;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!interactive) return;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = M.stepRating(value, 1, max, half);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = M.stepRating(value, -1, max, half);
    else if (e.key === 'Home') next = half ? 0.5 : 1;
    else if (e.key === 'End') next = max;
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= max) next = Number(e.key);
    else if (['0', 'Delete', 'Backspace'].includes(e.key) && properties.allowClear !== false) next = 0;
    if (next === null) return;
    e.preventDefault();
    setTo(next);
    radios.current[Math.max(1, Math.ceil(next)) - 1]?.focus();
  };
  const focusable = Math.max(1, Math.ceil(value));
  const valueText = shown > 0 ? labels[Math.ceil(shown) - 1] || `${shown} / ${max}` : labels.length ? '' : `0 / ${max}`;
  return (
    <FormField props={props} properties={properties} check={check} innerRef={ref}>
      <div className="tw-flex tw-items-center tw-gap-2">
        <div
          id={`shad-${id}`}
          role="radiogroup"
          aria-label={isStringOrNumber(properties.label) && properties.label ? String(properties.label) : 'Rating'}
          aria-readonly={readOnly || undefined}
          aria-disabled={busy(properties) || undefined}
          {...controlAria(props, check.error)}
          className={cn('tw-inline-flex tw-items-center', size >= 28 ? 'tw-gap-1.5' : 'tw-gap-1')}
          onMouseLeave={() => setHover(null)}
        >
          {Array.from({ length: max }, (_, i) => {
            const position = i + 1;
            const fill = M.iconFill(position, shown);
            return (
              <span
                key={position}
                ref={(el) => (radios.current[i] = el)}
                role="radio"
                aria-checked={Math.ceil(value) === position}
                aria-label={labels[i] || `${position} of ${max}`}
                tabIndex={interactive && position === focusable ? 0 : -1}
                onKeyDown={onKeyDown}
                onMouseMove={interactive ? (e) => setHover(pointAt(e, position)) : undefined}
                onClick={
                  interactive
                    ? (e) => {
                        const next = pointAt(e, position);
                        setHover(null);
                        setTo(next === value && properties.allowClear !== false ? 0 : next);
                      }
                    : undefined
                }
                className={cn(
                  'tw-relative tw-inline-flex tw-shrink-0 tw-rounded-ui2-sm tw-outline-none tw-transition-transform focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring focus-visible:tw-ring-offset-2',
                  interactive && 'tw-cursor-pointer hover:tw-scale-110'
                )}
                style={{ width: size, height: size }}
              >
                <Icon
                  className={cn('tw-absolute tw-inset-0', fill === 'full' ? FILLED[kind] : EMPTY)}
                  style={{ width: size, height: size }}
                  strokeWidth={1.5}
                />
                {fill === 'half' ? (
                  <span className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-1/2 tw-overflow-hidden">
                    <Icon
                      className={cn('tw-absolute tw-left-0 tw-top-0', FILLED[kind])}
                      style={{ width: size, height: size }}
                      strokeWidth={1.5}
                    />
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
        {properties.showValue === true && valueText ? (
          <span className="tw-text-ui2-sm tw-tabular-nums tw-text-[color:var(--lk-value,var(--sc-muted-foreground))]">
            {valueText}
          </span>
        ) : null}
      </div>
    </FormField>
  );
};

export default withControlState(ShadRating);
