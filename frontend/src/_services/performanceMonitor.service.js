import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

class PerformanceMonitorService {
  constructor() {
    // Disable in production to avoid any overhead
    this.isProductionDisabled = process.env.NODE_ENV === 'production' && 
                               process.env.REACT_APP_ENABLE_PERFORMANCE_MONITOR !== 'true';
    
    this.metrics = {
      memory: { used: 0, total: 0, percent: 0 },
      fps: { current: 0, avg: 0, min: 60, max: 0 },
      frameDrops: { count: 0, lastDropTime: null, highestDropTime: null, rate: 0 },
      webVitals: {
        CLS: null,
        FCP: null,
        FID: null,
        LCP: null,
        TTFB: null,
      },
      pageLoad: {
        loadTime: null,
        domContentLoaded: null,
        timeToInteractive: null,
        renderTime: null,
      },
      app: {
        initTime: null,
        queries: 0,
        canvasRenderTime: null,
        mountCount: 0,
        viewerMountTime: null,
        dataLoadTime: null,
        onLoadQueriesTime: null,
        totalAppLoadTime: null,
      },
    };

    this.listeners = new Set();
    this.isMonitoring = false;
    this.frameTimestamps = [];
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.startTime = performance.now();
    this.appStartTime = performance.now();
    this.updateThrottle = 0; // Throttle UI updates
    this.highestDropTimeMs = 0; // Cache as number for faster comparison

    this.initWebVitals();
    this.initPageLoadMetrics();
    this.initMemoryMonitoring();
  }

