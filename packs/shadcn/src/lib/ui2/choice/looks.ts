import React, { useEffect, useRef, type CSSProperties } from 'react';

// UI 2.0's style variables (Ui2/_shared/looks) for the choice components: each style, when set, becomes a CSS variable
// on the component's root and on its popup (which renders in the separate popup layer). ui2-choice.css reads them with
// the pack theme as the fallback. --ui-* ones are the pack's own (ui.css), so the shared classes follow them too.

// ui.css's fallbacks for ToolJet theme tokens: the sandboxed iframe runtime has no --cc-* variables (as themeVars).
const FALLBACKS: Record<string, string> = {
  '--cc-primary-brand': '#4368e3',
  '--cc-primary-text': '#1b1f24',
  '--cc-surface1-surface': '#ffffff',
  '--cc-surface2-surface': '#f1f3f5',
  '--cc-placeholder-text': '#6a727c',
  '--cc-default-border': '#d7dbdf',
  '--cc-error-systemStatus': '#d72d39',
  '--cc-success-systemStatus': '#1e823b',
};

const withFallback = (value: string) =>
  value.replace(/var\((--cc-[\w-]+)\)/g, (match, name: string) => (FALLBACKS[name] ? `var(${name}, ${FALLBACKS[name]})` : match));

export const isSet = (v: unknown): v is string | number => v !== undefined && v !== null && v !== '';

const PX_VARS = new Set(['--ui-radius', '--lk-cell']);

/** CSS variables from { '--var': style value }: unset styles are left out. A radius or size takes a number of px. */
export const lookVars = (map: Record<string, unknown>): CSSProperties => {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(map)) {
    if (!isSet(value)) continue;
    if (PX_VARS.has(name)) {
      const n = Number(value);
      if (Number.isFinite(n)) vars[name] = `${n}px`;
      continue;
    }
    const css = withFallback(String(value));
    vars[name] = css;
    // The focus ring follows the accent, as themeVars derives it.
    if (name === '--ui-primary') vars['--ui-ring'] = `color-mix(in srgb, ${css} 35%, transparent)`;
  }
  return vars as CSSProperties;
};

/** The form field styles UI 2.0's Select, Multiselect, Combobox and pickers share. */
export const fieldVars = (s: Record<string, unknown>): Record<string, unknown> => ({
  '--lk-label': s.labelColor,
  '--lk-help': s.helpTextColor,
  '--lk-bg': s.backgroundColor,
  '--lk-fg': s.textColor,
  '--lk-placeholder': s.placeholderColor,
  '--lk-border': s.borderColor,
  '--ui-primary': s.accentColor,
  '--ui-destructive': s.errorColor,
  '--ui-radius': s.borderRadius,
});

/** The date and time pickers' styles: the field's, the trigger icon's and the popover's. */
export const pickerVars = (s: Record<string, unknown>): Record<string, unknown> => ({
  ...fieldVars(s),
  '--lk-icon': s.iconColor,
  '--lk-menu-bg': s.popoverBackgroundColor,
  '--lk-menu-fg': s.popoverTextColor,
  '--lk-hl': s.hoverColor,
  '--ui-primary-fg': s.selectedTextColor,
});

/** onFocus once when focus or the popup enters the control, onBlur once when both have left it (UI 2.0's
 *  useFocusEvents). `touch` marks the field for validation on the way out. */
export const useFocusEvents = (onFocus: () => void, onBlur: () => void, touch?: () => void) => {
  const inside = useRef(false);
  const open = useRef(false);
  const enter = () => {
    if (inside.current) return;
    inside.current = true;
    onFocus();
  };
  const leave = () => {
    if (!inside.current) return;
    inside.current = false;
    touch?.();
    onBlur();
  };
  return {
    handlers: {
      onFocus: enter,
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        const el = e.currentTarget;
        // Focus moves into the popup (another shadow root) on open: wait for it to land before deciding.
        setTimeout(() => {
          if (open.current) return;
          const root = el.getRootNode() as Document | ShadowRoot;
          if (root.activeElement === el || el.contains(root.activeElement)) return;
          leave();
        }, 0);
      },
    },
    opened: (next: boolean) => {
      open.current = next;
      if (next) enter();
    },
    leave,
  };
};

/** Drops selected keys whose option was there and is gone, so a removed choice does not come back selected when an option
 *  of that value reappears. A key never seen stays (a default whose options are still loading); with `keep` (server-side
 *  search) nothing is dropped. */
export const useDropRemovedChoices = (optionKeys: string[], selected: string[], drop: (gone: Set<string>) => void, keep: boolean) => {
  const seen = useRef<Set<string>>(new Set());
  const latest = useRef({ selected, drop, keep });
  latest.current = { selected, drop, keep };
  // A lossless signature: an "All" option's key ('\u0000empty', options.ts) holds the character a joined list would
  // split on, so it was never recorded as seen, never dropped, and came back selected when it reappeared (SP-21).
  const signature = JSON.stringify(optionKeys);
  useEffect(() => {
    const present = new Set(JSON.parse(signature) as string[]);
    if (!present.size) return;
    const { selected: keys, drop: dropKeys, keep: kept } = latest.current;
    if (!kept) {
      const gone = new Set(keys.filter((k) => seen.current.has(k) && !present.has(k)));
      if (gone.size) dropKeys(gone);
    }
    seen.current = present;
  }, [signature]);
};

/** A value that keeps its reference while its content stays the same (bound arrays are rebuilt every render). */
export const useStable = <T>(value: T): T => {
  const ref = useRef(value);
  let same = ref.current === value;
  if (!same) {
    try {
      same = JSON.stringify(ref.current) === JSON.stringify(value);
    } catch {
      same = false;
    }
  }
  if (!same) ref.current = value;
  return ref.current;
};

/** Runs `reset` when `value` changes (by content), not on mount: a new default value starts the selection again. */
export const useResetOn = (value: unknown, reset: () => void) => {
  const stable = useStable(value);
  const first = useRef(true);
  const latest = useRef(reset);
  latest.current = reset;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    latest.current();
  }, [stable]);
};
