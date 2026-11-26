import { useEffect, useRef } from 'react';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import {
  getDynamicElementSelector,
  getDynamicLayoutKey,
  normalizeLayoutContext,
} from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { observeHeight, setHeightFrozen, unobserveHeight } from '@/AppBuilder/_stores/dynamicHeight/heightRegistry';
import { isTruthyOrZero } from '@/_helpers/appUtils';
import useStore from '@/AppBuilder/_stores/store';

// Same context rules as the old hook: leaf widgets in a Listview row already
// have the row in their context path, a row subcontainer appends its own
// index, and ModalV2 passes a pre-merged array.
const resolveContextIndices = (contextPath, subContainerIndex, isRowSubcontainer) => {
  const pathIndices = contextPath.map((segment) => segment.index);
  if (Array.isArray(subContainerIndex)) return normalizeLayoutContext(subContainerIndex);
  if (isRowSubcontainer && isTruthyOrZero(subContainerIndex)) {
    return normalizeLayoutContext([...pathIndices, subContainerIndex]);
  }
  if (pathIndices.length > 0) return normalizeLayoutContext(pathIndices);
  if (isTruthyOrZero(subContainerIndex)) return normalizeLayoutContext([subContainerIndex]);
  return null;
};

// New-engine version of useDynamicHeight. Leaf widgets are measured by the
// shared height registry, so nothing here writes a style and then reads a
// height. Containers are sized from their children by the engine.
export const useDynamicHeightV2 = ({
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
  const { moduleId } = useModuleContext();
  const wasEnabled = useRef(isDynamicHeightEnabled);
  const contextIndices = resolveContextIndices(contextPath, subContainerIndex, isRowSubcontainer);
  const contextKey = contextIndices ? contextIndices.join('.') : '';

  // Containers: re-size from children whenever their content may have changed.
  useEffect(() => {
    if (!isContainer) return;
    if (isDynamicHeightEnabled || wasEnabled.current) {
      useStore.getState().scheduleReflow(id, currentLayout, true, contextIndices, moduleId);
    }
    wasEnabled.current = isDynamicHeightEnabled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isContainer,
    isDynamicHeightEnabled,
    id,
    value,
    currentLayout,
    height,
    width,
    componentCount,
    visibility,
    contextKey,
    moduleId,
  ]);

  // Leaf widgets: register with the height registry while content-sized and
  // visible. Turning dynamic height off or hiding the widget is a layout
  // change, not a measurement, so it is sent to the engine directly.
  useEffect(() => {
    if (isContainer) return;
    const key = getDynamicLayoutKey(id, contextIndices, '', moduleId);
    const changedState = isDynamicHeightEnabled !== wasEnabled.current;
    wasEnabled.current = isDynamicHeightEnabled;
    if (changedState || visibility === false) {
      useStore.getState().scheduleReflow(id, currentLayout, false, contextIndices, moduleId);
    }
    if (!isDynamicHeightEnabled || visibility === false) return;

    const element = document.querySelector(getDynamicElementSelector(id, contextIndices, moduleId));
    if (!element) return;
    // In a column flex container the flex basis is the height; free it so the
    // wrapper can follow its content.
    if (element.classList.contains('flex-child-wrapper')) {
      const direction = element.parentElement && getComputedStyle(element.parentElement).flexDirection;
      if (direction?.startsWith('column')) element.style.flexBasis = 'auto';
    }
    observeHeight(element, {
      key,
      id,
      contextIndices,
      moduleId,
      layout: currentLayout,
      get: useStore.getState,
    });
    return () => unobserveHeight(element, key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContainer, isDynamicHeightEnabled, id, currentLayout, visibility, contextKey, moduleId]);

  useEffect(() => {
    if (isContainer) return;
    const key = getDynamicLayoutKey(id, contextIndices, '', moduleId);
    setHeightFrozen(key, isDynamicHeightEnabled && skipAdjustment);
    return () => setHeightFrozen(key, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContainer, isDynamicHeightEnabled, skipAdjustment, id, contextKey, moduleId]);
};
