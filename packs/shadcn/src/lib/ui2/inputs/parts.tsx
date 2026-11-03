import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../cn';
import { ToolJet } from '@tooljet/custom-component-sdk';

type Validation = ReturnType<typeof ToolJet.useValidation>;

// What the inputs share beyond Field.tsx: a new Default value starting the value again, a widget's own rule (a number
// outside its bounds, a malformed phone number) checked with the host's Validation section, and UI 2.0's clear x.

const isSet = (v: unknown) => !(v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length));

/** Runs `apply` when `seed` (the Default value) changes by content, so a new default starts the field again as UI 2.0's
 *  inputs do, while what the user typed survives every other render. On mount it runs only for a default that is set:
 *  the drop stamps every prop, the hidden `value` included, so an empty default leaves an app's own `value` alone.
 *  `onMount: false` waits for a change (a value derived from what the first render had would be stale there). */
export const useReseed = (seed: unknown, apply: () => void, { onMount = true } = {}) => {
  let key: string;
  try {
    key = JSON.stringify(seed ?? null) ?? '';
  } catch {
    key = String(seed);
  }
  const first = useRef(true);
  const latest = useRef(apply);
  latest.current = apply;
  useEffect(() => {
    const mount = first.current;
    first.current = false;
    if (!mount || (onMount && isSet(seed))) latest.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
};

/** UI 2.0's Minimum and Maximum value check (Ui2/_inputs/inputParts numberBounds): 0 is a bound. */
export const boundsRule = (value: number | null, lo: number | null, hi: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '';
  if (lo !== null && value < lo) return `Minimum value is ${lo}`;
  if (hi !== null && value > hi) return `Maximum value is ${hi}`;
  return '';
};

/** UI 2.0's clear x: a 20px round button named Clear, in the placeholder's colour and darker on hover. */
export const ClearX = ({
  onClear,
  className,
  label = 'Clear',
}: {
  onClear: () => void;
  className?: string;
  label?: string;
}) => (
  <button
    type="button"
    aria-label={label}
    className={cn('ui2-clear', className)}
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => {
      e.stopPropagation();
      onClear();
    }}
  >
    <X size={16} aria-hidden />
  </button>
);

/** Enter, not while an IME composition is open. */
export const isEnter = (e: React.KeyboardEvent) => e.key === 'Enter' && !e.nativeEvent.isComposing;
