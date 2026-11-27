import { useEffect, useMemo } from 'react';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import {
  getDynamicElementSelector,
  getDynamicLayoutKey,
  normalizeLayoutContext,
  serializeLayoutContext,
} from '@/AppBuilder/_stores/dynamicHeight/layoutKeys';
import { isTruthyOrZero } from '@/_helpers/appUtils';
import useStore from '@/AppBuilder/_stores/store';

// ─────────────────────────────────────────────────────────────────────────────
// useDynamicHeight: how a widget takes part in dynamic height.
//
//   - A widget the engine measures (a leaf: Text, Table, a pack widget, ...)
//     has its canvas box watched by the app's height registry. The box follows
//     its content in the viewer (dynamicHeightPolicy.boxFollowsContent), so
//     the browser reports every size it takes; nothing is read here.
//   - A container (or a List view row) is sized by the engine from what it
//     holds, so it asks for a pass whenever that may have changed.
//
// Both go through the store's scheduler (dynamicHeight/scheduler.js), which
// runs the engine once per frame.
// ─────────────────────────────────────────────────────────────────────────────

// The widget's row context. The two inputs mean different things depending on the caller:
//
//  - A widget inside a List view row: its WidgetWrapper is rendered inside the row's SubcontainerContext, so
//    `contextPath` already holds the row; the `subContainerIndex` prop repeats its last index.
//  - ListviewSubcontainer's own call (`isRowSubcontainer`): it is rendered outside its own Provider, so `contextPath`
//    is the parent row's (or empty), and `subContainerIndex` is this row's index, not yet in the path.
//  - ModalV2 passes the whole context as an array in `subContainerIndex`.
const contextIndicesOf = (contextPath, subContainerIndex, isRowSubcontainer) => {
  if (Array.isArray(subContainerIndex)) return normalizeLayoutContext(subContainerIndex);
  const pathIndices = contextPath.map((segment) => segment.index);
  if (isRowSubcontainer && isTruthyOrZero(subContainerIndex)) {
    return normalizeLayoutContext([...pathIndices, subContainerIndex]);
  }
  if (pathIndices.length > 0) return normalizeLayoutContext(pathIndices);
  if (isTruthyOrZero(subContainerIndex)) return normalizeLayoutContext([subContainerIndex]);
  return normalizeLayoutContext([]);
};

// A measured widget's own inputs (value, width, ...) don't ask for a pass: the registry sees what they change.
const NO_CONTAINER_INPUTS = [null, null, null, null, null];

const schedulerOf = () => useStore.getState().getDynamicHeightScheduler();

export const useDynamicHeight = ({
  isDynamicHeightEnabled,
  id,
  height,
  value,
  currentLayout,
  width,
  isContainer = false,
  componentCount = 0,
  visibility,
  skipAdjustment = false,
  subContainerIndex,
  isRowSubcontainer = false,
}) => {
  const { contextPath } = useSubcontainerContext();
  // From context, so widgets don't forward it: an embedded module's components live under modules[<instance id>].
  const { moduleId } = useModuleContext();
  const contextIndices = useMemo(
    () => contextIndicesOf(contextPath, subContainerIndex, isRowSubcontainer),
    [contextPath, subContainerIndex, isRowSubcontainer]
  );
  // A string, so effects re-run when the row changes, not when an equal array is built again.
  const context = serializeLayoutContext(contextIndices);
  const measured = !isContainer;
  const watched = measured && !!isDynamicHeightEnabled;

  // A widget the engine measures: its box is watched while dynamic height is on. The registry reports its first size
  // and every change, so nothing has to say when its content changed.
  useEffect(() => {
    if (!watched) return undefined;
    const element = document.querySelector(getDynamicElementSelector(id, contextIndices, moduleId));
    if (!element) return undefined;
    const scheduler = schedulerOf();
    const key = getDynamicLayoutKey(id, contextIndices, '', moduleId);
    scheduler.observe(element, { key, id, contextIndices, moduleId });
    return () => scheduler.unobserve(element);
    // contextIndices is read through `context`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched, id, context, moduleId]);

  // While the widget asks to keep its height (a Table loading its data), its reports are ignored and its box is held
  // at the height it is placed at, so what is under it stays put rather than a gap opening under a short spinner.
  useEffect(() => {
    if (!watched || !skipAdjustment) return undefined;
    const scheduler = schedulerOf();
    const key = getDynamicLayoutKey(id, contextIndices, '', moduleId);
    scheduler.setFrozen(key, true);
    const element = document.querySelector(getDynamicElementSelector(id, contextIndices, moduleId));
    const placedHeight = useStore.getState().temporaryLayouts[key]?.height;
    const inlineHeight = element?.style.height;
    if (element && placedHeight != null) element.style.height = `${placedHeight}px`;
    return () => {
      scheduler.setFrozen(key, false);
      if (element && placedHeight != null) element.style.height = inlineHeight;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched, skipAdjustment, id, context, moduleId]);

  // Ask for a pass while Dynamic height is on:
  //   - a container or row whenever what it holds may have changed (the engine sizes it from that);
  //   - a measured widget when it is shown or hidden (it may collapse); the registry covers its size.
  // Turning Dynamic height off needs nothing here: it changes the widget's definition, and the store places the
  // module again (scheduler.watchSavedLayouts).
  // Always five entries, so the effect's dependency list keeps its length.
  const containerInputs = isContainer ? [height, value, currentLayout, width, componentCount] : NO_CONTAINER_INPUTS;
  useEffect(() => {
    if (!isDynamicHeightEnabled) return;
    schedulerOf().scheduleDynamicHeight({ id, contextIndices, moduleId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDynamicHeightEnabled, id, context, moduleId, visibility, ...containerInputs]);
};
