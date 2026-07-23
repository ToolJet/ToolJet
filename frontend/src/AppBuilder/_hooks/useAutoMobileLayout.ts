import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import useStore from '@/AppBuilder/_stores/store';
import { computeAutoMobileLayout } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

type MobileBoxes = Record<string, { top: number; left: number; width: number; height: number }>;

// Viewer-only: applies mobile auto-stacking to the current page in-memory (no save),
// so every page renders aligned in preview/view. Mirrors the editor's compute.
export const useAutoMobileLayout = (currentLayout: string, moduleIdOverride?: string): void => {
  const { moduleId: contextModuleId } = useModuleContext();
  // Viewer calls this above its own ModuleProvider, so context is the default here —
  // prefer the moduleId the caller passes in.
  const moduleId = moduleIdOverride ?? contextModuleId;
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const isAutoMobileLayout = useStore((state) => state.getIsAutoMobileLayout(moduleId), shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);
  const lastComputedRef = useRef<MobileBoxes>();

  useEffect(() => {
    if (currentLayout !== 'mobile' || !isAutoMobileLayout) return;
    const updatedBoxes: MobileBoxes = computeAutoMobileLayout(currentPageComponents);
    if (isEmpty(diff(lastComputedRef.current, updatedBoxes))) return;
    lastComputedRef.current = updatedBoxes;
    setComponentLayout(updatedBoxes, undefined, moduleId, { saveAfterAction: false, skipUndoRedo: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout, currentPageComponents, isAutoMobileLayout, moduleId]);
};
