/**
 * CrashDiagnostics - Emergency crash detection and prevention for ToolJet
 * 
 * This tool identifies the exact cause of browser crashes by monitoring:
 * - Memory spikes during component rendering
 * - Infinite render loops
 * - Memory allocation patterns
 * - Component mount/unmount cycles
 * - Store state mutations
 */

class CrashDiagnostics {
  constructor() {
    this.componentRenderCounts = new Map();
    this.memorySnapshots = [];
    this.renderTimestamps = [];
    this.crashThreshold = 800 * 1024 * 1024; // 800MB crash threshold
    this.renderLoopThreshold = 50; // 50 renders in 1 second = loop
    this.isMonitoring = false;
    this.emergencyMode = false;

    this.init();
  }

  init() {
    console.log('🔬 CrashDiagnostics: Initializing emergency monitoring...');
    this.wrapReactRender();
    this.monitorMemorySpikes();
    this.detectInfiniteLoops();
    this.trackComponentLifecycle();
    this.startCrashPrevention();
  }

  /**
   * Wrap React rendering to detect render loops
   */
  wrapReactRender() {
    // Intercept React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const originalOnCommitFiberRoot = hook.onCommitFiberRoot;

      hook.onCommitFiberRoot = (id, root, ...args) => {
        this.trackRender(root);
        return originalOnCommitFiberRoot?.call(hook, id, root, ...args);
      };
    }

