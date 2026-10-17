import React, { useRef } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { FormField, controlAria, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useAutoHeight, useExposed, useLatest, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Truncate, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { AFFIX, EDGE, Group, INNER, numberTextProps, useNumberBox } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// Stepper buttons attached to the box.
export const STEP =
  'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-p-0 tw-bg-[color:var(--lk-step-bg,transparent)] tw-text-[color:var(--lk-step-fg,var(--sc-muted-foreground))] tw-transition-colors hover:tw-bg-[color:var(--lk-step-hover,var(--sc-accent))] hover:tw-text-[color:var(--lk-step-fg,var(--sc-accent-foreground))] disabled:tw-pointer-events-none disabled:tw-opacity-50';

// ---- Number input --------------------------------------------------------------------------------------------------

export const ShadNumberInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, validation, setExposedVariables, fireEvent } = props;
  const decimals = M.clampInt(properties.decimalPlaces, 0, 10, 2);
  const round = (n: unknown) => M.roundTo(n, decimals);
  const initial = round(M.parseNumber(properties.defaultValue));
  const box = useNumberBox(props, {
    initial,
    round,
    parse: (v) => M.parseNumber(v),
    seed: properties.defaultValue,
    precision: decimals,
  });
  const { value, draft, setDraft } = box;
  const latest = useLatest({ round });
  useExposed(setExposedVariables, properties, {
    value,
    setText: async (v: unknown) => {
      box.set(latest.current.round(M.parseNumber(v)));
      check.touch();
    },
    clear: async () => {
      box.set(null);
      check.touch();
    },
  });
  const commit = (next: number | null) => box.commit(next, () => ({}));
  const check = useValidation(props, value, () => box.clearTyped(() => ({})));
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
  const prefix = toText(properties.prefix);
  const suffix = toText(properties.suffix);
  const shown =
    draft !== null ? draft : M.formatNumber(value, { decimals, grouping: properties.thousandSeparator !== false });
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Group disabled={disabled}>
        {steppers && layout === 'split' ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Decrease"
            className={cn(STEP, EDGE, 'tw-w-9 tw-border-r')}
            disabled={disabled || atMin}
            onClick={() => step(-1)}
          >
            <Minus className="tw-h-4 tw-w-4" />
          </button>
        ) : null}
        {prefix ? (
          <span className={cn(AFFIX, 'tw-pl-3')}>
            <Truncate>{prefix}</Truncate>
          </span>
        ) : null}
        <input
          id={fieldIdOf(props)}
          {...numberTextProps(
            setDraft,
            textBox,
            () => (value === null ? '' : String(value)),
            (typed) => commit(round(M.parseNumber(typed)))
          )}
          role="spinbutton"
          aria-valuenow={value ?? undefined}
          aria-valuemin={lo ?? undefined}
          aria-valuemax={hi ?? undefined}
          {...controlAria(props, check.error)}
          className={cn(
            INNER,
            prefix && 'tw-pl-1.5',
            suffix && 'tw-pr-1.5',
            layout === 'split' && !prefix && !suffix && 'tw-text-center'
          )}
          value={shown}
          placeholder={toText(properties.placeholder)}
          disabled={disabled}
          onKeyDown={(e) => {
            if (isEnter(e)) fireEvent('onEnterPressed');
            else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              step(e.key === 'ArrowUp' ? 1 : -1);
            }
          }}
        />
        {suffix ? (
          <span className={cn(AFFIX, 'tw-pr-3')}>
            <Truncate>{suffix}</Truncate>
          </span>
        ) : null}
        {steppers && layout === 'split' ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Increase"
            className={cn(STEP, EDGE, 'tw-w-9 tw-border-l')}
            disabled={disabled || atMax}
            onClick={() => step(1)}
          >
            <Plus className="tw-h-4 tw-w-4" />
          </button>
        ) : null}
        {steppers && layout === 'stacked' ? (
          <div className={cn('tw-flex tw-w-7 tw-shrink-0 tw-flex-col tw-border-l', EDGE)}>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Increase"
              className={cn(STEP, 'tw-h-1/2 tw-w-full')}
              disabled={disabled || atMax}
              onClick={() => step(1)}
            >
              <ChevronUp className="tw-h-3.5 tw-w-3.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Decrease"
              className={cn(STEP, EDGE, 'tw-h-1/2 tw-w-full tw-border-t')}
              disabled={disabled || atMin}
              onClick={() => step(-1)}
            >
              <ChevronDown className="tw-h-3.5 tw-w-3.5" />
            </button>
          </div>
        ) : null}
      </Group>
    </FormField>
  );
};

export default withControlState(ShadNumberInput);
