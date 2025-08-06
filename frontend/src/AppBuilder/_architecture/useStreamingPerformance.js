/**
 * useStreamingPerformance - Hook for monitoring streaming architecture performance
 * 
 * Provides real-time metrics and warnings for the new streaming architecture
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '@/AppBuilder/_stores/store';

export const useStreamingPerformance = (moduleId = 'canvas') => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    componentsLoaded: 0,
    componentsTotal: 0,
    enhancementQueue: 0,
    renderTime: 0,
    strategy: 'unknown',
    warnings: []
  });

  const [isVisible, setIsVisible] = useState(false);
  const metricsRef = useRef(metrics);
  const intervalRef = useRef(null);

  // Get architecture instance
  const architecture = useStore((state) => state._architecture?.[moduleId]);

  /**
   * Calculate memory usage estimation
   */
  const estimateMemoryUsage = useCallback(() => {
    if (!window.performance?.memory) return 0;

    const memory = window.performance.memory;
    return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
  }, []);

  /**
   * Get component loading statistics
   */
  const getComponentStats = useCallback(() => {
    const components = useStore.getState().components || {};
    const resolvedComponents = useStore.getState().resolvedComponents || {};

    const total = Object.keys(components).length;
    const loaded = Object.keys(resolvedComponents).length;

    return { total, loaded };
  }, []);

  /**
   * Update metrics
   */
  const updateMetrics = useCallback(() => {
    if (!architecture) return;

    const status = architecture.getStatus();
    const { total, loaded } = getComponentStats();
    const memoryUsage = estimateMemoryUsage();

    const newMetrics = {
      memoryUsage,
      componentsLoaded: loaded,
      componentsTotal: total,
      enhancementQueue: status.enhancementQueue || 0,
      renderTime: status.lastRenderTime || 0,
      strategy: status.strategy || 'unknown',
      warnings: []
    };

    // Generate warnings
    if (memoryUsage > 1000) { // > 1GB
      newMetrics.warnings.push({
        type: 'memory',
        level: 'error',
        message: `High memory usage: ${memoryUsage}MB`
      });
    } else if (memoryUsage > 500) { // > 500MB
      newMetrics.warnings.push({
        type: 'memory',
        level: 'warning',
        message: `Elevated memory usage: ${memoryUsage}MB`
      });
    }

    if (newMetrics.enhancementQueue > 20) {
      newMetrics.warnings.push({
        type: 'queue',
        level: 'warning',
        message: `Large enhancement queue: ${newMetrics.enhancementQueue}`
      });
    }

    if (newMetrics.renderTime > 100) {
      newMetrics.warnings.push({
        type: 'performance',
        level: 'warning',
        message: `Slow render time: ${newMetrics.renderTime}ms`
      });
    }

    metricsRef.current = newMetrics;
    setMetrics(newMetrics);
  }, [architecture, getComponentStats, estimateMemoryUsage]);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update
  }, [updateMetrics]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Toggle visibility
   */
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  /**
   * Clear warnings
   */
  const clearWarnings = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      warnings: []
    }));
  }, []);

  /**
   * Get performance level
   */
  const getPerformanceLevel = useCallback(() => {
    const { memoryUsage, renderTime, warnings } = metricsRef.current;

    if (warnings.some(w => w.level === 'error') || memoryUsage > 1000) {
      return 'error';
    }

    if (warnings.some(w => w.level === 'warning') || memoryUsage > 500 || renderTime > 100) {
      return 'warning';
    }

    return 'good';
  }, []);

  /**
   * Force garbage collection (if available)
   */
  const forceGarbageCollection = useCallback(() => {
    if (window.gc) {
      window.gc();
      setTimeout(updateMetrics, 100);
    } else {
      console.warn('Garbage collection not available. Run Chrome with --js-flags="--expose-gc"');
    }
  }, [updateMetrics]);

  /**
   * Export performance data
   */
  const exportMetrics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: metricsRef.current,
      architecture: architecture?.getStatus(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tooljet-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [architecture]);

  // Setup monitoring when architecture is available
  useEffect(() => {
    if (architecture) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return stopMonitoring;
  }, [architecture, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return stopMonitoring;
  }, [stopMonitoring]);

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl+Shift+M to toggle metrics
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        toggleVisibility();
      }

      // Ctrl+Shift+G for garbage collection
      if (event.ctrlKey && event.shiftKey && event.key === 'G') {
        event.preventDefault();
        forceGarbageCollection();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleVisibility, forceGarbageCollection]);

  return {
    metrics,
    isVisible,
    toggleVisibility,
    clearWarnings,
    getPerformanceLevel,
    forceGarbageCollection,
    exportMetrics,
    startMonitoring,
    stopMonitoring
  };
};

