/**
 * AppBuilderArchitecture - New streaming architecture for ToolJet
 * 
 * This is the main controller that replaces the monolithic component loading
 * with a modern streaming architecture designed for large applications.
 * 
 * Key Architectural Changes:
 * 1. Streaming Component Initialization - Components render immediately
 * 2. Lazy Dependency Resolution - Dependencies resolved on-demand
 * 3. Progressive Enhancement - UI remains responsive during processing
 * 4. Memory-Efficient Processing - Bounded memory usage regardless of app size
 */

import { ComponentStreamProcessor } from './ComponentStreamProcessor';
import { LazyDependencyResolver } from './LazyDependencyResolver';

export class AppBuilderArchitecture {
  constructor(storeActions) {
    this.storeActions = storeActions;
    this.streamProcessor = null;
    this.dependencyResolver = null;
    this.isInitialized = false;
    this.metrics = {
      startTime: 0,
      firstRenderTime: 0,
      totalLoadTime: 0,
      componentCount: 0,
      memoryPeak: 0
    };
  }

  /**
   * Initialize the new streaming architecture
   * This replaces the old initDependencyGraph function
   */
  async initializeStreamingArchitecture(moduleId) {
    if (this.isInitialized) {
      console.warn('Architecture already initialized');
      return;
    }

    console.log(`🏗️ Initializing Streaming Architecture for module: ${moduleId}`);
    this.metrics.startTime = performance.now();
    this.metrics.memoryStart = this.getMemoryUsage();

    try {
      // Get components from store
      const components = this.storeActions.getCurrentPageComponents(moduleId);
      const componentCount = Object.keys(components).length;
      this.metrics.componentCount = componentCount;

      console.log(`📊 Processing ${componentCount} components with streaming architecture`);

      // Determine processing strategy based on app size
      if (componentCount <= 20) {
        // Small apps: Use traditional processing for simplicity
        return await this.initializeSmallApp(moduleId, components);
      } else {
        // Large apps: Use streaming architecture
        return await this.initializeLargeApp(moduleId, components);
      }

    } catch (error) {
      console.error('❌ Architecture initialization failed:', error);
      // Fallback to traditional processing
      return await this.fallbackToTraditional(moduleId);
    }
  }

  /**
   * Small app initialization (≤20 components)
   * Use traditional processing for simplicity
   */
  async initializeSmallApp(moduleId, components) {
    console.log(`📱 Using traditional processing for small app (${Object.keys(components).length} components)`);

    let resolvedComponentValues = {};
    Object.entries(components).forEach(([componentId, component]) => {
      try {
        resolvedComponentValues[componentId] = this.storeActions.addToDependencyGraph(
          moduleId,
          componentId,
          component.component
        );
      } catch (error) {
        console.warn(`⚠️ Error processing component ${componentId}:`, error);
        resolvedComponentValues[componentId] = {};
      }
    });

    this.storeActions.setResolvedComponents(resolvedComponentValues, moduleId);
    this.storeActions.resolveOthers(moduleId);

    this.metrics.firstRenderTime = performance.now() - this.metrics.startTime;
    this.metrics.totalLoadTime = this.metrics.firstRenderTime;

    console.log(`✅ Small app initialized in ${this.metrics.firstRenderTime.toFixed(2)}ms`);
    return { strategy: 'traditional', time: this.metrics.firstRenderTime };
  }

  /**
   * Large app initialization (>20 components)
   * Use streaming architecture
   */
  async initializeLargeApp(moduleId, components) {
    console.log(`🚀 Using streaming architecture for large app (${Object.keys(components).length} components)`);

    // Initialize streaming processor
    this.streamProcessor = new ComponentStreamProcessor(moduleId, this.storeActions);

    // Initialize lazy dependency resolver
    this.dependencyResolver = new LazyDependencyResolver(moduleId, this.storeActions);

    // Phase 1: Stream processor creates lightweight components for immediate rendering
    const streamResult = await this.streamProcessor.initializeStreaming(components);
    this.metrics.firstRenderTime = performance.now() - this.metrics.startTime;

    console.log(`⚡ First render achieved in ${this.metrics.firstRenderTime.toFixed(2)}ms`);

    // Phase 2: Setup lazy dependency resolution
    this.dependencyResolver.initializeLazySystem(components);

    // Phase 3: Preload critical components
    await this.dependencyResolver.preloadCriticalComponents();

    // Setup monitoring
    this.setupPerformanceMonitoring(moduleId);

    this.isInitialized = true;

    return {
      strategy: 'streaming',
      firstRenderTime: this.metrics.firstRenderTime,
      totalComponents: Object.keys(components).length,
      streamResult
    };
  }

