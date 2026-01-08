import { useEffect, useState, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

/**
 * Hook that provides animation state for preview toggle
 * Handles mount/unmount timing so animations complete before unmount
 * and components mount before animation starts
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

  useEffect(() => {
    if (previewPhase !== 'idle') setIsAnimating(true);
    else setIsAnimating(false);

    if (previewPhase === 'closing-panels') {
      if (isQueryPaneExpanded) setIsQueryPaneExpanded(false);
      if (isSidebarOpen) toggleLeftSidebar(false);
      if (isRightSidebarOpen) setRightSidebarOpen(false);
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

  useEffect(() => {
    if (transitionCounter === 0) {
      setShouldMount(false);
      setPreviewPhase('idle');
    }

    if (transitionCounter === 4) {
      setPreviewPhase('idle');
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
