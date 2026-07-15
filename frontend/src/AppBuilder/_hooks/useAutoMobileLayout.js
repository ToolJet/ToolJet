import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import useStore from '@/AppBuilder/_stores/store';
import { computeAutoMobileLayout } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

// Viewer-only: applies mobile auto-stacking to the current page in-memory (no save),
// so every page renders aligned in preview/view. Mirrors the editor's compute.
export const useAutoMobileLayout = (currentLayout) => {
  const { moduleId } = useModuleContext();
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const isAutoMobileLayout = useStore((state) => state.getIsAutoMobileLayout(moduleId), shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);
  const lastComputedRef = useRef();

  useEffect(() => {
    if (currentLayout !== 'mobile' || !isAutoMobileLayout) return;
    const updatedBoxes = computeAutoMobileLayout(currentPageComponents);
    if (isEmpty(diff(lastComputedRef.current, updatedBoxes))) return;
    lastComputedRef.current = updatedBoxes;
    setComponentLayout(updatedBoxes, undefined, moduleId, { saveAfterAction: false, skipUndoRedo: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout, currentPageComponents, isAutoMobileLayout, moduleId]);
};
