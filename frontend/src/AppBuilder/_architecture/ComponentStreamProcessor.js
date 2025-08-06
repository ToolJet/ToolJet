/**
 * ComponentStreamProcessor - Streaming Architecture for Large Apps
 * 
 * This implements a fundamental architectural change from batch processing
 * to streaming component initialization. Components are rendered immediately
 * with minimal data and progressively enhanced.
 */

export class ComponentStreamProcessor {
  constructor(moduleId, storeActions) {
    this.moduleId = moduleId;
    this.storeActions = storeActions;
    this.processingQueue = new Map();
    this.processedComponents = new Set();
    this.renderQueue = [];
    this.isProcessing = false;

    // Performance tracking
    this.metrics = {
      totalComponents: 0,
      processedCount: 0,
      renderTime: 0,
      memoryStart: 0
    };
  }

  /**
   * Initialize streaming component processing
   * Core architectural change: Components render immediately, enhance progressively
   */
  async initializeStreaming(components) {
    const componentEntries = Object.entries(components);
    this.metrics.totalComponents = componentEntries.length;
    this.metrics.memoryStart = this.getMemoryUsage();

    console.log(`🚀 Starting streaming initialization for ${componentEntries.length} components`);

    // PHASE 1: Immediate lightweight rendering
    await this.initializeLightweightComponents(componentEntries);

    // PHASE 2: Progressive enhancement
    this.startProgressiveEnhancement(componentEntries);

    return {
      immediate: true,
      totalComponents: componentEntries.length,
      estimatedCompletion: componentEntries.length * 10 // ms
    };
  }

  /**
   * Phase 1: Create minimal component state for immediate rendering
   * Components render with default/empty states
   */
  async initializeLightweightComponents(componentEntries) {
    const startTime = performance.now();
    const lightweightComponents = {};

    // Create minimal component structures in batches
    const BATCH_SIZE = 20; // Process 20 at a time for UI responsiveness

    for (let i = 0; i < componentEntries.length; i += BATCH_SIZE) {
      const batch = componentEntries.slice(i, i + BATCH_SIZE);

      batch.forEach(([componentId, component]) => {
        lightweightComponents[componentId] = this.createMinimalComponentState(
          componentId,
          component.component
        );
      });

      // Yield control for UI updates
      if (i % BATCH_SIZE === 0) {
        await this.yieldToEventLoop();
      }
    }

    // Set lightweight components for immediate rendering
    this.storeActions.setResolvedComponents(lightweightComponents, this.moduleId);
    this.storeActions.resolveOthers(this.moduleId);

    this.metrics.renderTime = performance.now() - startTime;
    console.log(`✅ Lightweight rendering complete in ${this.metrics.renderTime.toFixed(2)}ms`);
  }

  /**
   * Create minimal component state for immediate rendering
   * Only essential properties, no dependency resolution
   */
  createMinimalComponentState(componentId, component) {
    const componentType = this.getComponentType(component.component);
    if (!componentType) return {};

    // Minimal state with only essential properties
    const minimalState = {
      properties: this.extractEssentialProperties(component, componentType),
      styles: this.extractEssentialStyles(component),
      general: { isVisible: true, isLoading: false },
      others: {},
      validation: {},
      generalStyles: {}
    };

    return minimalState;
  }

  /**
   * Extract only essential properties needed for basic rendering
   */
  extractEssentialProperties(component, componentType) {
    const definition = component.definition || {};
    const properties = definition.properties || {};

    // Component-specific essential properties
    const essentials = {};

    switch (componentType.component) {
      case 'Text':
        essentials.text = properties.text?.value || '';
        break;
      case 'Button':
        essentials.text = properties.text?.value || 'Button';
        essentials.loadingState = false;
        break;
      case 'TextInput':
        essentials.value = properties.value?.value || '';
        essentials.placeholder = properties.placeholder?.value || '';
        break;
      case 'Table':
        essentials.data = [];
        essentials.columns = [];
        break;
      case 'Container':
        // Containers need minimal state for child positioning
        break;
      default:
        // Generic minimal properties
        if (properties.value) essentials.value = properties.value.value || '';
        if (properties.text) essentials.text = properties.text.value || '';
    }

    return essentials;
  }

  /**
   * Extract essential styles for basic appearance
   */
  extractEssentialStyles(component) {
    const definition = component.definition || {};
    const styles = definition.styles || {};

    return {
      backgroundColor: styles.backgroundColor?.value || 'transparent',
      textColor: styles.textColor?.value || '#000',
      borderRadius: styles.borderRadius?.value || 0,
      visibility: styles.visibility?.value !== false
    };
  }

  /**
   * Phase 2: Progressive enhancement with dependency resolution
   * Non-blocking background processing
   */
  async startProgressiveEnhancement(componentEntries) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log(`🔄 Starting progressive enhancement for ${componentEntries.length} components`);

    // Process components in priority order
    const prioritizedComponents = this.prioritizeComponents(componentEntries);

