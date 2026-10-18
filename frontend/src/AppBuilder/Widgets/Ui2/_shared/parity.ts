import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import isEqual from 'lodash/isEqual';
import type { FocusEvent, RefObject } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ToolJet UI 2.0: what the pack widgets share to match the native widgets' events and actions.

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
  // An override ends once its property moves off the value it replaced (a binding updates, an inspector edit), as the
  // native setters do: the property coming back to that value later shows the property, not the old override.
  useEffect(() => {
    setOver((o) => {
      const ended = Object.keys(o).filter((k) => !isEqual(properties?.[k] ?? null, o[k].base));
      if (!ended.length) return o;
      const next = { ...o };
      ended.forEach((k) => delete next[k]);
      return next;
    });
  }, [properties]);
  const effective = useMemo(() => {
    const keys = Object.keys(over).filter((k) => isEqual(properties?.[k] ?? null, over[k].base));
    if (!keys.length) return properties;
    return { ...properties, ...Object.fromEntries(keys.map((k) => [k, over[k].value])) };
  }, [properties, over]);
  return [effective, override];
};

/** The part of the store's events slice useHasEvent reads. */
interface EventsState {
  eventsSlice?: {
    module?: Record<string, { events?: { sourceId?: string; event?: { eventId?: string; disabled?: boolean } }[] }>;
  };
}

/** Whether the app wires `eventId` on this widget (a pointer cursor then shows it is clickable). Read from the
 *  widget's own module: component ids are local to a module, so another module's handler on the same id is not this
 *  widget's. */
export const useHasEvent = (id: string | undefined, eventId: string): boolean => {
  const moduleId = useModuleId();
  return useStore((state: EventsState) => {
    const events = state?.eventsSlice?.module?.[moduleId]?.events;
    if (!id || !Array.isArray(events)) return false;
    return events.some((e) => e?.sourceId === id && e?.event?.eventId === eventId && !e?.event?.disabled);
  });
};

/** A picker's popup, owned by the picker: open only while the picker takes choices (not disabled, not loading,
 *  visible), and closed for good when it stops, so a popup left open cannot change a control the app turned off.
 *  `blocked` is for the picker's choice handlers too: a choice can arrive before the closed popup has rendered. */
export interface PickerPopup {
  open: boolean;
  /** Read when a choice arrives: the picker's own state, and the panels around it (see ownerTakesNoInput). */
  readonly blocked: boolean;
  setOpen: (next: boolean) => void;
  /** setBlur: takes focus away from the control and its open popup, and closes the popup without handing focus back
   *  to the trigger (blurring only the trigger did nothing while focus was in the popup). */
  blurAway: (trigger?: HTMLElement | null) => void;
  /** Spread on the popup content (Radix onCloseAutoFocus): after blurAway, focus stays away. */
  onCloseAutoFocus: (e: Event) => void;
}

/** Whether an element sits in a panel that takes no input now: an inert, aria-disabled or hidden ancestor (a disabled
 *  or inactive tab's panel, a hidden container), a disabled fieldset (a disabled Form), or one not displayed. Read at
 *  the moment of a choice, since hiding a panel does not re-render what is in it. */
export const ownerTakesNoInput = (el: Element | null | undefined): boolean => {
  if (!el || typeof window === 'undefined') return false;
  if (el.closest('[inert], [aria-disabled="true"], fieldset[disabled], [hidden]')) return true;
  for (let node: Element | null = el; node; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
  }
  return false;
};

/** `anchor` is the picker's trigger (or field): its panels are checked when a choice arrives, since the popup itself
 *  is portalled outside them. */
export const usePickerPopup = (properties: Resolved, anchor?: RefObject<Element>): PickerPopup => {
  const own = !!properties?.disabledState || !!properties?.loadingState || properties?.visibility === false;
  const blocked = own;
  const [open, setOpenState] = useState(false);
  useEffect(() => {
    if (blocked) setOpenState(false);
  }, [blocked]);
  // While open, the panels around the trigger are watched: a tab switched away, disabled or set loading (its panel
  // hidden, inert or aria-disabled) closes the popup, which is portalled outside that panel and would stay open.
  useEffect(() => {
    const el = anchor?.current;
    if (!open || !el || typeof MutationObserver === 'undefined') return undefined;
    const check = () => {
      if (ownerTakesNoInput(el)) setOpenState(false);
    };
    const observer = new MutationObserver(check);
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['hidden', 'inert', 'aria-disabled', 'style', 'disabled'],
      });
    }
    check();
    return () => observer.disconnect();
  }, [open, anchor]);
  const leaving = useRef(false);
  return {
    open: open && !blocked,
    // A getter, so a guard reads it when the choice arrives: a panel disabled or hidden after the popup opened counts.
    get blocked() {
      return own || ownerTakesNoInput(anchor?.current);
    },
    setOpen: (next: boolean) => setOpenState(next && !blocked),
    blurAway: (trigger) => {
      leaving.current = open;
      const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      active?.blur?.();
      trigger?.blur();
      setOpenState(false);
    },
    onCloseAutoFocus: (e) => {
      if (!leaving.current) return;
      leaving.current = false;
      e.preventDefault();
    },
  };
};

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
    focusTimer: ReturnType<typeof setTimeout> | undefined;
    trigger?: HTMLElement | null;
  }>({ inside: false, open: false, timer: undefined, focusTimer: undefined });
  // An unmounted widget fires nothing: drop a pending focus or blur.
  useEffect(() => {
    const s = state.current;
    return () => {
      clearTimeout(s.timer);
      clearTimeout(s.focusTimer);
    };
  }, []);
  const focused = () => {
    state.current.inside = true;
    state.current.focusTimer = setTimeout(() => fireEvent('onFocus'), 0);
  };
  const leave = (inTransit = true) => {
    clearTimeout(state.current.timer);
    state.current.timer = setTimeout(() => {
      const s = state.current;
      if (s.open || !s.inside) return;
      const el = typeof document !== 'undefined' ? document.activeElement : null;
      if (el && s.trigger && (el === s.trigger || s.trigger.contains?.(el))) return;
      // Focus in transit: a popup that has just closed hands focus back to its trigger a moment later (Radix restores
      // it in a timer of its own), so focus on nothing is looked at once more before it counts as leaving. Escape fired
      // onBlur and then onFocus though focus never left the control.
      if (inTransit && (!el || el === document.body)) return leave(false);
      s.inside = false;
      fireEvent('onBlur');
    }, 0);
  };
  return {
    handlers: {
      onFocus: (e?: FocusEvent<HTMLElement>) => {
        state.current.trigger = e?.currentTarget;
        clearTimeout(state.current.timer);
        if (!state.current.inside) focused();
      },
      onBlur: () => leave(),
    },
    opened: (isOpen: boolean) => {
      state.current.open = !!isOpen;
      if (isOpen) {
        clearTimeout(state.current.timer);
        if (!state.current.inside) focused();
      } else leave();
    },
  };
};
