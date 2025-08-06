// Performance-optimized utilities for large apps
import { cloneDeep } from 'lodash';

/**
 * Async deep clone for large objects to prevent UI blocking
 * @param {*} obj - Object to clone
 * @returns {Promise} - Cloned object
 */
export function asyncDeepClone(obj) {
  return new Promise((resolve) => {
    // Use requestIdleCallback if available, fallback to setTimeout
    const cloneCallback = () => {
      const cloned = cloneDeep(obj);
      resolve(cloned);
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(cloneCallback, { timeout: 100 });
    } else {
      setTimeout(cloneCallback, 0);
    }
  });
}

/**
 * Batched component processing to prevent UI blocking
 * @param {Array} components - Array of components to process
 * @param {Function} processor - Function to process each component
 * @param {number} batchSize - Number of components per batch
 * @returns {Promise} - Processed components
 */
export async function batchProcessComponents(components, processor, batchSize = 10) {
  const results = [];
  const componentEntries = Array.isArray(components) ? components : Object.entries(components);
  const totalBatches = Math.ceil(componentEntries.length / batchSize);

  // Emit progress start event
  window.dispatchEvent(new CustomEvent('tooljet-load-progress', {
    detail: {
      step: 'Processing Components',
      progress: 0,
      total: componentEntries.length
    }
  }));

  for (let i = 0; i < componentEntries.length; i += batchSize) {
    const batch = componentEntries.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} components)`);

    // Process batch
    const batchResults = await Promise.all(
      batch.map(async (component) => {
        return new Promise((resolve) => {
          // Use requestIdleCallback for non-blocking processing
          const processCallback = () => resolve(processor(component));

          if (window.requestIdleCallback) {
            window.requestIdleCallback(processCallback, { timeout: 50 });
          } else {
            setTimeout(processCallback, 0);
          }
        });
      })
    );

    results.push(...batchResults);

    // Emit progress update
    const processed = Math.min(i + batchSize, componentEntries.length);
    window.dispatchEvent(new CustomEvent('tooljet-load-progress', {
      detail: {
        step: 'Processing Components',
        progress: processed,
        total: componentEntries.length
      }
    }));

    // Memory optimization: Clear intermediate objects every 3 batches
    if (batchNumber % 3 === 0) {
      // Clear any temporary objects that might be holding references
      batchResults.length = 0;

      // Force browser to clean up memory if possible
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          // Memory cleanup hint - let browser optimize during idle time
          if (window.gc && typeof window.gc === 'function') {
            try { window.gc(); } catch (e) { /* Silently ignore if not available */ }
          }
        }, { timeout: 100 });
      }
    }

    // Yield control to browser after each batch with longer delay for memory relief
    await new Promise(resolve => setTimeout(resolve, batchNumber % 3 === 0 ? 10 : 2));
  }

  return results;
}

/**
 * Optimized JSON operations for large objects
 */
export const optimizedJSON = {
  /**
   * Async JSON stringify for large objects
   */
  stringifyAsync(obj) {
    return new Promise((resolve) => {
      const callback = () => resolve(JSON.stringify(obj));

      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback, { timeout: 100 });
      } else {
        setTimeout(callback, 0);
      }
    });
  },

  /**
   * Async JSON parse for large strings
   */
  parseAsync(str) {
    return new Promise((resolve) => {
      const callback = () => resolve(JSON.parse(str));

      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback, { timeout: 100 });
      } else {
        setTimeout(callback, 0);
      }
    });
  },

  /**
   * Safe deep clone that doesn't block UI
   */
  async deepCloneAsync(obj) {
    const str = await this.stringifyAsync(obj);
    return await this.parseAsync(str);
  }
};

/**
 * Component loading progress tracker
 */
export class LoadingProgressTracker {
  constructor(total) {
    this.total = total;
    this.completed = 0;
    this.callbacks = [];
  }

  increment() {
    this.completed++;
    const progress = (this.completed / this.total) * 100;
    this.callbacks.forEach(callback => callback(progress));
  }

  onProgress(callback) {
    this.callbacks.push(callback);
  }

  reset(total) {
    this.total = total;
    this.completed = 0;
  }
}

/**
 * Performance monitoring utilities for debugging large app loading issues
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
    this.componentTimes = new Map();
  }

  startTiming(label) {
    const timestamp = performance.now();
    this.marks.set(label, timestamp);
    performance.mark(`${label}-start`);

    console.log(`🚀 [${label}] Started at ${timestamp.toFixed(2)}ms`);
  }

  endTiming(label) {
    const endTime = performance.now();
    const startTime = this.marks.get(label);

    if (startTime) {
      const duration = endTime - startTime;
      this.measures.set(label, duration);

      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      console.log(`⏱️ [${label}] Completed in ${duration.toFixed(2)}ms`);

      // Warn if operation takes too long
      if (duration > 100) {
        console.warn(`⚠️ [${label}] SLOW OPERATION: ${duration.toFixed(2)}ms`);
      }

      return duration;
    }

    console.error(`❌ [${label}] No start time found`);
    return 0;
  }

  trackComponentRender(componentName, renderFn) {
    return (...args) => {
      this.startTiming(`Component-${componentName}`);
      const result = renderFn(...args);
      this.endTiming(`Component-${componentName}`);
      return result;
    };
  }

  getReport() {
    const report = {
      totalMeasures: this.measures.size,
      slowOperations: [],
      averageTimes: {},
      recommendations: []
    };

    // Find slow operations
    this.measures.forEach((duration, label) => {
      if (duration > 100) {
        report.slowOperations.push({ label, duration: duration.toFixed(2) });
      }
    });

    // Generate recommendations
    if (report.slowOperations.length > 0) {
      report.recommendations.push('Consider implementing async processing for slow operations');
    }

    return report;
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
    this.componentTimes.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Memory usage tracker for large apps
 */
export class MemoryTracker {
  static logMemoryUsage(label = 'Memory Check') {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;

      console.log(`📊 [${label}] Memory Usage:`, {
        used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2)}%`
      });

      // Warn if memory usage is high
      if (usedJSHeapSize / jsHeapSizeLimit > 0.8) {
        console.warn(`⚠️ High memory usage detected: ${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2)}%`);
      }
    }
  }

  static async forceGarbageCollection() {
    if (window.gc) {
      window.gc();
      console.log('🗑️ Garbage collection triggered');
    } else {
      console.log('💡 To enable garbage collection, run Chrome with --js-flags="--expose-gc"');
    }
  }
}

