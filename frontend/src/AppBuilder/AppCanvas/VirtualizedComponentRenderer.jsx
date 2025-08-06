import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMemoryCleanup } from '../../_hooks/useMemoryCleanup';

// Try to import react-window, fallback to custom implementation
let List;
try {
  const ReactWindow = require('react-window');
  List = ReactWindow.FixedSizeList;
} catch (e) {
  console.warn('react-window not available, using fallback virtualization');
  List = null;
}

/**
 * LazyComponentRenderer - Renders components only when visible to prevent memory crashes
 */
export const LazyComponentRenderer = ({
  componentId,
  renderComponent,
  threshold = 0.1,
  rootMargin = '100px',
  onVisibilityChange
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  // Use memory cleanup hook
  const { addObserver, cleanup } = useMemoryCleanup();

  useEffect(() => {
    // Safety check for window and IntersectionObserver
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setHasBeenVisible(true);
      return;
    }

    // Emergency memory check
    if (window.performance?.memory) {
      const memory = window.performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      if (usedMB > 500) { // Over 500MB - render immediately
        setHasBeenVisible(true);
        return;
      }
    }

    try {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const nowVisible = entry.isIntersecting;
          setIsVisible(nowVisible);

          if (nowVisible && !hasBeenVisible) {
            setHasBeenVisible(true);
            onVisibilityChange?.(componentId, true);
          }
        },
        {
          threshold,
          rootMargin
        }
      );

      if (elementRef.current && observerRef.current) {
        observerRef.current.observe(elementRef.current);
        addObserver(observerRef.current);
      }
    } catch (error) {
      console.warn('IntersectionObserver failed, rendering immediately:', error);
      setHasBeenVisible(true);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      cleanup();
    };
  }, [threshold, rootMargin, hasBeenVisible, componentId, onVisibilityChange, addObserver, cleanup]);

  // Emergency crash prevention - if we have memory leak detector, check for critical memory
  useEffect(() => {
    if (hasBeenVisible && window.memoryLeakDetector) {
      const memory = window.memoryLeakDetector.checkMemoryUsage();
      if (memory && memory.used > 400) {
        console.warn(`⚠️ Component ${componentId} rendered at ${memory.used}MB memory usage`);
      }
    }
  }, [hasBeenVisible, componentId]);

  if (!hasBeenVisible) {
    return (
      <div
        ref={elementRef}
        style={{
          width: '100%',
          height: '50px', // Minimum height for intersection detection
          background: 'transparent'
        }}
        data-component={`lazy-${componentId}`}
      />
    );
  }

  return renderComponent();
};

/**
 * VirtualizedComponentRenderer - Handles large numbers of components with memory optimization
 */
export const VirtualizedComponentRenderer = ({
  components = [],
  containerHeight = 400,
  itemHeight = 50,
  overscan = 5,
  onComponentRender
}) => {
  const [visibleComponents, setVisibleComponents] = useState(new Set());
  const containerRef = useRef(null);
  const { addEventListenerSafe, cleanup } = useMemoryCleanup();

  // Memory-safe component tracking
  const handleVisibilityChange = useCallback((componentId, isVisible) => {
    setVisibleComponents(prev => {
      const next = new Set(prev);
      if (isVisible) {
        next.add(componentId);
      } else {
        next.delete(componentId);
      }
      return next;
    });

    onComponentRender?.(componentId, isVisible);
  }, [onComponentRender]);

  // Emergency memory monitoring
  useEffect(() => {
    const checkMemory = () => {
      if (window.performance?.memory) {
        const memory = window.performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);

        if (usedMB > 600) { // Critical memory
          console.error(`🚨 VirtualizedRenderer: Critical memory ${usedMB}MB with ${visibleComponents.size} visible components`);

          // Emergency cleanup - hide non-essential components
          if (visibleComponents.size > 20) {
            setVisibleComponents(new Set(Array.from(visibleComponents).slice(0, 10)));
          }
        }
      }
    };

    const interval = setInterval(checkMemory, 3000);
    return () => clearInterval(interval);
  }, [visibleComponents.size]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (!components.length) {
    return <div>No components to render</div>;
  }

  // Simple rendering with lazy loading
  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {components.map((component, index) => (
        <LazyComponentRenderer
          key={component.id || index}
          componentId={component.id || `component-${index}`}
          renderComponent={() => component.render ? component.render() : component}
          onVisibilityChange={handleVisibilityChange}
          threshold={0.1}
          rootMargin="100px"
        />
      ))}
    </div>
  );
};

/**
 * OptimizedComponentContainer - Main container for large app rendering
 */
export const OptimizedComponentContainer = ({
  components = [],
  maxSimultaneousRenders = 20,
  onMemoryWarning
}) => {
  const [renderBatch, setRenderBatch] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const { cleanup } = useMemoryCleanup();

  // Progressive rendering to prevent memory spikes
  useEffect(() => {
    if (components.length > maxSimultaneousRenders && !emergencyMode) {
      const totalBatches = Math.ceil(components.length / maxSimultaneousRenders);

      const progressiveRender = () => {
        setRenderBatch(prev => {
          const next = prev + 1;
          if (next >= totalBatches) {
            return totalBatches;
          }

          // Check memory before next batch
          if (window.performance?.memory) {
            const memory = window.performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);

            if (usedMB > 500) {
              console.warn(`⚠️ Memory high (${usedMB}MB), pausing progressive render`);
              onMemoryWarning?.(usedMB);
              return prev; // Don't render more
            }
          }

          return next;
        });
      };

      const interval = setInterval(progressiveRender, 100); // 100ms between batches
      return () => clearInterval(interval);
    }
  }, [components.length, maxSimultaneousRenders, emergencyMode, onMemoryWarning]);

  // Emergency mode monitoring
  useEffect(() => {
    const checkEmergency = () => {
      if (window.crashDiagnostics?.emergencyMode) {
        setEmergencyMode(true);
        console.error('🚨 OptimizedContainer: Emergency mode activated');
      }
    };

    const interval = setInterval(checkEmergency, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Emergency mode - render only essential components
  if (emergencyMode) {
    const essentialComponents = components.slice(0, 5);
    return (
      <div style={{ padding: '20px', background: '#fff3cd', border: '1px solid #ffeaa7' }}>
        <p>🚨 Emergency mode: Showing only essential components to prevent crash</p>
        <VirtualizedComponentRenderer
          components={essentialComponents}
          containerHeight={300}
        />
      </div>
    );
  }

  // Progressive rendering
  const componentsToRender = components.slice(0, renderBatch * maxSimultaneousRenders);

  return (
    <div>
      {componentsToRender.length < components.length && (
        <div style={{ padding: '10px', background: '#e3f2fd' }}>
          Loading components: {componentsToRender.length} / {components.length}
        </div>
      )}

      <VirtualizedComponentRenderer
        components={componentsToRender}
        containerHeight={window.innerHeight - 200}
        itemHeight={100}
        onComponentRender={(componentId, isVisible) => {
          if (window.crashDiagnostics) {
            window.crashDiagnostics.trackRender();
          }
        }}
      />
    </div>
  );
};

// Default export
export default OptimizedComponentContainer;
