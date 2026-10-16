import React, { useRef } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Truncate, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { AFFIX, EDGE, Group, INNER, text, useLatest, useNumberBox } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// Stepper buttons attached to the box.
export const STEP =
  'flex shrink-0 items-center justify-center p-0 bg-[color:var(--lk-step-bg,transparent)] text-[color:var(--lk-step-fg,var(--sc-muted-foreground))] transition-colors hover:bg-[color:var(--lk-step-hover,var(--sc-accent))] hover:text-[color:var(--lk-step-fg,var(--sc-accent-foreground))] disabled:pointer-events-none disabled:opacity-50';

// ---- Number input --------------------------------------------------------------------------------------------------

export const ShadNumberInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, validation, setExposedVariables, fireEvent, id } = props;
  const decimals = M.clampInt(properties.decimalPlaces, 0, 10, 2);
  const round = (n: unknown) => M.roundTo(n, decimals);
  const initial = round(M.parseNumber(properties.defaultValue));
  const box = useNumberBox(props, { initial, round, parse: (v) => M.parseNumber(v) });
  const { value, draft, setDraft } = box;
  const latest = useLatest({ round });
  useExposed(setExposedVariables, properties, {
    value,
    setText: async (v: unknown) => box.set(latest.current.round(M.parseNumber(v))),
    clear: async () => box.set(null),
  });
  const commit = (next: number | null) => box.commit(next, () => ({}));
  const check = useValidation(props, value, () => commit(null));
  const textBox = useTextBox(props, check.touch);
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const lo = M.parseNumber(validation?.minValue);
  const hi = M.parseNumber(validation?.maxValue);
  const step = (dir: number) => {
    if (disabled) return;
    const next = M.stepValue(box.valueRef.current, properties.step, dir, { min: lo, max: hi, decimals });
    if (draft !== null) setDraft(next === null ? '' : String(next));
    commit(next);
  };
  const layout = ['split', 'stacked', 'none'].includes(properties.stepper) ? properties.stepper : 'split';
  const steppers = layout !== 'none' && !loading;
  const atMin = lo !== null && value !== null && value <= lo;
  const atMax = hi !== null && value !== null && value >= hi;
  const prefix = text(properties.prefix);
  const suffix = text(properties.suffix);
  const shown =
    draft !== null ? draft : M.formatNumber(value, { decimals, grouping: properties.thousandSeparator !== false });
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Group disabled={disabled}>
          {steppers && layout === 'split' ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Decrease"
              className={cn(STEP, EDGE, 'w-9 border-r')}
              disabled={disabled || atMin}
              onClick={() => step(-1)}
            >
              <Minus className="h-4 w-4" />
            </button>
          ) : null}
          {prefix ? (
            <span className={cn(AFFIX, 'pl-3')}>
              <Truncate>{prefix}</Truncate>
            </span>
          ) : null}
          <input
            ref={textBox.ref}
            id={`shad-${id}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            role="spinbutton"
            aria-valuenow={value ?? undefined}
            aria-valuemin={lo ?? undefined}
            aria-valuemax={hi ?? undefined}
            aria-invalid={!!check.error || undefined}
            className={cn(
              INNER,
              prefix && 'pl-1.5',
              suffix && 'pr-1.5',
              layout === 'split' && !prefix && !suffix && 'text-center'
            )}
            value={shown}
            placeholder={text(properties.placeholder)}
            disabled={disabled}
            onFocus={() => {
              setDraft(value === null ? '' : String(value));
              textBox.onFocus();
            }}
            onBlur={() => {
              setDraft(null);
              textBox.onBlur();
            }}
            onChange={(e) => {
              const typed = M.numericText(e.target.value);
              setDraft(typed);
              commit(round(M.parseNumber(typed)));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fireEvent('onEnterPressed');
              else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                step(e.key === 'ArrowUp' ? 1 : -1);
              }
            }}
          />
          {suffix ? (
            <span className={cn(AFFIX, 'pr-3')}>
              <Truncate>{suffix}</Truncate>
            </span>
          ) : null}
          {steppers && layout === 'split' ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Increase"
              className={cn(STEP, EDGE, 'w-9 border-l')}
              disabled={disabled || atMax}
              onClick={() => step(1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
          {steppers && layout === 'stacked' ? (
            <div className={cn('flex w-7 shrink-0 flex-col border-l', EDGE)}>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Increase"
                className={cn(STEP, 'h-1/2 w-full')}
                disabled={disabled || atMax}
                onClick={() => step(1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Decrease"
                className={cn(STEP, EDGE, 'h-1/2 w-full border-t')}
                disabled={disabled || atMin}
                onClick={() => step(-1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </Group>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadNumberInput);
