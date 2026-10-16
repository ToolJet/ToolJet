import React, { useEffect, useMemo, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { stringify } from './packJson';
import type { MutableRefObject, RefObject } from 'react';
import type { Bound, Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export { stringify };

// The ToolJet side of a UI 2.0 widget (exposed values, actions, auto height, bound lists), with no UI library in it.

/** A bound list as it is (its items are bound values, untyped like Resolved); anything else (unset, an object, a
 *  string) as an empty list. */
export const list = (v: unknown): Bound[] => (Array.isArray(v) ? v : []);

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
export const useLatest = <T>(value: T): MutableRefObject<T> => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

type Action = (...args: unknown[]) => unknown;

/** Publishes the standard exposed state plus the widget's own values and actions. Values are re-published when one of
 *  them changes by content. Each action is published once, as a stable function that calls the widget's latest
 *  closure, so an action never runs with the props of an earlier render. */
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
          .map((name) => [name, (...args: unknown[]) => (latest.current[name] as Action)(...args)])
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
export const withControlState = <P extends WidgetProps>(Widget: React.ComponentType<P>) => {
  const Controlled = (props: P) => {
    const { properties, setExposedVariables, setExposedVariable } = props;
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
    return React.createElement(Widget, { ...props, properties: effective });
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

/** Two initials: of the first and the last word, so "Yusuf & Leyla Demir" reads YD. Words without a letter or a
 *  digit ("&", "-") are skipped (they gave "Y&"); the initial is the word's first letter or digit. */
export const initials = (name: unknown): string => {
  const tokens = String(name || '').split(/\s+/);
  // A rank or code before the name ("01 Nina Park") is not part of it: initials come from the words with letters when
  // there are any (2026-10-14: every leaderboard avatar read "0P", "1H").
  const lettered = tokens.filter((w) => /\p{L}/u.test(w));
  const words = (lettered.length ? lettered : tokens).map((w) => w.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.join('').toUpperCase();
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
const isText = (v: unknown): v is OptionValue =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
export const toOptions = (v: unknown): Option[] => {
  const seen = new Set<string>();
  const options: Option[] = [];
  for (const o of list(v)) {
    let option: Option;
    if (isText(o)) option = { label: String(o), value: o };
    else if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
      const entry = o as Resolved;
      const value: unknown = entry.value !== undefined && entry.value !== null ? entry.value : entry.label;
      if (!isText(value)) continue;
      option = { ...entry, label: isText(entry.label) ? String(entry.label) : String(value), value };
    } else continue;
    const key = String(option.value);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(option);
  }
  return options;
};
