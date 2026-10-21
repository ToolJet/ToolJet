import React, { useEffect, useId, useMemo, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { flushSync } from 'react-dom';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { stringify } from './packJson';
import { useSkeletonHold } from './useDynamicHeight';
import type { MutableRefObject, RefObject } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isScalar, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { useSubcontainerContext } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';
import type { ContextSegment } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';

export { stringify };

// The ToolJet side of a UI 2.0 widget (exposed values, actions, auto height, bound lists), with no UI library in it.

/** A widget's exposed values and actions (async functions), by name. */
export type Exposed = Record<string, unknown>;

/** The value, keeping the previous reference while its content is the same. A binding re-evaluates to a new array or
 *  object whenever anything it reads changes, so a dependency on the value itself would rerun work (and effects that
 *  reset state) for an unchanged list. The comparison runs only when a new reference arrives (lodash isEqual, which
 *  also handles a circular value such as a JS query's result). */
export const useStable = <T>(value: T): T => {
  const ref = useRef(value);
  if (!Object.is(ref.current, value) && !isEqual(ref.current, value)) ref.current = value;
  return ref.current;
};

/** A ref that always holds the latest value: for callbacks and effects that read current props without rerunning
 *  when they change. */
/** Whether a selected item that is missing from a list is gone: only when the list has items. An empty list is not a
 *  removal: a query's data is [] while it reruns (queryPanelSlice runQuery), so a widget that dropped a selection whose
 *  item went missing lost it on every save that refreshes its list (a feedback inbox's selected item and its reply
 *  button). While the list is empty nothing is selected; the selection comes back with the item. */
export const missingIsGone = (count: number): boolean => count > 0;

export const useLatest = <T>(value: T): MutableRefObject<T> => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

type Action = (...args: unknown[]) => unknown;

/** The store's exposed-value batch, which runNow opens around an action. */
type ExposedBatchStore = { startExposedValueBatch: () => void; flushExposedValueBatch: () => void };

/** Events fired while an action runs wait here until it has published (runNow). */
let actionDepth = 0;
let deferredEvents: Array<() => void> = [];
/** Above 0 while a widget hook runs a callback from inside an effect (fromEffect), where React cannot flush. */
let effectDepth = 0;

/** Runs `callback` from inside an effect (a Form's clear signal arrives in one): runNow there runs its change without
 *  flushSync, which React refuses inside an effect; its events still wait until the change has run. */
export const fromEffect = (callback: () => void): void => {
  effectDepth += 1;
  try {
    callback();
  } finally {
    effectDepth -= 1;
  }
};

/** Runs an action, or a user's change, so that the state it sets is rendered, and the effects that publish from it
 *  (the value, isValid, every derived exposed value) have run, before the call returns. A query reads them on its next
 *  line (`await components.input1.setText('a'); components.input1.value`), as the native actions publish at once;
 *  without this the value arrived in a later effect and the next line read the old one. The events it fires are held
 *  until then and fired in order, so their handlers read the new values too (isValid, selectedOption), as the native
 *  widgets publish first. Widgets call it in their user handlers (typing, a click); actions get it from useExposed. */
export const runNow = <T>(action: () => T): T => {
  let result = undefined as T;
  // What the action publishes is gathered in one exposed-value batch and settled before its events fire. In a List view
  // row a widget's values are written per row, and outside a batch the store queued that write, and the list's children
  // derived from it, to later microtasks: onSelect read the old value through the row and through the list, and the line
  // after `await` read the new row but old children. The batch's flush writes the rows and derives the list at once.
  const { startExposedValueBatch, flushExposedValueBatch } = useStore.getState() as unknown as ExposedBatchStore;
  const outermost = actionDepth === 0;
  if (outermost) startExposedValueBatch();
  actionDepth += 1;
  try {
    if (effectDepth > 0) result = action();
    else
      flushSync(() => {
        result = action();
      });
  } finally {
    actionDepth -= 1;
    if (outermost) {
      const queued = deferredEvents;
      deferredEvents = [];
      try {
        flushExposedValueBatch();
        // What the flush changed re-resolves bindings that read it (a custom validation rule on the widget's own
        // value): that re-render, and the isValid it publishes, settle before the events fire, so a handler reads the
        // state the action produced. Not inside a lifecycle, where React refuses flushSync.
        if (effectDepth === 0) flushSync(() => {});
      } finally {
        queued.forEach((fire) => fire());
      }
    }
  }
  return result;
};

/** For the few widgets that publish actions themselves rather than through useExposed (Table, Tabs, List view): runs
 *  each function among `values` as an action (runNow), leaving the other values as they are. */
export const asActions = <T extends Record<string, unknown>>(values: T): T =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'function' ? (...args: unknown[]) => runNow(() => (value as Action)(...args)) : value,
    ])
  ) as T;

