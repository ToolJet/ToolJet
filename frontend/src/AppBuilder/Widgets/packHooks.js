import React, { useEffect, useMemo, useRef } from 'react';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { stringify } from './packJson';

export { stringify };

// Shared by the component packs (experiment): the ToolJet side of a pack widget, independent of the UI library, so a
// pack's chunk does not pull in another pack's library.

export const list = (v) => (Array.isArray(v) ? v : []);

/** Publishes the standard exposed state plus the widget's own values and actions, keeping them in sync. Compares by
 *  content: values rebuilt on every render (a selected option object) would loop if re-published on identity. */
export const useExposed = (setExposedVariables, properties, values) => {
  const dataKey = stringify([
    properties.visibility,
    properties.loadingState,
    properties.disabledState,
    Object.entries(values).filter(([, v]) => typeof v !== 'function'),
  ]);
  const latest = useRef(values);
  latest.current = values;
  useEffect(() => {
    setExposedVariables({
      isVisible: properties.visibility !== false,
      isLoading: !!properties.loadingState,
      isDisabled: !!properties.disabledState,
      ...latest.current,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);
};

/** Gives a pack widget the control state every ToolJet widget has: visibility, loading and disabled follow their
 *  properties and can be changed by the setVisibility, setLoading and setDisable actions (Control component), the way
 *  the native useExposeState works. The widget receives the effective values as its properties, so it reads
 *  properties.visibility / loadingState / disabledState as before. An unset property means its default (visible,
 *  enabled, not loading): a widget created through the MCP carries only the properties it was given. */
export const withControlState = (Widget) => {
  const Controlled = (props) => {
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

/** Sizes the widget to its content in view mode, unless its Dynamic height property is turned off: a pack widget
 *  given a guessed height (an agent's, or a default) neither clips its content nor leaves a gap under it. */
export const useAutoHeight = (
  { id, height, width, properties, currentMode, currentLayout, subContainerIndex, componentType },
  ref
) => {
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
    componentType,
  });
};

export const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Options as { label, value }: accepts plain values (['A', 'B']) as well as objects. Entries that cannot be an option
 *  (null, empty objects, object values) are dropped, a missing or non-text label falls back to the value, and only the
 *  first of options sharing a value is kept, so a select can key its items by value. */
const isText = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
export const toOptions = (v) => {
  const seen = new Set();
  const options = [];
  for (const o of list(v)) {
    let option;
    if (isText(o)) option = { label: String(o), value: o };
    else if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
      const value = o.value !== undefined && o.value !== null ? o.value : o.label;
      if (!isText(value)) continue;
      option = { ...o, label: isText(o.label) ? String(o.label) : String(value), value };
    } else continue;
    const key = String(option.value);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(option);
  }
  return options;
};
