import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CONTROL } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from './inputsModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// shadcn/ui pack (experiment): inputs widgets: number, password, phone, currency, OTP, time and date-time. Pure logic
// lives in inputsModel.js; configs in WidgetManager/widgets/shad*.js; style variables in looks/inputs.js.

// ---- Building blocks -----------------------------------------------------------------------------------------------

export const useLatest = (value) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

/** The widget's props with an extra rule checked before the Validation section's (a malformed phone number, a time
 *  outside its bounds): useValidation then exposes isValid and shows the message the native way. */
export const withRule = (props, rule) => ({
  ...props,
  validate: (value) => {
    const problem = rule(value);
    if (problem) return { isValid: false, validationError: problem };
    return typeof props.validate === 'function' ? props.validate(value) : { isValid: true };
  },
});

// A text box made of parts (sign, input, buttons) in one bordered box: ShadInput's size and focus ring, CONTROL's
// colours (background, text, border, radius, error border).
const GROUP =
  'flex h-9 w-full items-stretch overflow-hidden border text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring';
export const INNER =
  'h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3 py-1 text-sm text-[color:var(--lk-fg,var(--sc-foreground))] shadow-none outline-none placeholder:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))] focus:outline-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed';
export const EDGE = 'border-[color:var(--lk-invalid,var(--lk-border,var(--sc-input)))]';
// Text inside the box beside the value: a prefix, suffix or currency sign.
// It takes at most 40% of the box and ends in an ellipsis: a long one kept its full width and pushed the stepper
// button out of the box.
export const AFFIX =
  'flex min-w-0 max-w-[40%] select-none items-center whitespace-nowrap text-sm text-[color:var(--lk-affix,var(--sc-muted-foreground))]';

// A segment at the start of the box (the country or currency picker).
export const ADDON =
  'flex shrink-0 items-center gap-1.5 border-0 border-r px-3 text-sm bg-[color:var(--lk-addon-bg,transparent)] text-[color:var(--lk-addon-fg,var(--lk-fg,var(--sc-foreground)))] shadow-none transition-colors focus:outline-none focus-visible:bg-[color:var(--lk-addon-hover,var(--sc-accent))] disabled:cursor-not-allowed';
export const ADDON_HOVER = 'hover:bg-[color:var(--lk-addon-hover,var(--sc-accent))]';
export const ICON = 'h-4 w-4 shrink-0 text-[color:var(--lk-icon,var(--sc-muted-foreground))]';

export const Group = ({ disabled, className, children }) => (
  <div className={cn(GROUP, CONTROL, disabled && 'cursor-not-allowed opacity-50', className)}>{children}</div>
);


export const text = (v) => (v === undefined || v === null || typeof v === 'object' ? '' : String(v));

/** A time (minutes since midnight) from an action's argument, read with the format given when there is one ('HH:mm',
 *  'hh:mm A'), else any time text; null when it is not a time. */
export const parseTimeArg = (v, format) => {
  if (typeof v === 'string' && typeof format === 'string' && format.trim()) {
    const d = dayjs(v.trim(), M.toDayjsFormat(format), true);
    if (d.isValid()) return d.hour() * 60 + d.minute();
  }
  return M.parseTime(v);
};

/** A number text box's value and the text shown while it is edited (formatted again on blur). `parse` turns typed
 *  text into a number; `round` keeps it to the decimal places. */
export const useNumberBox = (props, { initial, round, parse }) => {
  const { setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    setValue(initial);
    setDraft(null);
  }, [initial]);
  const valueRef = useLatest(value);
  const commit = (next, extra = {}) => {
    if (next === valueRef.current) return;
    valueRef.current = next;
    setValue(next);
    setExposedVariables({ value: next, ...extra(next) });
    fireEvent('onChange');
  };
  const set = (v) => {
    setDraft(null);
    setValue(round(typeof v === 'number' ? v : parse(v)));
  };
  return { value, valueRef, draft, setDraft, commit, set };
};

export const TRIGGER = 'w-full justify-start gap-2 px-3 text-left font-normal';

export const pad2 = (n) => String(n).padStart(2, '0');
