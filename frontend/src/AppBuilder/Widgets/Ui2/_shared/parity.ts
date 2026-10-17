import { useCallback, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import isEqual from 'lodash/isEqual';
import type { FocusEvent } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ToolJet UI 2.0: what the pack widgets share to match the native widgets' events and actions (the
// parity table is in Widgets/Shadcn/EVENT_PARITY.md).

/** Properties an action can change at run time (setText, setImageURL, setMinDate): the action's value holds until the
 *  property itself changes (a binding updates, an inspector edit), the way the native widgets' setters work. Returns
 *  the effective properties and `override(key, value)`; `override(key)` with no value drops the override. */
/** Sets a property's run-time value (`override(key, value)`), or drops it (`override(key)`). */
export type Override = (key: string, ...value: [] | [unknown]) => void;

export const useOverrides = (properties: Resolved): [Resolved, Override] => {
  const [over, setOver] = useState<Record<string, { value: unknown; base: unknown }>>({});
  const latest = useRef(properties);
  latest.current = properties;
  const override: Override = useCallback((key: string, ...value: [] | [unknown]) => {
    const base = latest.current?.[key] ?? null;
    setOver((o) => {
      const next = { ...o };
      if (value.length) next[key] = { value: value[0], base };
      else delete next[key];
      return next;
    });
  }, []);
  const effective = useMemo(() => {
    const keys = Object.keys(over).filter((k) => isEqual(properties?.[k] ?? null, over[k].base));
    if (!keys.length) return properties;
    return { ...properties, ...Object.fromEntries(keys.map((k) => [k, over[k].value])) };
  }, [properties, over]);
  return [effective, override];
};

/** Whether the app wires `eventId` on this widget (a pointer cursor then shows it is clickable). */
/** The part of the store's events slice useHasEvent reads. */
interface EventsState {
  eventsSlice?: {
    module?: Record<string, { events?: { sourceId?: string; event?: { eventId?: string; disabled?: boolean } }[] }>;
  };
}

export const useHasEvent = (id: string | undefined, eventId: string): boolean =>
  useStore((state: EventsState) => {
    const modules = state?.eventsSlice?.module;
    if (!modules || !id) return false;
    return Object.values(modules).some((m) =>
      (Array.isArray(m?.events) ? m.events : []).some(
        (e) => e?.sourceId === id && e?.event?.eventId === eventId && !e?.event?.disabled
      )
    );
  });

/** A toggle action's argument as a boolean: `{{false}}`, false, 'false', 0 and null are off; anything else is on
 *  (the native setters take the value as given, so a junk value left the widget half disabled). */
export const truthy = (v: unknown): boolean =>
  !(v === false || v === 'false' || v === 0 || v === '0' || v === null || v === undefined);

/** onFocus and onBlur for a control that opens a list or popover (a select, a date picker): onFocus when focus comes
 *  to the control from outside, onBlur once it leaves the control and its open list, not when focus moves into the
 *  list and back. Spread `handlers` on the trigger and call `opened(isOpen)` from the popup's open change. */
export interface FocusEvents {
  /** Spread on the trigger. */
  handlers: { onFocus: (e?: FocusEvent<HTMLElement>) => void; onBlur: () => void };
  /** Call from the popup's open change. */
  opened: (isOpen: boolean) => void;
}

export const useFocusEvents = (fireEvent: WidgetProps['fireEvent']): FocusEvents => {
  const state = useRef<{
    inside: boolean;
    open: boolean;
    timer: ReturnType<typeof setTimeout> | undefined;
    trigger?: HTMLElement | null;
  }>({ inside: false, open: false, timer: undefined });
  const leave = () => {
    clearTimeout(state.current.timer);
    state.current.timer = setTimeout(() => {
      const s = state.current;
      if (s.open || !s.inside) return;
      const el = typeof document !== 'undefined' ? document.activeElement : null;
      if (el && s.trigger && (el === s.trigger || s.trigger.contains?.(el))) return;
      s.inside = false;
      fireEvent('onBlur');
    }, 0);
  };
  return {
    handlers: {
      onFocus: (e?: FocusEvent<HTMLElement>) => {
        state.current.trigger = e?.currentTarget;
        clearTimeout(state.current.timer);
        if (state.current.inside) return;
        state.current.inside = true;
        setTimeout(() => fireEvent('onFocus'), 0);
      },
      onBlur: leave,
    },
    opened: (isOpen: boolean) => {
      state.current.open = !!isOpen;
      if (isOpen) {
        clearTimeout(state.current.timer);
        if (!state.current.inside) {
          state.current.inside = true;
          setTimeout(() => fireEvent('onFocus'), 0);
        }
      } else leave();
    },
  };
};
