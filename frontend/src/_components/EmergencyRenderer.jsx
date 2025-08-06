/**
 * EmergencyRenderer - Crash-safe component rendering for large ToolJet apps
 * 
 * This prevents browser crashes by:
 * - Rendering components in batches
 * - Monitoring memory during render
 * - Stopping render if memory gets critical
 * - Using emergency fallbacks for problematic components
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export const EmergencyRenderer = ({
  components = [],
  batchSize = 10,
  renderDelay = 16,
  memoryThreshold = 400,
  onCrashPrevented,
  children
}) => {
  const [renderedCount, setRenderedCount] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const renderTimeoutRef = useRef(null);
  const memoryCheckRef = useRef(null);

  // Monitor memory during rendering
  const checkMemory = useCallback(() => {
    if (window.performance?.memory) {
      const usedMB = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
      setMemoryUsage(usedMB);

      if (usedMB > memoryThreshold) {
        console.error(`🚨 EmergencyRenderer: Memory critical (${usedMB}MB) - stopping render`);
        setEmergencyMode(true);
        onCrashPrevented?.({
          reason: 'memory_critical',
          memoryUsage: usedMB,
          renderedCount,
          totalComponents: components.length
        });
        return true; // Critical memory
      }
    }
    return false; // Safe to continue
  }, [memoryThreshold, renderedCount, components.length, onCrashPrevented]);

  // Batch rendering with memory checks
  const renderNextBatch = useCallback(() => {
    if (emergencyMode) return;

    // Check memory before rendering
    if (checkMemory()) return;

    const nextCount = Math.min(renderedCount + batchSize, components.length);

    if (nextCount > renderedCount) {
      setRenderedCount(nextCount);

      // Schedule next batch with delay
      if (nextCount < components.length) {
        renderTimeoutRef.current = setTimeout(renderNextBatch, renderDelay);
      }
    }
  }, [renderedCount, batchSize, components.length, renderDelay, emergencyMode, checkMemory]);

  // Start rendering process
  useEffect(() => {
    if (components.length === 0) return;

    console.log(`🚀 EmergencyRenderer: Starting batch render of ${components.length} components`);

    // Start memory monitoring
    memoryCheckRef.current = setInterval(checkMemory, 1000);

    // Start rendering
    renderNextBatch();

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (memoryCheckRef.current) {
        clearInterval(memoryCheckRef.current);
      }
    };
  }, [components.length, renderNextBatch, checkMemory]);

  // Reset when components change
  useEffect(() => {
    setRenderedCount(0);
    setEmergencyMode(false);
  }, [components]);

  // Emergency mode - render minimal fallback
  if (emergencyMode) {
    return (
      <div className="emergency-mode-notice" style={{
        padding: '20px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        margin: '10px'
      }}>
        <h3>⚠️ Emergency Mode Active</h3>
        <p>
          Too many components to render safely ({components.length} total).
          Showing {renderedCount} components to prevent browser crash.
        </p>
        <p>Memory usage: {memoryUsage}MB</p>
        <button
          onClick={() => {
            setEmergencyMode(false);
            setRenderedCount(0);
          }}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Normal rendering
  const componentsToRender = components.slice(0, renderedCount);
  const progress = (renderedCount / components.length) * 100;

  return (
    <div className="emergency-renderer">
      {/* Progress indicator during loading */}
      {renderedCount < components.length && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10000
        }}>
          Loading: {progress.toFixed(0)}% ({renderedCount}/{components.length})
          <br />
          Memory: {memoryUsage}MB
        </div>
      )}

      {/* Render components safely */}
      {componentsToRender.map((component, index) => (
        <EmergencyComponentWrapper key={component.id || index} index={index}>
          {typeof children === 'function' ? children(component, index) : component}
        </EmergencyComponentWrapper>
      ))}
    </div>
  );
};

// Wrapper for individual components with error boundaries
const EmergencyComponentWrapper = ({ children, index }) => {
  const [hasError, setHasError] = useState(false);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);

      // Log slow renders
      if (endTime - startTime > 100) {
        console.warn(`🐌 Slow component render: ${index} took ${(endTime - startTime).toFixed(2)}ms`);
      }
    };
  }, [index]);

  if (hasError) {
    return (
      <div style={{
        padding: '10px',
        background: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        margin: '5px'
      }}>
        ⚠️ Component {index} failed to render
      </div>
    );
  }

  try {
    return children;
  } catch (error) {
    console.error(`Component ${index} render error:`, error);
    setHasError(true);
    return null;
  }
};

export default EmergencyRenderer;