/**
 * PerformanceDebugOverlay - Visual component for displaying metrics
 */
export const PerformanceDebugOverlay = ({ moduleId = 'canvas' }) => {
  const {
    metrics,
    isVisible,
    toggleVisibility,
    clearWarnings,
    getPerformanceLevel,
    forceGarbageCollection,
    exportMetrics
  } = useStreamingPerformance(moduleId);

  if (!isVisible) {
    return (
      <div
        className="streaming-debug-toggle"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#333',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 10000,
          opacity: 0.7
        }}
        onClick={toggleVisibility}
        title="Click to show performance metrics (Ctrl+Shift+M)"
      >
        📊
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel();

  return (
    <div className={`streaming-debug-overlay ${!isVisible ? 'hidden' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>Streaming Performance</strong>
        <div>
          <button
            onClick={forceGarbageCollection}
            style={{
              background: 'none',
              border: '1px solid #666',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px',
              marginRight: '5px'
            }}
            title="Force garbage collection (Ctrl+Shift+G)"
          >
            GC
          </button>
          <button
            onClick={exportMetrics}
            style={{
              background: 'none',
              border: '1px solid #666',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px',
              marginRight: '5px'
            }}
            title="Export metrics"
          >
            📁
          </button>
          <button
            onClick={toggleVisibility}
            style={{
              background: 'none',
              border: '1px solid #666',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="streaming-debug-metric">
        <span className="label">Memory:</span>
        <span className={`value ${metrics.memoryUsage > 500 ? 'warning' : 'good'}`}>
          {metrics.memoryUsage}MB
        </span>
      </div>

      <div className="streaming-debug-metric">
        <span className="label">Components:</span>
        <span className="value">
          {metrics.componentsLoaded}/{metrics.componentsTotal}
        </span>
      </div>

      <div className="streaming-debug-metric">
        <span className="label">Enhancement Queue:</span>
        <span className={`value ${metrics.enhancementQueue > 10 ? 'warning' : 'good'}`}>
          {metrics.enhancementQueue}
        </span>
      </div>

      <div className="streaming-debug-metric">
        <span className="label">Render Time:</span>
        <span className={`value ${metrics.renderTime > 50 ? 'warning' : 'good'}`}>
          {metrics.renderTime}ms
        </span>
      </div>

      <div className="streaming-debug-metric">
        <span className="label">Strategy:</span>
        <span className="value">{metrics.strategy}</span>
      </div>

      <div className="streaming-debug-metric">
        <span className="label">Performance:</span>
        <span className={`value ${performanceLevel}`}>
          {performanceLevel.toUpperCase()}
        </span>
      </div>

      {metrics.warnings.length > 0 && (
        <div style={{ marginTop: '10px', padding: '5px', background: 'rgba(255,193,7,0.2)', borderRadius: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#ff9800', fontSize: '11px' }}>Warnings:</strong>
            <button
              onClick={clearWarnings}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff9800',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Clear
            </button>
          </div>
          {metrics.warnings.map((warning, index) => (
            <div key={index} style={{ fontSize: '10px', color: '#ff9800', marginTop: '2px' }}>
              {warning.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#999' }}>
        Press Ctrl+Shift+M to toggle
      </div>
    </div>
  );
};

export default useStreamingPerformance;
