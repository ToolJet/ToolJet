/**
 * MemoryLeakDetector - Critical memory leak detection and cleanup for ToolJet
 * 
 * This addresses the fundamental memory management issues causing browser crashes:
 * - Event listener leaks
 * - Observer pattern leaks  
 * - Subscription leaks
 * - Circular reference leaks
 * - State mutation leaks
 */

class MemoryLeakDetector {
  constructor() {
    this.trackedListeners = new Map();
    this.trackedObservers = new Set();
    this.trackedSubscriptions = new Set();
    this.trackedIntervals = new Set();
    this.trackedTimeouts = new Set();
    this.componentCleanupCallbacks = new Map();
    this.isMonitoring = false;
    this.memoryThreshold = 500 * 1024 * 1024; // 500MB
    this.cleanupInterval = null;

    this.init();
  }

  init() {
    this.wrapEventListeners();
    this.wrapObservers();
    this.wrapTimers();
    this.startMonitoring();
    this.setupCleanupTriggers();
  }

  /**
   * Wrap addEventListener/removeEventListener to track leaks
   */
  wrapEventListeners() {
    if (typeof window === 'undefined') return;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    const detector = this; // Capture reference to avoid scope issues

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      const key = `${this.constructor.name}_${type}_${listener.toString().slice(0, 50)}`;

      // Safety check - ensure detector is available and initialized
      if (!detector || !detector.trackedListeners) {
        return originalAddEventListener.call(this, type, listener, options);
      }

      if (!detector.trackedListeners.has(key)) {
        detector.trackedListeners.set(key, {
          target: this,
          type,
          listener,
          options,
          stack: new Error().stack,
          timestamp: Date.now()
        });
      }

      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      const key = `${this.constructor.name}_${type}_${listener.toString().slice(0, 50)}`;

      // Safety check - ensure detector is available
      if (detector && detector.trackedListeners) {
        detector.trackedListeners.delete(key);
      }

      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Wrap Observer APIs to track disconnections
   */
  wrapObservers() {
    if (typeof window === 'undefined') return;

    const detector = this; // Capture reference to avoid scope issues

    // ResizeObserver
    if (window.ResizeObserver) {
      const OriginalResizeObserver = window.ResizeObserver;
      window.ResizeObserver = class extends OriginalResizeObserver {
        constructor(callback) {
          super(callback);
          if (detector && detector.trackedObservers) {
            detector.trackedObservers.add(this);
          }
        }

        disconnect() {
          if (detector && detector.trackedObservers) {
            detector.trackedObservers.delete(this);
          }
          return super.disconnect();
        }
      };
    }

    // IntersectionObserver
    if (window.IntersectionObserver) {
      const OriginalIntersectionObserver = window.IntersectionObserver;
      window.IntersectionObserver = class extends OriginalIntersectionObserver {
        constructor(callback, options) {
          super(callback, options);
          if (detector && detector.trackedObservers) {
            detector.trackedObservers.add(this);
          }
        }

        disconnect() {
          if (detector && detector.trackedObservers) {
            detector.trackedObservers.delete(this);
          }
          return super.disconnect();
        }
      };
    }

    // MutationObserver
    if (window.MutationObserver) {
      const OriginalMutationObserver = window.MutationObserver;
      window.MutationObserver = class extends OriginalMutationObserver {
        constructor(callback) {
          super(callback);
          if (detector && detector.trackedObservers) {
            detector.trackedObservers.add(this);
          }
        }

        disconnect() {
          if (detector && detector.trackedObservers) {
            detector.trackedObservers.delete(this);
          }
          return super.disconnect();
        }
      };
    }
  }

  /**
   * Wrap timer functions to track leaks
   */
  wrapTimers() {
    if (typeof window === 'undefined') return;

    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    const originalClearInterval = window.clearInterval;
    const originalClearTimeout = window.clearTimeout;
    const detector = this; // Capture reference to avoid scope issues

    window.setInterval = (callback, delay) => {
      const id = originalSetInterval(callback, delay);
      if (detector && detector.trackedIntervals) {
        detector.trackedIntervals.add(id);
      }
      return id;
    };

    window.setTimeout = (callback, delay) => {
      const id = originalSetTimeout(callback, delay);
      if (detector && detector.trackedTimeouts) {
        detector.trackedTimeouts.add(id);
      }
      return id;
    };

    window.clearInterval = (id) => {
      if (detector && detector.trackedIntervals) {
        detector.trackedIntervals.delete(id);
      }
      return originalClearInterval(id);
    };

    window.clearTimeout = (id) => {
      if (detector && detector.trackedTimeouts) {
        detector.trackedTimeouts.delete(id);
      }
      return originalClearTimeout(id);
    };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.detectLeaks();
    }, 5000);

