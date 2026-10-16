import React, { useEffect, useRef, useState } from 'react';
import { Minus } from 'lucide-react';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useAutoHeight, useExposed, useLatest, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { EDGE, text, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- OTP input -----------------------------------------------------------------------------------------------------

const SLOT_SIZE = 'tw-h-[var(--lk-slot,2.25rem)] tw-w-[var(--lk-slot,2.25rem)]';

export const SLOT =
  'tw-relative tw-flex tw-items-center tw-justify-center tw-text-[length:calc(var(--lk-slot,2.25rem)*0.42)] tw-bg-[color:var(--lk-bg,transparent)] tw-text-[color:var(--lk-fg,var(--sc-foreground))] tw-shadow-sm tw-transition-all';

export const SLOT_RADIUS = 'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const SLOT_JOINED =
  'tw-border-y tw-border-r first:tw-border-l first:tw-rounded-l-[var(--lk-radius,calc(var(--sc-radius)-2px))] last:tw-rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const ShadOtpInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id } = props;
  const length = M.otpLength(properties.length);
  const characters = properties.characters === 'alphanumeric' ? 'alphanumeric' : 'numeric';
  const initial = M.otpSanitize(properties.defaultValue, length, characters);
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const code = value.slice(0, length);
  const isComplete = code.length === length;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const lengthRef = useLatest({ length, characters });
  useExposed(setExposedVariables, properties, {
    value: code,
    isComplete,
    label: text(properties.label),
    clear: async () => setValue(''),
    setFocus: async () => inputRef.current?.focus(),
    setBlur: async () => inputRef.current?.blur(),
    // Fills the boxes as a paste does (the characters that do not fit the kind or the length are dropped).
    setText: async (v: unknown) => setValue(M.otpSanitize(v, lengthRef.current.length, lengthRef.current.characters)),
  });
  const change = (raw: string) => {
    const next = M.otpSanitize(raw, length, characters);
    if (next === code) return;
    setValue(next);
    const done = next.length === length;
    setExposedVariables({ value: next, isComplete: done });
    fireEvent('onChange');
    if (done) fireEvent('onComplete');
  };
  const check = useValidation(
    withRule(props, (v) => (v && String(v).length < length ? `Enter all ${length} characters` : '')),
    code,
    () => change('')
  );
  const disabled = busy(properties);
  const joined = properties.slotStyle !== 'separate';
  const placeholder = text(properties.placeholder).slice(0, 1);
  const active = focused ? Math.min(code.length, length - 1) : -1;
  const half = Math.ceil(length / 2);
  const groups =
    properties.separator === true
      ? [
          [0, half],
          [half, length],
        ]
      : [[0, length]];
  const slot = (i: number) => {
    const char = code[i];
    return (
      <div
        key={i}
        data-slot="otp"
        data-active={i === active || undefined}
        className={cn(
          SLOT,
          SLOT_SIZE,
          EDGE,
          joined ? SLOT_JOINED : cn('tw-border', SLOT_RADIUS),
          i === active && 'tw-z-10 tw-ring-1 tw-ring-ui2-ring'
        )}
      >
        {char ? (
          properties.masked === true ? (
            '•'
          ) : (
            char
          )
        ) : placeholder ? (
          <span className="tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]">{placeholder}</span>
        ) : null}
        {i === active && !char ? (
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            <div className="tw-h-4 tw-w-px tw-animate-pulse tw-bg-[color:var(--lk-fg,var(--sc-foreground))]" />
          </div>
        ) : null}
      </div>
    );
  };
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <div
          className={cn(
            'tw-relative tw-flex tw-w-fit tw-max-w-full tw-items-center tw-gap-2',
            disabled && 'tw-cursor-not-allowed tw-opacity-50'
          )}
        >
          {groups.map(([from, to], g) => (
            <React.Fragment key={g}>
              {g > 0 ? (
                <div
                  role="separator"
                  className="tw-flex tw-items-center tw-text-[color:var(--lk-sep,var(--sc-muted-foreground))]"
                >
                  <Minus className="tw-h-4 tw-w-4" />
                </div>
              ) : null}
              <div className={cn('tw-flex tw-items-center', !joined && 'tw-gap-2')}>
                {Array.from({ length: to - from }, (_, k) => slot(from + k))}
              </div>
            </React.Fragment>
          ))}
          <input
            ref={inputRef}
            id={`shad-${id}`}
            aria-label={text(properties.label) || 'One-time code'}
            aria-invalid={!!check.error || undefined}
            inputMode={characters === 'numeric' ? 'numeric' : 'text'}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-cursor-text tw-border-0 tw-bg-transparent tw-p-0 tw-text-transparent tw-caret-transparent tw-opacity-0 tw-outline-none disabled:tw-cursor-not-allowed"
            value={code}
            disabled={disabled}
            onChange={(e) => change(e.target.value)}
            onFocus={() => {
              setFocused(true);
              setTimeout(() => fireEvent('onFocus'), 0);
            }}
            onBlur={() => {
              setFocused(false);
              check.touch();
              fireEvent('onBlur');
            }}
            onSelect={(e) => {
              // The caret stays at the end (select-all is kept, so a paste replaces the code).
              const el = e.currentTarget;
              const end = el.value.length;
              const all = el.selectionStart === 0 && el.selectionEnd === end;
              if (!all && (el.selectionStart !== end || el.selectionEnd !== end)) el.setSelectionRange(end, end);
            }}
          />
        </div>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadOtpInput);
