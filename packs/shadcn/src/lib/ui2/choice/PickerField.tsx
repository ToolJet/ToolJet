import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../../cn';
import { fieldAria } from '../../Field';
import { ClearX, Spinner } from './parts';

// The trigger of UI 2.0's date and time pickers: an outline button with the picker's icon before the value (or the
// placeholder), and Show clear button's x over its right end while it holds a value.
export interface PickerTriggerProps {
  icon: React.ReactNode;
  text: string;
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  clearable: boolean;
  onClear: () => void;
  fieldId?: string;
  error?: string;
  required?: boolean;
  hasNote: boolean;
  label?: string;
  focusHandlers: Record<string, unknown>;
}

export const PickerTrigger = React.forwardRef<HTMLButtonElement, PickerTriggerProps>(
  ({ icon, text, placeholder, disabled, loading, clearable, onClear, fieldId, error, required, hasNote, label, focusHandlers }, ref) => (
    <div className="uc-wrap">
      <Popover.Trigger
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={label ? undefined : placeholder || undefined}
        {...fieldAria(fieldId, error, required, hasNote)}
        {...focusHandlers}
        className={cn('ui-select-trigger uc-picker-trigger', clearable && 'has-clear', !text && 'ui-placeholder', loading && 'uc-is-loading')}
      >
        {loading ? <Spinner /> : icon}
        <span className="uc-truncate">{text || placeholder}</span>
      </Popover.Trigger>
      {clearable && !loading ? <ClearX className="uc-clear-at" onClear={onClear} /> : null}
    </div>
  )
);
PickerTrigger.displayName = 'PickerTrigger';