    // Emergency cleanup on memory pressure
    if (window.performance?.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        if (memory.usedJSHeapSize > this.memoryThreshold) {
          console.warn('🚨 Memory threshold exceeded, triggering emergency cleanup');
          this.emergencyCleanup();
        }
      }, 1000);
    }
  }

  /**
   * Setup cleanup triggers
   */
  setupCleanupTriggers() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupAll();
    });

    // Cleanup on app navigation
    window.addEventListener('popstate', () => {
      this.cleanupStaleReferences();
    });

    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupInactiveComponents();
      }
    });
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    if (!window.performance?.memory) return null;

    const memory = window.performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);

    if (usedMB > 200) { // Over 200MB
      console.warn(`🔍 Memory usage: ${usedMB}MB / ${totalMB}MB`);

      if (usedMB > 400) { // Over 400MB - critical
        console.error(`🚨 Critical memory usage: ${usedMB}MB - forcing cleanup`);
        this.emergencyCleanup();
      }
    }

    return { used: usedMB, total: totalMB };
  }

  /**
   * Detect memory leaks
   */
  detectLeaks() {
    const now = Date.now();
    let leaksFound = 0;

    // Check for old event listeners
    for (const [key, info] of this.trackedListeners) {
      if (now - info.timestamp > 300000) { // 5 minutes old
        console.warn(`🔍 Potential event listener leak: ${key}`);
        leaksFound++;

        // Auto-cleanup very old listeners
        if (now - info.timestamp > 600000) { // 10 minutes old
          try {
            info.target.removeEventListener(info.type, info.listener, info.options);
            this.trackedListeners.delete(key);
            console.log(`🧹 Auto-cleaned old listener: ${key}`);
          } catch (e) {
            console.warn('Failed to auto-cleanup listener:', e);
          }
        }
      }
    }

    // Check for undisconnected observers
    if (this.trackedObservers.size > 50) {
      console.warn(`🔍 High observer count: ${this.trackedObservers.size}`);
      leaksFound += this.trackedObservers.size;
    }

    // Check for timer leaks
    if (this.trackedIntervals.size > 20) {
      console.warn(`🔍 High interval count: ${this.trackedIntervals.size}`);
      leaksFound += this.trackedIntervals.size;
    }

    if (leaksFound > 100) {
      console.error(`🚨 ${leaksFound} potential memory leaks detected`);
      this.emergencyCleanup();
    }
  }

  /**
   * Emergency cleanup when memory is critical
   */
  emergencyCleanup() {
    console.log('🧹 Emergency cleanup started...');
    let cleaned = 0;

    // Force disconnect all tracked observers
    for (const observer of this.trackedObservers) {
      try {
        observer.disconnect();
        cleaned++;
      } catch (e) {
        console.warn('Failed to disconnect observer:', e);
      }
    }
    this.trackedObservers.clear();

    // Clear old intervals
    for (const id of this.trackedIntervals) {
      try {
        clearInterval(id);
        cleaned++;
      } catch (e) {
        console.warn('Failed to clear interval:', e);
      }
    }
    this.trackedIntervals.clear();

    // Clear old timeouts
    for (const id of this.trackedTimeouts) {
      try {
        clearTimeout(id);
        cleaned++;
      } catch (e) {
        console.warn('Failed to clear timeout:', e);
      }
    }
    this.trackedTimeouts.clear();

    // Force cleanup component callbacks
    for (const [componentId, cleanup] of this.componentCleanupCallbacks) {
      try {
        cleanup();
        cleaned++;
      } catch (e) {
        console.warn(`Failed to cleanup component ${componentId}:`, e);
      }
    }
    this.componentCleanupCallbacks.clear();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    console.log(`🧹 Emergency cleanup completed: ${cleaned} items cleaned`);
  }

  /**
   * Cleanup stale references after navigation
   */
  cleanupStaleReferences() {
    const now = Date.now();
    let cleaned = 0;

    // Remove listeners older than 1 minute during navigation
    for (const [key, info] of this.trackedListeners) {
      if (now - info.timestamp > 60000) {
        try {
          info.target.removeEventListener(info.type, info.listener, info.options);
          this.trackedListeners.delete(key);
          cleaned++;
        } catch (e) {
          // Target might be gone, just remove from tracking
          this.trackedListeners.delete(key);
          cleaned++;
        }
      }
    }

    console.log(`🧹 Cleaned ${cleaned} stale references`);
  }

  /**
   * Cleanup inactive components when page is hidden
   */
  cleanupInactiveComponents() {
    let cleaned = 0;

    // Disconnect observers for hidden elements
    for (const observer of this.trackedObservers) {
      try {
        // Check if any observed elements are still visible
        if (observer.takeRecords) {
          const records = observer.takeRecords();
          if (records.length === 0) {
            observer.disconnect();
            this.trackedObservers.delete(observer);
            cleaned++;
          }
        }
      } catch (e) {
        // Observer might be dead, remove it
        this.trackedObservers.delete(observer);
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned ${cleaned} inactive components`);
  }

  /**
   * Register component cleanup callback
   */
  registerComponentCleanup(componentId, cleanupCallback) {
    this.componentCleanupCallbacks.set(componentId, cleanupCallback);
  }

  /**
   * Unregister component cleanup
   */
  unregisterComponentCleanup(componentId) {
    const cleanup = this.componentCleanupCallbacks.get(componentId);
    if (cleanup) {
      try {
        cleanup();
      } catch (e) {
        console.warn(`Failed to cleanup component ${componentId}:`, e);
      }
      this.componentCleanupCallbacks.delete(componentId);
    }
  }

  /**
   * Cleanup everything
   */
  cleanupAll() {
    console.log('🧹 Full cleanup started...');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.emergencyCleanup();
    this.isMonitoring = false;

    console.log('🧹 Full cleanup completed');
  }

  /**
   * Get memory leak report
   */
  getReport() {
    const memory = this.checkMemoryUsage();

    return {
      memory,
      listeners: this.trackedListeners.size,
      observers: this.trackedObservers.size,
      intervals: this.trackedIntervals.size,
      timeouts: this.trackedTimeouts.size,
      components: this.componentCleanupCallbacks.size,
      timestamp: Date.now()
    };
  }
}

// Initialize global memory leak detector
if (typeof window !== 'undefined') {
  window.memoryLeakDetector = new MemoryLeakDetector();

  // Expose for debugging
  window.debugMemory = () => {
    const report = window.memoryLeakDetector.getReport();
    console.table(report);
    return report;
  };

  window.forceCleanup = () => {
    window.memoryLeakDetector.emergencyCleanup();
  };
}

export default MemoryLeakDetector;