    // Monitor component render frequency
    this.monitorRenderFrequency();
  }

  /**
   * Track individual renders and detect loops
   */
  trackRender(root) {
    const now = Date.now();
    this.renderTimestamps.push(now);

    // Keep only last 60 seconds of renders
    this.renderTimestamps = this.renderTimestamps.filter(ts => now - ts < 60000);

    // Check for render explosion
    const recentRenders = this.renderTimestamps.filter(ts => now - ts < 1000);
    if (recentRenders.length > this.renderLoopThreshold) {
      console.error(`🚨 CRITICAL: ${recentRenders.length} renders in 1 second - INFINITE LOOP DETECTED!`);
      this.handleRenderLoop();
    }

    // Log render stats every 100 renders
    if (this.renderTimestamps.length % 100 === 0) {
      console.warn(`🔍 Render count: ${this.renderTimestamps.length} in last 60s`);
    }
  }

  /**
   * Monitor render frequency using performance observer
   */
  monitorRenderFrequency() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          if (entry.name.includes('React') || entry.name.includes('render')) {
            if (entry.duration > 100) { // Slow render
              console.warn(`🐌 Slow render detected: ${entry.name} took ${entry.duration}ms`);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (e) {
      console.warn('Could not monitor render performance:', e);
    }
  }

  /**
   * Monitor memory spikes in real-time
   */
  monitorMemorySpikes() {
    if (!window.performance?.memory) {
      console.warn('Memory monitoring not available');
      return;
    }

    setInterval(() => {
      const memory = window.performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);

      // Take memory snapshot
      this.memorySnapshots.push({
        used: usedMB,
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        timestamp: Date.now()
      });

      // Keep only last 10 minutes of snapshots
      this.memorySnapshots = this.memorySnapshots.filter(
        snap => Date.now() - snap.timestamp < 600000
      );

      // Check for memory spike
      if (this.memorySnapshots.length > 1) {
        const prev = this.memorySnapshots[this.memorySnapshots.length - 2];
        const increase = usedMB - prev.used;

        if (increase > 50) { // 50MB spike
          console.error(`🚨 MEMORY SPIKE: +${increase}MB in 1 second (now ${usedMB}MB)`);
          this.logMemoryState();
        }
      }

      // Critical memory level
      if (usedMB > this.crashThreshold / 1024 / 1024) {
        console.error(`🚨 CRITICAL MEMORY: ${usedMB}MB - CRASH IMMINENT!`);
        this.handleCriticalMemory();
      }

    }, 1000); // Check every second
  }

  /**
   * Detect infinite loops in useEffect and other hooks
   */
  detectInfiniteLoops() {
    // Monitor console errors for dependency warnings
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(' ');

      if (message.includes('Maximum update depth') ||
        message.includes('Warning: Maximum update depth exceeded')) {
        console.error('🚨 INFINITE LOOP DETECTED in React component!');
        this.logComponentState();
        this.handleRenderLoop();
      }

      return originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');

      if (message.includes('dependency array') ||
        message.includes('exhaustive-deps')) {
        console.warn('⚠️ Potential infinite loop: dependency issue detected');
      }

      return originalWarn.apply(console, args);
    };
  }

  /**
   * Track component lifecycle to identify problematic components
   */
  trackComponentLifecycle() {
    // Monitor component mount/unmount patterns
    this.componentMountCount = 0;
    this.componentUnmountCount = 0;

    // This is a simplified approach - in real React app you'd use DevTools
    setInterval(() => {
      const componentCount = document.querySelectorAll('[data-component]').length;

      if (componentCount > 300) { // Too many components
        console.warn(`⚠️ High component count: ${componentCount} active components`);
      }
    }, 5000);
  }

  /**
   * Start crash prevention monitoring
   */
  startCrashPrevention() {
    this.isMonitoring = true;

    // Monitor for browser freeze
    let lastHeartbeat = Date.now();
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const gap = now - lastHeartbeat;

      if (gap > 5000) { // 5 second freeze
        console.error(`🚨 BROWSER FREEZE DETECTED: ${gap}ms gap`);
        this.handleBrowserFreeze();
      }

      lastHeartbeat = now;
    }, 1000);

    // Emergency circuit breaker
    window.addEventListener('error', (event) => {
      console.error('🚨 JavaScript Error:', event.error);
      this.logCrashContext();
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
      this.logCrashContext();
    });
  }

  /**
   * Handle render loop emergency
   */
  handleRenderLoop() {
    if (this.emergencyMode) return;

    this.emergencyMode = true;
    console.error('🚨 EMERGENCY MODE: Stopping render loop...');

    // Try to break the render loop
    setTimeout(() => {
      if (window.memoryLeakDetector) {
        window.memoryLeakDetector.emergencyCleanup();
      }

      // Force garbage collection
      if (window.gc) {
        window.gc();
      }

      // Clear all intervals/timeouts
      for (let i = 1; i < 10000; i++) {
        clearInterval(i);
        clearTimeout(i);
      }

      console.log('🧹 Emergency render loop cleanup completed');
      this.emergencyMode = false;
    }, 100);
  }

  /**
   * Handle critical memory situation
   */
  handleCriticalMemory() {
    console.error('🚨 CRITICAL MEMORY - PREVENTING CRASH...');

    // Immediate emergency cleanup
    if (window.memoryLeakDetector) {
      window.memoryLeakDetector.emergencyCleanup();
    }

    // Clear browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Suggest page reload
    const shouldReload = confirm(
      'Memory usage is critical. Reload page to prevent crash?'
    );

    if (shouldReload) {
      window.location.reload();
    }
  }

  /**
   * Handle browser freeze
   */
  handleBrowserFreeze() {
    console.error('🚨 Browser freeze detected - emergency measures');

    // Break any potential loops
    this.handleRenderLoop();

    // Show emergency alert
    alert('Browser freeze detected! Check console for details.');
  }

  /**
   * Log current memory state for debugging
   */
  logMemoryState() {
    if (!window.performance?.memory) return;

    const memory = window.performance.memory;
    const report = {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      components: document.querySelectorAll('[data-component]').length,
      eventListeners: window.memoryLeakDetector?.trackedListeners?.size || 'unknown',
      observers: window.memoryLeakDetector?.trackedObservers?.size || 'unknown',
      renderCount: this.renderTimestamps.length
    };

    console.table(report);
    return report;
  }

  /**
   * Log component state for debugging
   */
  logComponentState() {
    const components = Array.from(document.querySelectorAll('[data-component]'));
    const componentCounts = {};

    components.forEach(el => {
      const type = el.getAttribute('data-component') || 'unknown';
      componentCounts[type] = (componentCounts[type] || 0) + 1;
    });

    console.table(componentCounts);
    console.log('Total components:', components.length);

    return componentCounts;
  }

  /**
   * Log crash context for debugging
   */
  logCrashContext() {
    console.error('🚨 CRASH CONTEXT:');

    const context = {
      memory: this.logMemoryState(),
      components: this.logComponentState(),
      recentRenders: this.renderTimestamps.slice(-10),
      memoryHistory: this.memorySnapshots.slice(-5),
      timestamp: new Date().toISOString()
    };

    console.log('Full crash context:', context);

    // Store in localStorage for post-crash analysis
    try {
      localStorage.setItem('lastCrashContext', JSON.stringify(context));
    } catch (e) {
      console.warn('Could not save crash context:', e);
    }

    return context;
  }

  /**
   * Get diagnostic report
   */
  getReport() {
    return {
      memory: this.logMemoryState(),
      components: this.logComponentState(),
      renderFrequency: this.renderTimestamps.length,
      emergencyMode: this.emergencyMode,
      monitoring: this.isMonitoring
    };
  }
}

// Initialize crash diagnostics
if (typeof window !== 'undefined') {
  window.crashDiagnostics = new CrashDiagnostics();

  // Expose debugging functions
  window.diagnoseCrash = () => {
    return window.crashDiagnostics.getReport();
  };

  window.emergencyStop = () => {
    window.crashDiagnostics.handleRenderLoop();
  };

  // Check for previous crash
  const lastCrash = localStorage.getItem('lastCrashContext');
  if (lastCrash) {
    console.warn('🔍 Previous crash detected:', JSON.parse(lastCrash));
    localStorage.removeItem('lastCrashContext');
  }
}

export default CrashDiagnostics;
