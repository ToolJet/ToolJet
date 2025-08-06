/**
 * ToolJet Performance Testing Script
 * Run this in browser console to benchmark app loading performance
 */

class ToolJetPerformanceTester {
  constructor() {
    this.results = {};
    this.startTime = null;
    this.observers = [];
  }

  /**
   * Start comprehensive performance test
   */
  async startTest() {
    console.log('🧪 Starting ToolJet Performance Test...');

    this.startTime = performance.now();
    this.setupObservers();

    // Monitor page load performance
    this.monitorPageLoad();

    // Monitor component rendering
    this.monitorComponentRendering();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network requests
    this.monitorNetworkRequests();

    console.log('📊 Performance monitoring started. Load a large app to see results.');
  }

  /**
   * Setup performance observers
   */
  setupObservers() {
    // Long task observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const longTasks = list.getEntries();
        longTasks.forEach(task => {
          if (task.duration > 50) {
            console.warn(`⚠️ Long task detected: ${task.duration.toFixed(2)}ms`);
            this.results.longTasks = (this.results.longTasks || []);
            this.results.longTasks.push({
              duration: task.duration,
              startTime: task.startTime
            });
          }
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.log('Long task observer not supported');
      }
    }

    // Measure observer
    const measureObserver = new PerformanceObserver((list) => {
      const measures = list.getEntries();
      measures.forEach(measure => {
        if (measure.name.includes('ToolJet') || measure.name.includes('App')) {
          console.log(`📏 ${measure.name}: ${measure.duration.toFixed(2)}ms`);
          this.results.measures = this.results.measures || {};
          this.results.measures[measure.name] = measure.duration;
        }
      });
    });

    measureObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(measureObserver);
  }