/** The widget's fireEvent, holding events fired while one of its actions runs until the action has published. Every
 *  UI 2.0 widget fires through it (withControlState, or this hook in the few that do not use it). */
export const useActionFire = (fireEvent: WidgetProps['fireEvent']): WidgetProps['fireEvent'] =>
  useMemo(
    () =>
      ((...args: Parameters<WidgetProps['fireEvent']>) => {
        if (actionDepth > 0) {
          deferredEvents.push(() => fireEvent(...args));
          return undefined;
        }
        return fireEvent(...args);
      }) as WidgetProps['fireEvent'],
    [fireEvent]
  );

/** Publishes the standard exposed state plus the widget's own values and actions. Values are re-published when one of
 *  them changes by content. Each action is published once, as a stable function that calls the widget's latest
 *  closure, so an action never runs with the props of an earlier render, and what it changes is published before it
 *  returns (runNow). */
export const useExposed = (
  setExposedVariables: WidgetProps['setExposedVariables'],
  properties: Resolved,
  values: Exposed
): void => {
  const latest = useLatest(values);
  const publish = useLatest(setExposedVariables);
  const actionNames = Object.keys(values)
    .filter((key) => typeof values[key] === 'function')
    .join(',');
  const actions = useMemo(
    () =>
      Object.fromEntries(
        actionNames
          .split(',')
          .filter(Boolean)
          .map((name) => [name, (...args: unknown[]) => runNow(() => (latest.current[name] as Action)(...args))])
      ),
    [actionNames, latest]
  );
  const data = useStable({
    isVisible: properties.visibility !== false,
    isLoading: !!properties.loadingState,
    isDisabled: !!properties.disabledState,
    ...Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value !== 'function')),
  });
  useEffect(() => {
    publish.current({ ...data, ...actions });
  }, [data, actions, publish]);
};

/** Gives a pack widget the control state every ToolJet widget has: visibility, loading and disabled follow their
 *  properties and can be changed by the setVisibility, setLoading and setDisable actions (Control component), the way
 *  the native useExposeState works. The widget receives the effective values as its properties, so it reads
 *  properties.visibility / loadingState / disabledState as before. An unset property means its default (visible,
 *  enabled, not loading): a widget created through the MCP carries only the properties it was given. */
/** Runs `write` inside one exposed-value batch, flushed before it returns (nested in an action's batch, runNow's flush
 *  settles it). */
const inBatch =
  <A extends unknown[], R>(write: (...args: A) => R) =>
  (...args: A): R => {
    const { startExposedValueBatch, flushExposedValueBatch } = useStore.getState() as unknown as ExposedBatchStore;
    startExposedValueBatch();
    try {
      return write(...args);
    } finally {
      flushExposedValueBatch();
    }
  };

/** The widget's setExposedVariable(s), publishing at once in a List view row or a Kanban card. There a widget's values
 *  are written per row, and the store queues that write to a microtask (outside a batch), and the list's children
 *  derived from it to another: an event fired after the write, from a click that is not an action (a record list's
 *  row, a picker), read the old row through components.<child>[row] and components.<list>.children[row]. Each write in a
 *  row lands, with the list's children, before the setter returns; outside rows the setters are the widget's own. */
export const usePublishNow = ({
  setExposedVariable,
  setExposedVariables,
}: Pick<WidgetProps, 'setExposedVariable' | 'setExposedVariables'>) => {
  const inRow = useSubcontainerContext().contextPath.length > 0;
  return useMemo(
    () =>
      inRow
        ? { setExposedVariable: inBatch(setExposedVariable), setExposedVariables: inBatch(setExposedVariables) }
        : { setExposedVariable, setExposedVariables },
    [inRow, setExposedVariable, setExposedVariables]
  );
};

