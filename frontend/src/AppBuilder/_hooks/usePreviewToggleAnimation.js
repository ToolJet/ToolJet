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
 * Important invariants:
 * - We assume exactly 4 transition steps happen per full transition.
 *   If future UI adds/removes panels this number must be updated.
 * - transitionCounter is used to track how many individual panel animations
 *   have completed. Keep counters in sync with number of listeners.
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

  const targetMode = useStore((state) => state.targetMode, shallow);
  const setCurrentMode = useStore((state) => state.setCurrentMode, shallow);

  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const updateCanvasBottomHeight = useStore((state) => state.updateCanvasBottomHeight, shallow);

  const transitionCounter = useStore((state) => state.transitionCounter, shallow);

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldMount, setShouldMount] = useState(true);
  const [shouldApplyHideClass, setShouldApplyHideClass] = useState(false);
  const openedPanelsRef = useRef([]);

  // Central preview transition controller.
  useEffect(() => {
    if (previewPhase !== 'idle') setIsAnimating(true);
    else setIsAnimating(false);

    if (previewPhase === 'closing-panels') {
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
    }

    if (previewPhase === 'switching-mode') {
      setIsPreviewInEditor(targetMode === 'view');
      setCurrentMode(targetMode);
      updateCanvasBottomHeight(currentPageComponents, moduleId);
      setPreviewPhase('animating');
    }

    if (previewPhase === 'animating') {
      setShouldApplyHideClass(targetMode === 'view');
    }

    if (previewPhase === 'mounting-sidebars') {
      setShouldMount(true);
      setPreviewPhase('switching-mode');
    }
  }, [previewPhase]);

  /**
   * When all transitions complete (counter hits 0),
   * we unmount collapsed bars and reset to idle.
   * Multiple transitions decrement this counter.
   *
   * Magic number 4 exists because we are tracking:
   * left + right + query + canvas
   *
   * If any new animated element is added to preview transitions,
   * update this number accordingly.
   */
  useEffect(() => {
    if (transitionCounter === 0) {
      setShouldMount(false);
      setPreviewPhase('idle');
    }

    if (transitionCounter === 4) {
      setPreviewPhase('idle');

      // Open the panels that were already open before preview mode
      if (openedPanelsRef.current.includes('query')) setIsQueryPaneExpanded(true);
      if (openedPanelsRef.current.includes('left')) {
        const selectedItem = localStorage.getItem('selectedSidebarItem');
        setSelectedSidebarItem(selectedItem);
        toggleLeftSidebar(true);
      }
      if (openedPanelsRef.current.includes('right')) setRightSidebarOpen(true);
      openedPanelsRef.current = [];
    }
  }, [transitionCounter]);

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
