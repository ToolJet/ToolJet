import { useCallback, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { stringify } from '../packJson';

// ToolJet UI 2.0 pack: what the pack widgets share to match the native widgets' events and actions (the
// parity table is in Widgets/Shadcn/EVENT_PARITY.md).

/** Properties an action can change at run time (setText, setImageURL, setMinDate): the action's value holds until the
 *  property itself changes (a binding updates, an inspector edit), the way the native widgets' setters work. Returns
 *  the effective properties and `override(key, value)`; `override(key)` with no value drops the override. */
export const useOverrides = (properties) => {
  const [over, setOver] = useState({});
  const latest = useRef(properties);
  latest.current = properties;
  const override = useCallback((key, ...value) => {
    const base = stringify(latest.current?.[key] ?? null);
    setOver((o) => {
      const next = { ...o };
      if (value.length) next[key] = { value: value[0], base };
      else delete next[key];
      return next;
    });
  }, []);
  const effective = useMemo(() => {
    const keys = Object.keys(over).filter((k) => stringify(properties?.[k] ?? null) === over[k].base);
    if (!keys.length) return properties;
    return { ...properties, ...Object.fromEntries(keys.map((k) => [k, over[k].value])) };
  }, [properties, over]);
  return [effective, override];
};

/** Whether the app wires `eventId` on this widget (a pointer cursor then shows it is clickable). */
export const useHasEvent = (id, eventId) =>
  useStore((state) => {
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
export const truthy = (v) => !(v === false || v === 'false' || v === 0 || v === '0' || v === null || v === undefined);

/** Text from an action's argument: '' for nothing or an object, so a junk argument never renders [object Object]. */
export const textArg = (v) => (v === undefined || v === null || typeof v === 'object' ? '' : String(v));

/** onFocus and onBlur for a control that opens a list or popover (a select, a date picker): onFocus when focus comes
 *  to the control from outside, onBlur once it leaves the control and its open list, not when focus moves into the
 *  list and back. Spread `handlers` on the trigger and call `opened(isOpen)` from the popup's open change. */
export const useFocusEvents = (fireEvent) => {
  const state = useRef({ inside: false, open: false, timer: null });
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
      onFocus: (e) => {
        state.current.trigger = e?.currentTarget;
        clearTimeout(state.current.timer);
        if (state.current.inside) return;
        state.current.inside = true;
        setTimeout(() => fireEvent('onFocus'), 0);
      },
      onBlur: leave,
    },
    opened: (isOpen) => {
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