/** The component's exposed values as the store holds them now: its own entry, or its row's in a List view row or
 *  Kanban card (values kept per row). */
const storedExposed = (moduleId: string, id: string, path: ContextSegment[]): Record<string, unknown> | undefined => {
  type Store = {
    resolvedStore?: { modules?: Record<string, { exposedValues?: { components?: Record<string, unknown> } }> };
  };
  let own: unknown = (useStore.getState() as unknown as Store).resolvedStore?.modules?.[moduleId]?.exposedValues
    ?.components?.[id];
  for (const { index } of path) own = Array.isArray(own) ? own[index] : undefined;
  return own && typeof own === 'object' ? (own as Record<string, unknown>) : undefined;
};

/** The widget's publishers, with every published function made an owned action (runNow, and nothing once `alive` is
 *  false), and values the component already holds left out. Inside an action's batch the store writes every key it is
 *  given and updates its dependents, so a click that re-published unchanged keys (isVisible, label) re-ran queries
 *  bound to them. A key is left out only when both the store and this instance's last write already hold it: inside a
 *  batch the store lags this instance's writes, and after a reset the store differs from them.
 *  The publishers are stable, and each call writes through the widget's latest setters and row. Work that finishes
 *  later (a file read) calls the publishers it started with, and RenderWidget's setters write to the row index of
 *  their render: when the publishers were remade with them, a List view row kept across a reorder published its
 *  completion to the record now at its old index. */
const useOwnedPublish = (
  props: Pick<WidgetProps, 'setExposedVariables' | 'setExposedVariable'>,
  alive: MutableRefObject<boolean>,
  id: string
) => {
  const latest = useLatest({ ...props, moduleId: useModuleId(), path: useSubcontainerContext().contextPath });
  const sent = useRef<Record<string, unknown>>({});
  return useMemo(() => {
    const owned = (value: unknown) =>
      typeof value === 'function'
        ? (...args: unknown[]) =>
            alive.current ? runNow(() => (value as Action)(...args)) : Promise.resolve(undefined)
        : value;
    const changed = (key: string, value: unknown, stored: Record<string, unknown> | undefined) =>
      typeof value === 'function' ||
      !stored ||
      !(key in stored) ||
      !(key in sent.current) ||
      !isEqual(sent.current[key], value) ||
      !isEqual(stored[key], value);
    const storedNow = () => storedExposed(latest.current.moduleId, id, latest.current.path);
    return {
      setExposedVariables: ((values: Record<string, unknown>) => {
        const stored = storedNow();
        const next = Object.entries(values || {}).filter(([key, value]) => changed(key, value, stored));
        next.forEach(([key, value]) => {
          if (typeof value !== 'function') sent.current[key] = value;
        });
        if (!next.length) return undefined;
        return latest.current.setExposedVariables(Object.fromEntries(next.map(([key, value]) => [key, owned(value)])));
      }) as WidgetProps['setExposedVariables'],
      setExposedVariable: ((key: string, value: unknown) => {
        if (!changed(key, value, storedNow())) return undefined;
        if (typeof value !== 'function') sent.current[key] = value;
        return latest.current.setExposedVariable(key, owned(value));
      }) as WidgetProps['setExposedVariable'],
    };
  }, [alive, id, latest]);
};

/** Whether the component is still mounted. */
const useAlive = (): MutableRefObject<boolean> => {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return alive;
};

/** For the few widgets that keep their control state themselves (Table, List view, Tabs) or draw a native widget that
 *  publishes its own actions (the Dialog's ModalV2): the same owned actions withControlState gives every other widget,
 *  so their setLoading / setDisable / setVisibility publish before the awaited call returns, and an unmounted
 *  instance's actions do nothing. */
export const withOwnedActions = <P extends WidgetProps>(Widget: React.ComponentType<P>) => {
  const Owned = (props: P) => {
    const publish = useOwnedPublish(usePublishNow(props), useAlive(), props.id);
    return React.createElement(Widget, { ...props, ...publish });
  };
  Owned.displayName = `Owned(${Widget.displayName || Widget.name || 'Widget'})`;
  return Owned;
};