  initWebVitals() {
    onCLS((metric) => {
      this.metrics.webVitals.CLS = metric.value.toFixed(3);
      this.notifyListeners();
    });

    onFCP((metric) => {
      this.metrics.webVitals.FCP = this.formatTime(metric.value);
      this.notifyListeners();
    });

    onINP((metric) => {
      this.metrics.webVitals.FID = this.formatTime(metric.value);
      this.notifyListeners();
    });

    onLCP((metric) => {
      this.metrics.webVitals.LCP = this.formatTime(metric.value);
      this.notifyListeners();
    });

    onTTFB((metric) => {
      this.metrics.webVitals.TTFB = this.formatTime(metric.value);
      this.notifyListeners();
    });

    // Also get FCP from paint entries for accuracy
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.pageLoad.renderTime = this.formatTime(entry.startTime);
            this.notifyListeners();
          }
        }
      });

      try {
        observer.observe({ type: 'paint', buffered: true });
      } catch (e) {
        // Fallback for browsers that don't support paint entries
      }
    }
  }

  initPageLoadMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0] || {};

      if (perfData.loadEventEnd && perfData.fetchStart) {
        this.metrics.pageLoad.loadTime = this.formatTime(perfData.loadEventEnd - perfData.fetchStart);
      }

      if (perfData.domContentLoadedEventEnd && perfData.fetchStart) {
        this.metrics.pageLoad.domContentLoaded = this.formatTime(
          perfData.domContentLoadedEventEnd - perfData.fetchStart
        );
      }

      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.getEntriesByType('navigation')[0] || {};
          if (perfData.loadEventEnd && perfData.fetchStart) {
            this.metrics.pageLoad.loadTime = this.formatTime(perfData.loadEventEnd - perfData.fetchStart);
          }

          if (perfData.domInteractive && perfData.fetchStart) {
            this.metrics.pageLoad.timeToInteractive = this.formatTime(perfData.domInteractive - perfData.fetchStart);
          }

          const paintEntries = window.performance.getEntriesByType('paint');
          const firstContentfulPaint = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
          if (firstContentfulPaint) {
            this.metrics.pageLoad.renderTime = this.formatTime(firstContentfulPaint.startTime);
          }

          this.notifyListeners();
        }, 100);
      });
    }
  }

  initMemoryMonitoring() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        this.metrics.memory.used = (memory.usedJSHeapSize / 1048576).toFixed(2);
        this.metrics.memory.total = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
        this.metrics.memory.percent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);
        this.notifyListeners();
      }, 1000);
    }
  }

  startMonitoring() {
    if (this.isProductionDisabled || this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameTimestamps = [];
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.monitorFPS();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  monitorFPS() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    this.frameTimestamps.push(currentTime);
    this.frameTimestamps = this.frameTimestamps.filter((t) => currentTime - t < 1000);

    const currentFPS = this.frameTimestamps.length;
    this.metrics.fps.current = currentFPS;

    this.frameCount++;
    const avgFPS = this.frameCount / ((currentTime - this.startTime) / 1000);
    this.metrics.fps.avg = Math.round(avgFPS);

    if (currentFPS < this.metrics.fps.min && currentFPS > 0) {
      this.metrics.fps.min = currentFPS;
    }
    if (currentFPS > this.metrics.fps.max) {
      this.metrics.fps.max = currentFPS;
    }

    if (deltaTime > 50) {
      this.metrics.frameDrops.count++;
      if (deltaTime < 20000) {
        this.metrics.frameDrops.lastDropTime = this.formatTime(deltaTime);

        // Track highest frame drop (optimized - avoid string parsing)
        if (deltaTime > this.highestDropTimeMs) {
          this.highestDropTimeMs = deltaTime;
          this.metrics.frameDrops.highestDropTime = this.formatTime(deltaTime);
        }
      }
    }

    const elapsedSeconds = (currentTime - this.startTime) / 1000;
    if (elapsedSeconds > 0) {
      this.metrics.frameDrops.rate = (this.metrics.frameDrops.count / elapsedSeconds).toFixed(2);
    }

    this.lastFrameTime = currentTime;
    
    // Throttle UI updates to every 4 frames (~15fps updates instead of 60fps)
    this.updateThrottle++;
    if (this.updateThrottle >= 4) {
      this.updateThrottle = 0;
      this.notifyListeners();
    }

    this.animationFrameId = requestAnimationFrame(() => this.monitorFPS());
  }

  trackAppInit() {
    this.metrics.app.initTime = this.formatTime(performance.now() - this.appStartTime);
    this.notifyListeners();
  }

  trackQuery() {
    if (this.isProductionDisabled) return;
    this.metrics.app.queries++;
    this.notifyListeners();
  }

  trackCanvasRender(startTime) {
    this.metrics.app.canvasRenderTime = this.formatTime(performance.now() - startTime);
    this.notifyListeners();
  }

  trackComponentMount() {
    this.metrics.app.mountCount++;
    this.notifyListeners();
  }

  // App-specific timing methods
  trackViewerMount(startTime) {
    this.metrics.app.viewerMountTime = this.formatTime(performance.now() - startTime);
    this.updateTotalAppLoadTime();
    this.notifyListeners();
  }

  trackDataLoad(startTime) {
    this.metrics.app.dataLoadTime = this.formatTime(performance.now() - startTime);
    this.updateTotalAppLoadTime();
    this.notifyListeners();
  }

  trackOnLoadQueries(startTime) {
    this.metrics.app.onLoadQueriesTime = this.formatTime(performance.now() - startTime);
    this.updateTotalAppLoadTime();
    this.notifyListeners();
  }

  updateTotalAppLoadTime() {
    // Calculate total app load time from component metrics
    const times = [
      this.parseTime(this.metrics.app.viewerMountTime),
      this.parseTime(this.metrics.app.dataLoadTime),
      this.parseTime(this.metrics.app.onLoadQueriesTime),
    ].filter((t) => t !== null);

    if (times.length > 0) {
      const maxTime = Math.max(...times);
      this.metrics.app.totalAppLoadTime = this.formatTime(maxTime);
    }
  }

  parseTime(timeStr) {
    if (!timeStr) return null;
    const value = parseFloat(timeStr);
    if (timeStr.endsWith('s') && !timeStr.endsWith('ms')) {
      return value * 1000;
    }
    return value;
  }

  formatTime(milliseconds) {
    if (milliseconds === null || milliseconds === undefined) return null;

    if (milliseconds >= 1000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    }
    return `${Math.round(milliseconds)}ms`;
  }

  getScore() {
    let score = 100;

    if (this.metrics.webVitals.LCP) {
      const lcpMs = parseFloat(this.metrics.webVitals.LCP);
      if (lcpMs > 4000) score -= 25;
      else if (lcpMs > 2500) score -= 15;
    }

    if (this.metrics.webVitals.FID) {
      const fidMs = parseFloat(this.metrics.webVitals.FID);
      if (fidMs > 300) score -= 25;
      else if (fidMs > 100) score -= 15;
    }

    if (this.metrics.webVitals.CLS) {
      const cls = parseFloat(this.metrics.webVitals.CLS);
      if (cls > 0.25) score -= 25;
      else if (cls > 0.1) score -= 15;
    }

    if (this.metrics.fps.current < 30 && this.metrics.fps.current > 0) {
      score -= 20;
    } else if (this.metrics.fps.current < 50 && this.metrics.fps.current > 0) {
      score -= 10;
    }

    if (this.metrics.memory.percent > 90) {
      score -= 15;
    } else if (this.metrics.memory.percent > 70) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.metrics));
  }

  getMetrics() {
    return { ...this.metrics, score: this.getScore() };
  }

  reset() {
    this.frameCount = 0;
    this.startTime = performance.now();
    this.metrics.frameDrops.count = 0;
    this.metrics.frameDrops.rate = 0;
    this.metrics.frameDrops.lastDropTime = null;
    this.metrics.frameDrops.highestDropTime = null;
    this.highestDropTimeMs = 0; // Reset cached value
    this.metrics.app.queries = 0;
    this.metrics.app.mountCount = 0;
    this.notifyListeners();
  }
}

export default new PerformanceMonitorService();
