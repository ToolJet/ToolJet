import React, { useRef, useState } from 'react';
import { Circle, Heart, Star } from 'lucide-react';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { list, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { isText } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';

// ---- Rating --------------------------------------------------------------------------------------------------------

const RATING_SIZES = { sm: 16, default: 20, lg: 28 };

export const RATING_ICONS = { star: Star, heart: Heart, circle: Circle };

// Filled icons: the filledColor style, else a colour that suits the icon (amber stars, red hearts, primary dots).
export const FILLED = {
  star: 'fill-[color:var(--lk-on,var(--sc-warning))] text-[color:var(--lk-on,var(--sc-warning))]',
  heart: 'fill-[color:var(--lk-on,var(--sc-destructive))] text-[color:var(--lk-on,var(--sc-destructive))]',
  circle: 'fill-[color:var(--lk-on,var(--sc-primary))] text-[color:var(--lk-on,var(--sc-primary-ink))]',
};

export const EMPTY =
  'fill-[color:var(--lk-off,color-mix(in_srgb,var(--sc-muted-foreground)_22%,transparent))] text-[color:var(--lk-off,color-mix(in_srgb,var(--sc-muted-foreground)_22%,transparent))]';

export const ShadRating = (props) => {
  const { properties, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const max = M.clampMax(properties.max);
  const half = properties.allowHalf === true;
  const limits = useRef({ max, half });
  limits.current = { max, half, initial: M.normalizeRating(properties.defaultValue, max, half) };
  const [stored, change] = useValue(props, M.normalizeRating(properties.defaultValue, max, half), (set) => ({
    setValue: async (v) => set(M.normalizeRating(v, limits.current.max, limits.current.half)),
    clear: async () => set(0),
    // The native Star rating's resetValue(): back to the default.
    resetValue: async () => set(limits.current.initial),
  }));
  useExposed(props.setExposedVariables, properties, { label: String(properties.label ?? '') });
  const value = Math.min(Number(stored) || 0, max);
  const check = useValidation(props, M.validationInput(value > 0, value), () => change(0));
  const [hover, setHover] = useState(null);
  const radios = useRef([]);
  const readOnly = properties.readOnly === true;
  const interactive = !readOnly && !busy(properties);
  const shown = interactive && hover !== null ? hover : value;
  const kind = RATING_ICONS[properties.icon] ? properties.icon : 'star';
  const Icon = RATING_ICONS[kind];
  const size = RATING_SIZES[properties.size] || RATING_SIZES.default;
  const labels = list(properties.valueLabels).map((l) => (isText(l) ? String(l) : ''));
  const setTo = (next) => {
    if (next !== value) change(next);
    check.touch();
  };
  const pointAt = (e, position) => {
    const r = e.currentTarget.getBoundingClientRect?.();
    return half && r?.width && e.clientX - r.left < r.width / 2 ? position - 0.5 : position;
  };
  const onKeyDown = (e) => {
    if (!interactive) return;
    let next = null;
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
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <div className="flex items-center gap-2">
          <div
            id={`shad-${id}`}
            role="radiogroup"
            aria-label={isText(properties.label) && properties.label ? String(properties.label) : 'Rating'}
            aria-readonly={readOnly || undefined}
            aria-disabled={busy(properties) || undefined}
            className={cn('inline-flex items-center', size >= 28 ? 'gap-1.5' : 'gap-1')}
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
                    'relative inline-flex shrink-0 rounded-sm outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    interactive && 'cursor-pointer hover:scale-110'
                  )}
                  style={{ width: size, height: size }}
                >
                  <Icon
                    className={cn('absolute inset-0', fill === 'full' ? FILLED[kind] : EMPTY)}
                    style={{ width: size, height: size }}
                    strokeWidth={1.5}
                  />
                  {fill === 'half' ? (
                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <Icon
                        className={cn('absolute left-0 top-0', FILLED[kind])}
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
            <span className="text-sm tabular-nums text-[color:var(--lk-value,var(--sc-muted-foreground))]">
              {valueText}
            </span>
          ) : null}
        </div>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadRating);