  /**
   * Fallback to traditional processing if streaming fails
   */
  async fallbackToTraditional(moduleId) {
    console.warn('🔄 Falling back to traditional processing');

    try {
      const components = this.storeActions.getCurrentPageComponents(moduleId);
      return await this.initializeSmallApp(moduleId, components);
    } catch (error) {
      console.error('❌ Fallback processing also failed:', error);

      // Last resort: empty state
      this.storeActions.setResolvedComponents({}, moduleId);
      this.storeActions.resolveOthers(moduleId);

      return { strategy: 'emergency', error: error.message };
    }
  }

  /**
   * Setup performance monitoring for the application
   */
  setupPerformanceMonitoring(moduleId) {
    // Monitor memory usage
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsage();
      this.metrics.memoryPeak = Math.max(this.metrics.memoryPeak, currentMemory);

      // Alert if memory usage is concerning
      if (currentMemory > 500) { // 500MB threshold
        console.warn(`⚠️ High memory usage detected: ${currentMemory.toFixed(2)}MB`);
      }
    }, 10000); // Check every 10 seconds

    // Monitor dependency resolution progress
    window.addEventListener('tooljet-component-progress', (event) => {
      const { processed, total, progress } = event.detail;

      if (processed === total) {
        this.metrics.totalLoadTime = performance.now() - this.metrics.startTime;
        console.log(`🎉 All components enhanced! Total time: ${this.metrics.totalLoadTime.toFixed(2)}ms`);
        clearInterval(memoryMonitor);
        this.logFinalMetrics();
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(memoryMonitor);
      this.cleanup();
    });
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  /**
   * Log final performance metrics
   */
  logFinalMetrics() {
    const memoryIncrease = this.metrics.memoryPeak - this.metrics.memoryStart;

    console.log(`📈 Final Performance Report:`, {
      strategy: this.streamProcessor ? 'streaming' : 'traditional',
      componentCount: this.metrics.componentCount,
      firstRenderTime: `${this.metrics.firstRenderTime.toFixed(2)}ms`,
      totalLoadTime: `${this.metrics.totalLoadTime.toFixed(2)}ms`,
      memoryIncrease: `${memoryIncrease.toFixed(2)}MB`,
      memoryPeak: `${this.metrics.memoryPeak.toFixed(2)}MB`,
      efficiency: this.calculateEfficiency()
    });

    // Performance recommendations
    this.generateRecommendations();
  }

  /**
   * Calculate efficiency score
   */
  calculateEfficiency() {
    const timePerComponent = this.metrics.totalLoadTime / this.metrics.componentCount;
    const memoryPerComponent = (this.metrics.memoryPeak - this.metrics.memoryStart) / this.metrics.componentCount;

    // Lower is better for both metrics
    let efficiency = 'excellent';
    if (timePerComponent > 100 || memoryPerComponent > 5) efficiency = 'good';
    if (timePerComponent > 200 || memoryPerComponent > 10) efficiency = 'poor';

    return efficiency;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.memoryPeak > 1000) {
      recommendations.push('Consider reducing component complexity or implementing component virtualization');
    }

    if (this.metrics.totalLoadTime > 5000) {
      recommendations.push('Large loading time detected - consider app optimization or component splitting');
    }

    if (this.metrics.componentCount > 500) {
      recommendations.push('Very large app detected - consider using multiple pages or modules');
    }

    if (recommendations.length > 0) {
      console.log('💡 Performance Recommendations:', recommendations);
    }
  }

  /**
   * Public API methods
   */

  /**
   * Manually resolve dependencies for a specific component
   */
  async resolveDependencies(componentId) {
    if (this.dependencyResolver) {
      return await this.dependencyResolver.resolveNow(componentId);
    }
    return null;
  }

  /**
   * Get current architecture status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      strategy: this.streamProcessor ? 'streaming' : 'traditional',
      metrics: this.metrics,
      dependencyStatus: this.dependencyResolver ? this.dependencyResolver.getDependencyStatus() : null,
      processingStatus: this.streamProcessor ? this.streamProcessor.getMetrics() : null
    };
  }

  /**
   * Force complete all pending operations (for debugging/testing)
   */
  async forceComplete() {
    if (this.dependencyResolver) {
      console.log('🔄 Force completing all dependency resolutions...');
      await this.dependencyResolver.resolveAll();
    }
  }

  /**
   * Observe a component element for lazy loading
   */
  observeComponent(element, componentId) {
    if (this.dependencyResolver) {
      this.dependencyResolver.observeComponent(element, componentId);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.streamProcessor) {
      this.streamProcessor.destroy();
      this.streamProcessor = null;
    }

    if (this.dependencyResolver) {
      this.dependencyResolver.destroy();
      this.dependencyResolver = null;
    }

    this.isInitialized = false;
  }

  /**
   * Static factory method to create and initialize architecture
   */
  static async create(storeActions, moduleId) {
    const architecture = new AppBuilderArchitecture(storeActions);
    const result = await architecture.initializeStreamingArchitecture(moduleId);
    return { architecture, result };
  }
}
