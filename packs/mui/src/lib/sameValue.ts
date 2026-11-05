import { useRef } from 'react';

// The same file in every pack (keep the copies the same).

const empty = (v: unknown) => v === undefined || v === null || v === '';
const instant = (v: unknown): number | null => {
  if (v instanceof Date) return v.getTime();
  // A dayjs or moment value: compared by the instant it holds.
  if (v && typeof v === 'object' && typeof (v as { isValid?: unknown }).isValid === 'function' && typeof (v as { valueOf: () => unknown }).valueOf === 'function') {
    const n = Number((v as { valueOf: () => unknown }).valueOf());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/**
 * Whether a setter's value is the one a component already holds, the way a value reads back: no value at all ('',
 * null, undefined) is one value, NaN is itself, dates by instant, lists and records by content. A value action that
 * would leave the value as it is fires no change event (product decision 2026-10-25, the same in every pack).
 */
export const sameValue = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b) || (empty(a) && empty(b))) return true;
  const ia = instant(a);
  const ib = instant(b);
  if (ia !== null || ib !== null) return ia === ib;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

/**
 * A value setter that skips a value equal to the latest one. Actions run one after another before React renders again,
 * so the rendered value can be a step behind; `latest` follows each set at once and the rendered value whenever the app
 * changes it. `set(next)` writes and returns true only when next differs: the caller fires its change event on true.
 */
export const useValueSetter = <T,>(rendered: T, write: (next: T) => void, equal: (a: T, b: T) => boolean = sameValue) => {
  const latest = useRef(rendered);
  const seen = useRef(rendered);
  if (!Object.is(seen.current, rendered)) {
    seen.current = rendered;
    latest.current = rendered;
  }
  const set = (next: T) => {
    if (equal(latest.current, next)) return false;
    latest.current = next;
    write(next);
    return true;
  };
  return { latest, set };
};
