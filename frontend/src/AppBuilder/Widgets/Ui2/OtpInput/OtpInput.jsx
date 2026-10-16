import React, { useEffect, useRef, useState } from 'react';
import { Minus } from 'lucide-react';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { EDGE, text, useLatest, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';

// ---- OTP input -----------------------------------------------------------------------------------------------------

const SLOT_SIZE = 'h-[var(--lk-slot,2.25rem)] w-[var(--lk-slot,2.25rem)]';

export const SLOT =
  'relative flex items-center justify-center text-[length:calc(var(--lk-slot,2.25rem)*0.42)] bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))] shadow-sm transition-all';

export const SLOT_RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const SLOT_JOINED =
  'border-y border-r first:border-l first:rounded-l-[var(--lk-radius,calc(var(--sc-radius)-2px))] last:rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const ShadOtpInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id } = props;
  const length = M.otpLength(properties.length);
  const characters = properties.characters === 'alphanumeric' ? 'alphanumeric' : 'numeric';
  const initial = M.otpSanitize(properties.defaultValue, length, characters);
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const code = value.slice(0, length);
  const isComplete = code.length === length;
  const inputRef = useRef(null);
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
    setText: async (v) => setValue(M.otpSanitize(v, lengthRef.current.length, lengthRef.current.characters)),
  });
  const change = (raw) => {
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
  const slot = (i) => {
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
          joined ? SLOT_JOINED : cn('border', SLOT_RADIUS),
          i === active && 'z-10 ring-1 ring-ring'
        )}
      >
        {char ? (
          properties.masked === true ? (
            '•'
          ) : (
            char
          )
        ) : placeholder ? (
          <span className="text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]">{placeholder}</span>
        ) : null}
        {i === active && !char ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-pulse bg-[color:var(--lk-fg,var(--sc-foreground))]" />
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
            'relative flex w-fit max-w-full items-center gap-2',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {groups.map(([from, to], g) => (
            <React.Fragment key={g}>
              {g > 0 ? (
                <div
                  role="separator"
                  className="flex items-center text-[color:var(--lk-sep,var(--sc-muted-foreground))]"
                >
                  <Minus className="h-4 w-4" />
                </div>
              ) : null}
              <div className={cn('flex items-center', !joined && 'gap-2')}>
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
            className="absolute inset-0 h-full w-full cursor-text border-0 bg-transparent p-0 text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
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
              const el = e.target;
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
