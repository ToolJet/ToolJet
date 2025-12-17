import { useEffect, useState, useMemo, useRef } from 'react';
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

  const isPreviewInEditor = useStore(
    (state) => state.isPreviewInEditor && state.modeStore.modules[moduleId]?.currentMode === 'view',
    shallow
  );

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldMount, setShouldMount] = useState(!isPreviewInEditor);
  const [shouldApplyHideClass, setShouldApplyHideClass] = useState(isPreviewInEditor);

  // Use refs to track pending operations and prevent race conditions
  const timerRef = useRef(null);
  const animationRef = useRef(null);
  const isMountedRef = useRef(true);

  // Handle mount/unmount timing based on preview state
  useEffect(() => {
    // Clean up any pending operations from previous state changes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (isPreviewInEditor) {
      // Editor → Preview: Apply hide class to trigger animation, then unmount after animation completes
      setShouldApplyHideClass(true);
      setIsAnimating(true);

      timerRef.current = setTimeout(() => {
        if (isMountedRef.current && timerRef.current) {
          setShouldMount(false);
          setIsAnimating(false);
        }
        timerRef.current = null;
      }, 300); // Match tw-duration-300
    } else {
      // Preview → Editor: Mount first with hide class, then remove hide class to trigger animation
      setShouldMount(true);
      setShouldApplyHideClass(true);
      setIsAnimating(false);

      // Use RAF to ensure DOM is ready before triggering animation
      animationRef.current = requestAnimationFrame(() => {
        if (!isMountedRef.current) return;

        // Remove hide class to trigger animation
        setShouldApplyHideClass(false);
        setIsAnimating(true);

        timerRef.current = setTimeout(() => {
          if (isMountedRef.current && timerRef.current) {
            setIsAnimating(false);
          }
          timerRef.current = null;
        }, 300);
        animationRef.current = null;
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPreviewInEditor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
    shouldHide: isPreviewInEditor,
    isAnimating,
    animationClasses,
    isPreviewInEditor,
  };
};