    // Use requestIdleCallback for non-blocking processing
    this.scheduleEnhancement(prioritizedComponents);
  }

  /**
   * Prioritize components for processing
   * Visible components first, then containers, then nested components
   */
  prioritizeComponents(componentEntries) {
    return componentEntries.sort(([aId, a], [bId, b]) => {
      const aPriority = this.getComponentPriority(a.component);
      const bPriority = this.getComponentPriority(b.component);
      return bPriority - aPriority;
    });
  }

  getComponentPriority(component) {
    // Higher priority = processed first
    const type = component.component;

    if (type === 'Container' || type === 'Tabs') return 100; // Layout components first
    if (!component.parent) return 90; // Top-level components
    if (this.isVisible(component)) return 80; // Visible components
    return 50; // Other components
  }

  isVisible(component) {
    const styles = component.definition?.styles || {};
    return styles.visibility?.value !== false;
  }

  /**
   * Schedule enhancement using requestIdleCallback
   */
  scheduleEnhancement(prioritizedComponents) {
    let index = 0;

    const processNextBatch = (deadline) => {
      const BATCH_SIZE = 3; // Small batches to prevent blocking
      let processed = 0;

      while (processed < BATCH_SIZE && index < prioritizedComponents.length &&
        deadline.timeRemaining() > 0) {
        const [componentId, component] = prioritizedComponents[index];

        this.enhanceComponent(componentId, component.component)
          .then(() => {
            this.metrics.processedCount++;
            this.updateProgress();
          })
          .catch(error => {
            console.warn(`⚠️ Enhancement failed for ${componentId}:`, error);
          });

        index++;
        processed++;
      }

      // Schedule next batch if more components remain
      if (index < prioritizedComponents.length) {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(processNextBatch);
        } else {
          setTimeout(() => processNextBatch({ timeRemaining: () => 5 }), 0);
        }
      } else {
        this.completeEnhancement();
      }
    };

    // Start processing
    if (window.requestIdleCallback) {
      window.requestIdleCallback(processNextBatch);
    } else {
      setTimeout(() => processNextBatch({ timeRemaining: () => 5 }), 0);
    }
  }

  /**
   * Enhance individual component with full dependency resolution
   */
  async enhanceComponent(componentId, component) {
    try {
      // Skip if already processed
      if (this.processedComponents.has(componentId)) return;

      // Full dependency resolution for this component
      const enhancedState = this.storeActions.addToDependencyGraph(
        this.moduleId,
        componentId,
        component
      );

      // Update component state incrementally
      this.storeActions.setResolvedComponent(componentId, enhancedState, this.moduleId);

      this.processedComponents.add(componentId);

    } catch (error) {
      console.warn(`⚠️ Component enhancement error for ${componentId}:`, error);
      // Component keeps minimal state, doesn't break the app
    }
  }

  /**
   * Update progress indicators
   */
  updateProgress() {
    const progress = (this.metrics.processedCount / this.metrics.totalComponents) * 100;

    // Dispatch progress event for UI updates
    window.dispatchEvent(new CustomEvent('tooljet-component-progress', {
      detail: {
        processed: this.metrics.processedCount,
        total: this.metrics.totalComponents,
        progress: progress,
        memoryUsage: this.getMemoryUsage()
      }
    }));

    if (this.metrics.processedCount % 10 === 0) {
      console.log(`📊 Progress: ${this.metrics.processedCount}/${this.metrics.totalComponents} (${progress.toFixed(1)}%)`);
    }
  }

  /**
   * Complete enhancement phase
   */
  completeEnhancement() {
    this.isProcessing = false;
    const totalTime = performance.now() - this.metrics.renderTime;
    const memoryIncrease = this.getMemoryUsage() - this.metrics.memoryStart;

    console.log(`✅ Progressive enhancement complete!`);
    console.log(`📈 Performance Summary:`, {
      totalComponents: this.metrics.totalComponents,
      renderTime: `${this.metrics.renderTime.toFixed(2)}ms`,
      enhancementTime: `${totalTime.toFixed(2)}ms`,
      memoryIncrease: `${memoryIncrease.toFixed(2)}MB`
    });

    // Final optimization pass
    this.optimizeMemoryUsage();
  }

  /**
   * Helper methods
   */
  getComponentType(componentName) {
    // Access cached component types
    if (!window.__COMPONENT_TYPE_CACHE__) return null;
    return window.__COMPONENT_TYPE_CACHE__.get(componentName);
  }

  async yieldToEventLoop() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  optimizeMemoryUsage() {
    // Clear processing queues
    this.processingQueue.clear();
    this.renderQueue.length = 0;

    // Suggest garbage collection
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Public API for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      isProcessing: this.isProcessing,
      memoryUsage: this.getMemoryUsage()
    };
  }

  destroy() {
    this.isProcessing = false;
    this.processingQueue.clear();
    this.processedComponents.clear();
    this.renderQueue.length = 0;
  }
}
