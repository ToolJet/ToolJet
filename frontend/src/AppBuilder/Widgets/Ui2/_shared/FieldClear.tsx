// ToolJet UI 2.0: the x that empties a field. One for every field that has it: a search box's own, and Show clear button
// (the native inputs' and pickers' showClearBtn, off by default) on the Input, Number, Currency and Phone inputs, the
// Date, Date and time and Time pickers and the Color picker.
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import type { ReactNode } from 'react';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** The x: a 20px round button named Clear, a tab stop, in the placeholder's colour and darker on hover. */
export const ClearX = ({ onClear, className }: { onClear: () => void; className?: string }) => (
  <button
    type="button"
    aria-label="Clear"
    className={cn(
      'tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))] hover:tw-text-[color:var(--lk-fg,var(--sc-foreground))]',
      className
    )}
    onClick={onClear}
  >
    <X className="tw-h-4 tw-w-4" aria-hidden />
  </button>
);

/** Whether Show clear button's x shows: the toggle is on, the field holds a value, and it takes input (not disabled or
 *  loading). */
export const showsClear = (properties: Resolved, filled: boolean): boolean =>
  properties.showClearBtn === true && filled && !busy(properties);

/** Room at the right of a control for the x over it. */
export const CLEAR_ROOM = 'tw-pr-8';

/** A control with the x over its right end (the Input's box, a picker's button), while `show`. With `enabled` false the
 *  control is drawn bare; the wrapper stays while it is true, so the x coming and going does not remount the control
 *  (a focused box kept its focus). */
export const WithClear = ({
  enabled,
  show,
  onClear,
  children,
}: {
  enabled: boolean;
  show: boolean;
  onClear: () => void;
  children: ReactNode;
}) =>
  enabled ? (
    <div className="tw-relative tw-w-full">
      {children}
      {show ? <ClearX className="tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2" onClear={onClear} /> : null}
    </div>
  ) : (
    <>{children}</>
  );

/** The x as a segment of a box made of parts (the Number, Currency and Phone inputs' Group), before its end. */
export const GroupClear = ({ show, onClear }: { show: boolean; onClear: () => void }) =>
  show ? (
    <span className="tw-flex tw-shrink-0 tw-items-center tw-px-2">
      <ClearX onClear={onClear} />
    </span>
  ) : null;
