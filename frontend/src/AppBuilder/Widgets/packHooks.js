import { useEffect, useRef } from 'react';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
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
      ? { ...o, label: String(o.label ?? o.value ?? ''), value: o.value ?? o.label }
      : { label: String(o), value: o }
  );