/**
 * Component count analyzer for identifying bottlenecks
 */
export function analyzeComponentStructure(components) {
  const analysis = {
    totalComponents: 0,
    componentsByType: {},
    deepestNesting: 0,
    largestComponents: [],
    recommendations: []
  };

  function analyzeComponent(component, depth = 0) {
    analysis.totalComponents++;
    analysis.deepestNesting = Math.max(analysis.deepestNesting, depth);

    const type = component.component?.component;
    if (type) {
      analysis.componentsByType[type] = (analysis.componentsByType[type] || 0) + 1;
    }

    // Check for large component definitions
    const componentSize = JSON.stringify(component).length;
    if (componentSize > 10000) { // 10KB threshold
      analysis.largestComponents.push({
        id: component.id,
        type,
        size: componentSize,
        depth
      });
    }

    // Recursively analyze children
    if (component.children) {
      Object.values(component.children).forEach(child => {
        analyzeComponent(child, depth + 1);
      });
    }
  }

  if (components) {
    Object.values(components).forEach(component => {
      analyzeComponent(component);
    });
  }

  // Generate recommendations
  if (analysis.totalComponents > 100) {
    analysis.recommendations.push('Consider component virtualization for better performance');
  }

  if (analysis.deepestNesting > 10) {
    analysis.recommendations.push('Deep component nesting detected - consider flattening structure');
  }

  if (analysis.largestComponents.length > 0) {
    analysis.recommendations.push('Large components detected - consider breaking them down');
  }

  return analysis;
}
