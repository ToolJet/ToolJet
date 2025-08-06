/**
 * StreamingWidgetWrapper - Enhanced WidgetWrapper for streaming architecture
 * 
 * This component integrates with the new streaming architecture to provide:
 * - Lazy dependency resolution
 * - Progressive component enhancement  
 * - Memory-efficient rendering
 * - Graceful degradation
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import WidgetWrapper from '../WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const StreamingWidgetWrapper = React.memo(({
  id,
  moduleId = 'canvas',
  ...props
}) => {
  const elementRef = useRef(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [enhancementStarted, setEnhancementStarted] = useState(false);

  // Get architecture instance from store
  const architecture = useStore((state) => state._architecture?.[moduleId], shallow);

  // Get resolved component state
  const resolvedComponent = useStore(
    (state) => state.getResolvedComponent(id, props.subContainerIndex, moduleId),
    shallow
  );

  // Check if we have a streaming architecture
  const isStreamingMode = useMemo(() => {
    return architecture && architecture.getStatus().strategy === 'streaming';
  }, [architecture]);

  /**
   * Setup intersection observer for lazy dependency resolution
   */
  useEffect(() => {
    if (!isStreamingMode || !architecture || enhancementStarted) return;

    const element = elementRef.current;
    if (!element) return;

    // Observe component for lazy loading
    architecture.observeComponent(element, id);
    setEnhancementStarted(true);

    // Cleanup observer on unmount
    return () => {
      if (architecture && element) {
        architecture.dependencyResolver?.unobserveComponent(element);
      }
    };
  }, [isStreamingMode, architecture, id, enhancementStarted]);

  /**
   * Handle component visibility and trigger dependency resolution
   */
  useEffect(() => {
    if (!isStreamingMode || !architecture || isEnhanced) return;

    // Listen for component enhancement completion
    const handleProgress = (event) => {
      const { componentId } = event.detail || {};
      if (componentId === id) {
        setIsEnhanced(true);
      }
    };

    window.addEventListener('tooljet-component-enhanced', handleProgress);

    return () => {
      window.removeEventListener('tooljet-component-enhanced', handleProgress);
    };
  }, [isStreamingMode, architecture, id, isEnhanced]);

  /**
   * Trigger manual dependency resolution on user interaction
   */
  const handleInteraction = async (event) => {
    if (!isStreamingMode || !architecture || isEnhanced) return;

    // User interacted with component - resolve dependencies immediately
    try {
      await architecture.resolveDependencies(id);
      setIsEnhanced(true);

      // Dispatch enhancement event
      window.dispatchEvent(new CustomEvent('tooljet-component-enhanced', {
        detail: { componentId: id, trigger: 'interaction' }
      }));
    } catch (error) {
      console.warn(`Failed to resolve dependencies for component ${id}:`, error);
    }
  };

  /**
   * Create enhanced props for the component
   */
  const enhancedProps = useMemo(() => {
    if (!isStreamingMode) {
      // Normal mode - pass through all props
      return props;
    }

    // Streaming mode - add interaction handlers and ref
    return {
      ...props,
      ref: elementRef,
      onClick: (event) => {
        handleInteraction(event);
        props.onClick?.(event);
      },
      onFocus: (event) => {
        handleInteraction(event);
        props.onFocus?.(event);
      },
      onMouseEnter: (event) => {
        // Preload on hover for better UX
        if (!isEnhanced && architecture) {
          architecture.resolveDependencies(id).catch(console.warn);
        }
        props.onMouseEnter?.(event);
      }
    };
  }, [isStreamingMode, props, isEnhanced, architecture, id]);

  /**
   * Render with streaming optimizations
   */
  if (isStreamingMode) {
    // Check if component has resolved data
    const hasResolvedData = resolvedComponent && Object.keys(resolvedComponent).length > 0;

    if (!hasResolvedData) {
      // Component not yet resolved - render lightweight placeholder
      return (
        <div
          ref={elementRef}
          data-component-id={id}
          className="streaming-component-placeholder"
          style={{
            minHeight: '20px',
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: '4px',
            position: 'relative'
          }}
          onClick={handleInteraction}
          onFocus={handleInteraction}
        >
          {/* Optional loading indicator */}
          {enhancementStarted && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '12px',
              color: '#666',
              pointerEvents: 'none'
            }}>
              Loading...
            </div>
          )}
        </div>
      );
    }
  }

  // Render normal WidgetWrapper with enhanced props
  return (
    <div
      ref={elementRef}
      data-component-id={id}
      className={isStreamingMode ? `streaming-component ${isEnhanced ? 'enhanced' : 'basic'}` : ''}
    >
      <WidgetWrapper
        id={id}
        moduleId={moduleId}
        {...enhancedProps}
      />
    </div>
  );
});

StreamingWidgetWrapper.displayName = 'StreamingWidgetWrapper';

export default StreamingWidgetWrapper;