export const withControlState = <P extends WidgetProps>(Widget: React.ComponentType<P>) => {
  const Controlled = (props: P) => {
    const { properties } = props;
    // Every action this instance publishes runs through runNow and belongs to this instance (useOwnedPublish); in a
    // List view row or Kanban card its writes land at once (usePublishNow).
    const { setExposedVariables, setExposedVariable } = useOwnedPublish(usePublishNow(props), useAlive(), props.id);
    const { isVisible, isLoading, isDisabled } = useExposeState(
      properties.loadingState === true,
      properties.visibility !== false,
      properties.disabledState === true,
      setExposedVariables,
      setExposedVariable
    );
    const effective = useMemo(
      () => ({
        ...properties,
        visibility: isVisible !== false,
        loadingState: !!isLoading,
        disabledState: !!isDisabled,
      }),
      [properties, isVisible, isLoading, isDisabled]
    );
    const fireEvent = useActionFire(props.fireEvent);
    // The control's DOM id (labels, help notes), one per rendered instance: DOM ids are document-wide, and a component
    // id repeats in List view rows and Kanban cards (inside Tabs there too, with no row index of its own) and in every
    // instance of a module, so an id made from it alone let the second instance's label focus, edit or toggle the
    // first instance's control.
    const domId = `shad-${props.id}-${useId().replace(/[^\w-]/g, '')}`;
    return React.createElement(Widget, {
      ...props,
      properties: effective,
      fireEvent,
      domId,
      setExposedVariable,
      setExposedVariables,
    });
  };
  Controlled.displayName = `Controlled(${Widget.displayName || Widget.name || 'Widget'})`;
  return Controlled;
};

/** The width a widget's root is drawn at: its box (`width`, set by the canvas grid or the FlexContainer) less the
 *  padding RenderWidget draws around every widget. Read from props, so the widget does not measure itself. */
export const rootWidth = (width: unknown): number => Math.max(0, (Number(width) || 0) - 2 * BOX_PADDING);

/** Sizes the widget to its content in view mode, unless its Dynamic height property is turned off: a pack widget
 *  given a guessed height (an agent's, or a default) neither clips its content nor leaves a gap under it. */
/** What useAutoHeight reads of the widget's props. */
export type AutoHeightProps = Pick<
  WidgetProps,
  'id' | 'height' | 'width' | 'properties' | 'currentMode' | 'currentLayout' | 'subContainerIndex' | 'componentType'
>;

export const useAutoHeight = (
  { id, height, width, properties, currentMode, currentLayout, subContainerIndex, componentType }: AutoHeightProps,
  ref: RefObject<HTMLElement>
): void => {
  const enabled = fitsContentInView(componentType, properties) && currentMode === 'view';
  const value = useHeightObserver(ref, enabled);
  useSkeletonHold(ref, properties, enabled);
  useDynamicHeight({
    isDynamicHeightEnabled: enabled,
    id,
    height,
    value,
    currentLayout,
    width,
    visibility: properties.visibility !== false,
    subContainerIndex,
  });
};

/** An option's value: text, a number or a boolean (a select keys its items by String(value)). */
export type OptionValue = string | number | boolean;

/** An option: its label and value, plus whatever else the bound option object carried (disabled, description...). */
export interface Option extends Resolved {
  label: string;
  value: OptionValue;
}

/** Options as { label, value }: accepts plain values (['A', 'B']) as well as objects. Entries that cannot be an option
 *  (null, empty objects, object values) are dropped, a missing or non-text label falls back to the value, and only the
 *  first of options sharing a value is kept, so a select can key its items by value. */
export const toOptions = (v: unknown): Option[] => {
  const seen = new Set<string>();
  const options: Option[] = [];
  for (const o of list(v)) {
    let option: Option;
    if (isScalar(o)) option = { label: String(o), value: o };
    else if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
      const entry = o as Resolved;
      const value: unknown = entry.value !== undefined && entry.value !== null ? entry.value : entry.label;
      if (!isScalar(value)) continue;
      option = { ...entry, label: isScalar(entry.label) ? String(entry.label) : String(value), value };
    } else continue;
    const key = String(option.value);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(option);
  }
  return options;
};
