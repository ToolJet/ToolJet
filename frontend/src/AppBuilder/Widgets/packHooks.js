import React, { useEffect, useMemo, useRef } from 'react';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';

// Shared by the component packs (experiment): the ToolJet side of a pack widget, independent of the UI library, so a
// pack's chunk does not pull in another pack's library.

export const list = (v) => (Array.isArray(v) ? v : []);

/** Publishes the standard exposed state plus the widget's own values and actions, keeping them in sync. Compares by
 *  content: values rebuilt on every render (a selected option object) would loop if re-published on identity. */
export const useExposed = (setExposedVariables, properties, values) => {
  const dataKey = JSON.stringify([
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

/** Options as { label, value }: accepts plain values (['A', 'B']) as well as objects. */
export const toOptions = (v) =>
  list(v).map((o) =>
    o !== null && typeof o === 'object'
      ? {
          ...o,
          label: String(o.label ?? o.value ?? ''),
          value: o.value ?? o.label,
        }
      : { label: String(o), value: o }
  );
