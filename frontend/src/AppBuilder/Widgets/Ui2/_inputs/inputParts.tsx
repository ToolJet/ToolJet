import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { CONTROL } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from './dateModel';
import { runNow, useLatest, useStable } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { numericText } from './inputsModel';
import type { ChangeEvent, ReactNode } from 'react';
import type { TextBox } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { Exposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ToolJet UI 2.0: inputs widgets: number, password, phone, currency, OTP, time and date-time. Pure logic
// lives in inputsModel.ts, phoneModel.ts and dateModel.ts; configs in WidgetManager/widgets/shad*.js; style variables
// in looks/inputs.ts.

// ---- Building blocks -----------------------------------------------------------------------------------------------

/** The widget's props with an extra rule checked before the Validation section's (a malformed phone number, a time
 *  outside its bounds): useValidation then exposes isValid and shows the message the native way. */
export const withRule = <P extends Pick<WidgetProps, 'validate'>>(props: P, rule: (value: unknown) => string) => ({
  ...props,
  validate: (value: unknown) => {
    const problem = rule(value);
    if (problem) return { isValid: false, validationError: problem };
    return typeof props.validate === 'function' ? props.validate(value) : { isValid: true };
  },
});

// A text box made of parts (sign, input, buttons) in one bordered box: ShadInput's size and focus ring, CONTROL's
// colours (background, text, border, radius, error border).
const GROUP =
  'tw-flex tw-h-9 tw-w-full tw-items-stretch tw-overflow-hidden tw-border tw-text-ui2-sm tw-shadow-sm tw-transition-colors focus-within:tw-ring-1 focus-within:tw-ring-ui2-ring';
export const INNER =
  'tw-h-full tw-w-full tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-px-3 tw-py-1 tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-foreground))] tw-shadow-none tw-outline-none placeholder:tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))] focus:tw-outline-none focus-visible:tw-outline-none focus-visible:tw-ring-0 disabled:tw-cursor-not-allowed';
export const EDGE = 'tw-border-[color:var(--lk-invalid,var(--lk-border,var(--sc-input)))]';
// Text inside the box beside the value: a prefix, suffix or currency sign.
// It takes at most 40% of the box and ends in an ellipsis: a long one kept its full width and pushed the stepper
// button out of the box.
export const AFFIX =
  'tw-flex tw-min-w-0 tw-max-w-[40%] tw-select-none tw-items-center tw-whitespace-nowrap tw-text-ui2-sm tw-text-[color:var(--lk-affix,var(--sc-muted-foreground))]';

// A segment at the start of the box (the country or currency picker).
export const ADDON =
  'tw-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-border-0 tw-border-r tw-px-3 tw-text-ui2-sm tw-bg-[color:var(--lk-addon-bg,transparent)] tw-text-[color:var(--lk-addon-fg,var(--lk-fg,var(--sc-foreground)))] tw-shadow-none tw-transition-colors focus:tw-outline-none focus-visible:tw-bg-[color:var(--lk-addon-hover,var(--sc-accent))] disabled:tw-cursor-not-allowed';
export const ADDON_HOVER = 'hover:tw-bg-[color:var(--lk-addon-hover,var(--sc-accent))]';
export const ICON = 'tw-h-4 tw-w-4 tw-shrink-0 tw-text-[color:var(--lk-icon,var(--sc-muted-foreground))]';

export interface GroupProps {
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Group = ({ disabled, className, children }: GroupProps) => (
  <div className={cn(GROUP, CONTROL, disabled && 'tw-cursor-not-allowed tw-opacity-50', className)}>{children}</div>
);

/** A time (minutes since midnight) from an action's argument, read with the format given when there is one ('HH:mm',
 *  'hh:mm A'), else any time text; null when it is not a time. */
export const parseTimeArg = (v: unknown, format: unknown): number | null => {
  if (typeof v === 'string' && typeof format === 'string' && format.trim()) {
    const d = dayjs(v.trim(), M.toDayjsFormat(format), true);
    if (d.isValid()) return d.hour() * 60 + d.minute();
  }
  return M.parseTime(v);
};

/** A number text box's value and the text shown while it is edited (formatted again on blur). `parse` turns typed
 *  text into a number; `round` keeps it to the decimal places. */
export interface NumberBoxOptions {
  initial: number | null;
  round: (n: number | null) => number | null;
  parse: (text: unknown) => number | null;
  /** The default as authored: a new one starts the box again. A change of the decimal places alone (`precision`)
   *  keeps the number the user entered, rounded to them. */
  seed?: unknown;
  precision?: number;
}

export const useNumberBox = (
  props: Pick<WidgetProps, 'setExposedVariables' | 'fireEvent'>,
  { initial, round, parse, seed, precision }: NumberBoxOptions
) => {
  const { setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState<string | null>(null);
  const start = useLatest({ initial, round });
  const seedKey = useStable(seed === undefined ? initial : seed);
  useEffect(() => {
    setValue(start.current.initial);
    setDraft(null);
  }, [seedKey, start]);
  // New decimal places round the number the user entered; they never bring the default back.
  useEffect(() => {
    setValue((v) => start.current.round(v));
  }, [precision, start]);
  const valueRef = useLatest(value);
  /** Sets the value as the user does; `extra` gives the exposed values that go with it. */
  const commit = (next: number | null, extra: (value: number | null) => Exposed) => {
    if (next === valueRef.current) return;
    runNow(() => {
      valueRef.current = next;
      setValue(next);
      setExposedVariables({ value: next, ...extra(next) });
      fireEvent('onChange');
    });
  };
  /** Sets the value from an action, as the native number inputs' setText, setValue and clear do: onChange, every
   *  time. The value is published by the action's flush before the event fires (runNow). */
  const set = (v: unknown) => {
    setDraft(null);
    const next = round(typeof v === 'number' ? v : parse(v));
    valueRef.current = next;
    setValue(next);
    fireEvent('onChange');
  };
  /** Empties the box as a Form's clearForm does: the value, and the text being typed when the box has focus (else the
   *  next digit typed would append to the old text: 42, clear, 1 gave 421). */
  const clearTyped = (extra: (value: number | null) => Exposed) => {
    setDraft((d) => (d === null ? null : ''));
    commit(null, extra);
  };
  return { value, valueRef, draft, setDraft, commit, set, clearTyped };
};

/** A number box's text field, spread on its input: while focused it holds the text as typed (starting from
 *  `editText`), each edit commits what `commitTyped` reads from it, and leaving shows the formatted value again. */
export const numberTextProps = (
  setDraft: (text: string | null) => void,
  textBox: TextBox<HTMLInputElement>,
  editText: () => string,
  commitTyped: (typed: string) => void
) => ({
  ref: textBox.ref,
  type: 'text',
  inputMode: 'decimal' as const,
  autoComplete: 'off',
  onFocus: () => {
    setDraft(editText());
    textBox.onFocus();
  },
  onBlur: () => {
    setDraft(null);
    textBox.onBlur();
  },
  onChange: (e: ChangeEvent<HTMLInputElement>) => {
    const typed = numericText(e.target.value);
    setDraft(typed);
    commitTyped(typed);
  },
});

export const TRIGGER = 'tw-w-full tw-justify-start tw-gap-2 tw-px-3 tw-text-left tw-font-normal';
