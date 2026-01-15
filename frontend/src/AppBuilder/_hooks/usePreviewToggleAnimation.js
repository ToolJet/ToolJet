import { useEffect, useState, useMemo, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

/**
 * Hook that orchestrates UI animations for the editor ↔ preview toggle.
 *
 * This hook does NOT decide when preview mode starts or ends.
 * Instead, it reacts to `previewPhase` from the global store and:
 * - Controls when sidebars/panels should remain mounted or be unmounted
 * - Exposes animation-related CSS classes for collapsed bar transitions
 * - Ensures animations are allowed to complete before DOM nodes are removed
 *
 * Preview flow (high level):
 * 1. Open panels are synchronously closed via state updates
 * 2. Once all panels are collapsed, `previewPhase` advances
 * 3. Mode switches and isPreviewInEditor flag is updated.
 * 3. Collapsed bars and Canvas animate in/out based on the current phase
 * 4. Unmountes/Mounts happen only after animations complete
 *
 * This phase-driven approach avoids timing-based hacks (e.g. setTimeout),
 * prevents layout thrashing, and keeps transitions deterministic
 * across devices and performance conditions.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.animationType - 'width' | 'height' | 'both'
 * @returns {Object} Animation state and classes
 */
export const usePreviewToggleAnimation = ({ animationType = 'width' } = {}) => {
  const { moduleId } = useModuleContext();

  const previewPhase = useStore((state) => state.previewPhase, shallow);
  const setPreviewPhase = useStore((state) => state.setPreviewPhase, shallow);
  const setIsPreviewInEditor = useStore((state) => state.setIsPreviewInEditor, shallow);

  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const toggleLeftSidebar = useStore((state) => state.toggleLeftSidebar, shallow);
  const setSelectedSidebarItem = useStore((store) => store.setSelectedSidebarItem);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const isQueryPaneExpanded = useStore((state) => state.queryPanel.isQueryPaneExpanded, shallow);
  const setIsQueryPaneExpanded = useStore((state) => state.queryPanel.setIsQueryPaneExpanded, shallow);

  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const targetMode = useStore((state) => state.targetMode, shallow);
  const setCurrentMode = useStore((state) => state.setCurrentMode, shallow);

  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const updateCanvasBottomHeight = useStore((state) => state.updateCanvasBottomHeight, shallow);

  const settledAnimatedComponents = useStore((state) => state.settledAnimatedComponents, shallow);
  const resetSettledAnimatedComponents = useStore((state) => state.resetSettledAnimatedComponents, shallow);

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldMount, setShouldMount] = useState(currentMode === 'edit');
  const [shouldApplyHideClass, setShouldApplyHideClass] = useState(currentMode !== 'edit');
  const openedPanelsRef = useRef([]);
  const hasCapturedOpenPanelsRef = useRef(false);

  // Any non-idle previewPhase indicates an active editor ↔ preview transition.
  useEffect(() => {
    setIsAnimating(previewPhase !== 'idle');
  }, [previewPhase]);

  // Capture open panels once when entering `closing-panels`
  // and close them without re-running on derived state updates.
  useEffect(() => {
    if (previewPhase !== 'closing-panels') {
      hasCapturedOpenPanelsRef.current = false;
      return;
    }

    //Prevent re-running on dependency changes
    if (hasCapturedOpenPanelsRef.current) return;

    hasCapturedOpenPanelsRef.current = true;

    const openedPanels = [];
    if (isQueryPaneExpanded) {
      setIsQueryPaneExpanded(false);
      openedPanels.push('query');
    }
    if (isSidebarOpen) {
      toggleLeftSidebar(false);
      openedPanels.push('left');
    }
    if (isRightSidebarOpen) {
      setRightSidebarOpen(false);
      openedPanels.push('right');
    }
    // Keep track of panels that were open before preview mode
    openedPanelsRef.current = openedPanels;
  }, [
    previewPhase,
    isQueryPaneExpanded,
    isRightSidebarOpen,
    isSidebarOpen,
    setIsQueryPaneExpanded,
    toggleLeftSidebar,
    setRightSidebarOpen,
  ]);

  // Apply editor ↔ preview mode switch and advance to `animating` phase.
  useEffect(() => {
    if (previewPhase !== 'switching-mode') return;

    setIsPreviewInEditor(targetMode === 'view');
    setCurrentMode(targetMode);
    updateCanvasBottomHeight(currentPageComponents, moduleId);
    setPreviewPhase('animating');
  }, [
    previewPhase,
    targetMode,
    currentPageComponents,
    moduleId,
    setIsPreviewInEditor,
    setCurrentMode,
    updateCanvasBottomHeight,
    setPreviewPhase,
  ]);

  // Apply hide classes during `animating` based on the target mode.
  useEffect(() => {
    if (previewPhase !== 'animating') return;

    setShouldApplyHideClass(targetMode === 'view');
  }, [previewPhase, targetMode]);

  // Remount sidebars when returning from preview mode,
  // then advance to `switching-mode` to restore editor state.
  useEffect(() => {
    if (previewPhase !== 'mounting-sidebars') return;

    setShouldMount(true);
    setPreviewPhase('switching-mode');
  }, [previewPhase, setPreviewPhase]);

  // Unmount sidebars after preview animations complete and return the system to the `idle` phase.
  useEffect(() => {
    if (previewPhase !== 'unmounting-sidebars') return;

    setShouldMount(false);
    setPreviewPhase('idle');
  }, [previewPhase, setPreviewPhase]);

  // Restore previously open panels and complete the preview transition.
  useEffect(() => {
    if (previewPhase !== 'restoring-panels') return;

    if (openedPanelsRef.current.includes('query')) {
      setIsQueryPaneExpanded(true);
    }

    if (openedPanelsRef.current.includes('left')) {
      const selectedItem = localStorage.getItem('selectedSidebarItem');
      setSelectedSidebarItem(selectedItem);
      toggleLeftSidebar(true);
    }

    if (openedPanelsRef.current.includes('right')) {
      setRightSidebarOpen(true);
    }

    openedPanelsRef.current = [];
    setPreviewPhase('idle');
  }, [
    previewPhase,
    setIsQueryPaneExpanded,
    setPreviewPhase,
    setRightSidebarOpen,
    setSelectedSidebarItem,
    toggleLeftSidebar,
  ]);

  /**
   * Wait for all registered panel/canvas animations to settle.
   *
   * Once every required component has finished animating, advance the
   * preview flow to either unmount sidebars (view mode) or restore
   * previously open panels (edit mode).
   */
  useEffect(() => {
    if (settledAnimatedComponents.length === 0) return;

    const requiredComponents = ['leftSidebar', 'rightSidebar', 'queryPanel', 'canvas'];

    const isAllSettled = requiredComponents.every((comp) => settledAnimatedComponents.includes(comp));

    if (!isAllSettled) return;

    if (targetMode === 'view') {
      setPreviewPhase('unmounting-sidebars');
    } else {
      setPreviewPhase('restoring-panels');
    }

    resetSettledAnimatedComponents();
  }, [resetSettledAnimatedComponents, setPreviewPhase, settledAnimatedComponents, targetMode]);

  // Build transition classes based on animation type
  const transitionClasses = useMemo(() => {
    const baseClass = ' tw-duration-300 tw-ease-linear';

    if (animationType === 'width') {
      return 'tw-transition-[width]' + baseClass;
    }
    if (animationType === 'height') {
      return 'tw-transition-[height]' + baseClass;
    }
    if (animationType === 'both') {
      // For both, we can use tw-transition-all
      return 'tw-transition-all' + baseClass;
    }
    return baseClass;
  }, [animationType]);

  // Build hide classes based on animation type and state
  const hideClasses = useMemo(() => {
    if (!shouldApplyHideClass) return '';

    if (animationType === 'width') return '!tw-w-0';
    if (animationType === 'height') return '!tw-h-0';
    return '';
  }, [animationType, shouldApplyHideClass]);

  // Combine all animation classes
  const animationClasses = useMemo(() => {
    return `${transitionClasses} ${hideClasses}`.trim();
  }, [transitionClasses, hideClasses]);

  return {
    shouldMount,
    isAnimating,
    animationClasses,
  };
};