  /**
   * Monitor page load performance
   */
  monitorPageLoad() {
    window.addEventListener('load', () => {
      const loadTime = performance.now() - this.startTime;
      console.log(`📄 Page loaded in: ${loadTime.toFixed(2)}ms`);
      this.results.pageLoadTime = loadTime;

      // Get navigation timing
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        this.results.navigation = {
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
          domComplete: navTiming.domComplete - navTiming.navigationStart,
          loadComplete: navTiming.loadEventEnd - navTiming.navigationStart
        };

        console.log('📊 Navigation Timing:', this.results.navigation);
      }
    });
  }

  /**
   * Monitor component rendering performance
   */
  monitorComponentRendering() {
    // Hook into React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const originalOnCommitFiberRoot = hook.onCommitFiberRoot;

      hook.onCommitFiberRoot = (id, root, ...args) => {
        const renderStart = performance.now();

        if (originalOnCommitFiberRoot) {
          originalOnCommitFiberRoot.call(hook, id, root, ...args);
        }

        const renderTime = performance.now() - renderStart;
        if (renderTime > 10) {
          console.log(`⚛️ React render took: ${renderTime.toFixed(2)}ms`);
          this.results.reactRenders = (this.results.reactRenders || []);
          this.results.reactRenders.push(renderTime);
        }
      };
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (performance.memory) {
      const logMemory = () => {
        const memory = performance.memory;
        const usage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        };

        console.log(`💾 Memory: ${usage.used}MB used, ${usage.total}MB total, ${usage.limit}MB limit`);

        if (usage.used / usage.limit > 0.8) {
          console.warn('⚠️ High memory usage detected!');
        }

        this.results.memoryUsage = usage;
      };

      // Log memory every 10 seconds
      logMemory();
      setInterval(logMemory, 10000);
    }
  }

  /**
   * Monitor network requests
   */
  monitorNetworkRequests() {
    const requests = [];
    const originalFetch = window.fetch;

    window.fetch = (...args) => {
      const start = performance.now();
      const url = args[0];

      return originalFetch.apply(window, args)
        .then(response => {
          const duration = performance.now() - start;
          requests.push({
            url: url.toString(),
            duration,
            status: response.status,
            ok: response.ok
          });

          if (duration > 1000) {
            console.warn(`🌐 Slow request: ${url} took ${duration.toFixed(2)}ms`);
          }

          return response;
        })
        .catch(error => {
          const duration = performance.now() - start;
          requests.push({
            url: url.toString(),
            duration,
            error: error.message
          });
          throw error;
        });
    };

    this.results.networkRequests = requests;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    console.log('\n📈 ToolJet Performance Report');
    console.log('================================');

    // App load performance
    if (this.results.measures) {
      console.log('\n⏱️ App Load Timings:');
      Object.entries(this.results.measures).forEach(([name, duration]) => {
        const status = duration > 1000 ? '🔴' : duration > 500 ? '🟡' : '🟢';
        console.log(`${status} ${name}: ${duration.toFixed(2)}ms`);
      });
    }

    // Memory usage
    if (this.results.memoryUsage) {
      console.log('\n💾 Memory Usage:');
      const { used, total, limit } = this.results.memoryUsage;
      const percentage = ((used / limit) * 100).toFixed(1);
      const status = percentage > 80 ? '🔴' : percentage > 60 ? '🟡' : '🟢';
      console.log(`${status} ${used}MB / ${limit}MB (${percentage}%)`);
    }

    // Long tasks
    if (this.results.longTasks && this.results.longTasks.length > 0) {
      console.log('\n⚠️ Long Tasks (>50ms):');
      this.results.longTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.duration.toFixed(2)}ms at ${task.startTime.toFixed(2)}ms`);
      });
    }

    // Network requests
    if (this.results.networkRequests && this.results.networkRequests.length > 0) {
      const slowRequests = this.results.networkRequests.filter(req => req.duration > 500);
      if (slowRequests.length > 0) {
        console.log('\n🌐 Slow Network Requests (>500ms):');
        slowRequests.forEach((req, index) => {
          console.log(`${index + 1}. ${req.url}: ${req.duration.toFixed(2)}ms`);
        });
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    return this.results;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check app load time
    const totalAppTime = this.results.measures?.TotalAppLoad || 0;
    if (totalAppTime > 2000) {
      recommendations.push('Consider implementing component lazy loading for faster initial load');
    }

    // Check memory usage
    if (this.results.memoryUsage?.used > 100) {
      recommendations.push('High memory usage detected - implement component virtualization');
    }

    // Check long tasks
    if (this.results.longTasks?.length > 5) {
      recommendations.push('Multiple long tasks detected - break down large operations into smaller chunks');
    }

    // Check component mapping time
    const componentMappingTime = this.results.measures?.ComponentMapping || 0;
    if (componentMappingTime > 200) {
      recommendations.push('Component mapping is slow - consider reducing component count or complexity');
    }

    // Check dependency graph time
    const dependencyTime = this.results.measures?.DependencyGraphInit || 0;
    if (dependencyTime > 300) {
      recommendations.push('Dependency graph initialization is slow - flatten component hierarchy');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! 🎉');
    }

    return recommendations;
  }

  /**
   * Stop monitoring and generate report
   */
  stopTest() {
    this.observers.forEach(observer => observer.disconnect());
    return this.generateReport();
  }

  /**
   * Quick test for specific app
   */
  async testApp(appId) {
    console.log(`🧪 Testing app: ${appId}`);
    this.startTest();

    // Wait for app to load
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const appLoaded = document.querySelector('[data-cy="app-builder"]') !== null;
        if (appLoaded) {
          clearInterval(checkInterval);
          setTimeout(() => {
            const report = this.stopTest();
            resolve(report);
          }, 2000); // Wait 2 seconds after app loads
        }
      }, 500);
    });
  }
}

// Global instance
window.ToolJetPerformanceTester = new ToolJetPerformanceTester();

// Auto-start if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🧪 ToolJet Performance Tester loaded!');
  console.log('📖 Usage:');
  console.log('  window.ToolJetPerformanceTester.startTest() - Start monitoring');
  console.log('  window.ToolJetPerformanceTester.generateReport() - Get current report');
  console.log('  window.ToolJetPerformanceTester.stopTest() - Stop and get final report');
  console.log('  window.ToolJetPerformanceTester.testApp("app-id") - Test specific app');
}

export default ToolJetPerformanceTester;
