/**
 * LazyDependencyResolver - On-demand dependency resolution
 * 
 * Architectural shift: Instead of resolving all dependencies upfront,
 * resolve them only when needed (component becomes visible, user interacts, etc.)
 */

export class LazyDependencyResolver {
  constructor(moduleId, storeActions) {
    this.moduleId = moduleId;
    this.storeActions = storeActions;
    this.dependencyCache = new Map();
    this.pendingResolutions = new Map();
    this.componentDependencies = new Map();
    this.resolutionQueue = [];

    // Intersection Observer for visibility-based resolution
    this.setupVisibilityObserver();
  }

  /**
   * Initialize lazy dependency system
   * Register components without resolving dependencies
   */
  initializeLazySystem(components) {
    console.log(`🔗 Initializing lazy dependency system for ${Object.keys(components).length} components`);

    // Build dependency graph without resolution
    this.buildDependencyGraph(components);

    // Setup component watchers
    this.setupComponentWatchers(components);

    console.log(`✅ Lazy dependency system ready`);
  }

  /**
   * Build dependency graph structure without resolving values
   */
  buildDependencyGraph(components) {
    Object.entries(components).forEach(([componentId, component]) => {
      const dependencies = this.analyzeDependencies(componentId, component.component);
      this.componentDependencies.set(componentId, dependencies);
    });
  }

  /**
   * Analyze component dependencies without resolving them
   */
  analyzeDependencies(componentId, component) {
    const dependencies = {
      id: componentId,
      type: component.component,
      references: [],
      dependents: [],
      priority: 0,
      isResolved: false,
      isVisible: false
    };

    // Scan for references in component definition
    const definition = component.definition || {};

    Object.entries(definition).forEach(([sectionType, section]) => {
      if (typeof section === 'object' && section) {
        Object.entries(section).forEach(([key, value]) => {
          const refs = this.extractReferences(value);
          dependencies.references.push(...refs.map(ref => ({
            section: sectionType,
            property: key,
            reference: ref,
            resolved: false
          })));
        });
      }
    });

    return dependencies;
  }

  /**
   * Extract references from property values
   */
  extractReferences(propertyValue) {
    const references = [];

    if (typeof propertyValue?.value === 'string') {
      const value = propertyValue.value;

      // Find {{}} expressions
      const matches = value.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const expression = match.slice(2, -2).trim();
          references.push({
            expression,
            type: this.categorizeReference(expression),
            raw: match
          });
        });
      }
    }

    return references;
  }

  /**
   * Categorize reference types for optimization
   */
  categorizeReference(expression) {
    if (expression.startsWith('components.')) return 'component';
    if (expression.startsWith('queries.')) return 'query';
    if (expression.startsWith('globals.')) return 'global';
    if (expression.startsWith('page.')) return 'page';
    return 'unknown';
  }

  /**
   * Setup visibility observer for lazy loading
   */
  setupVisibilityObserver() {
    this.visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const componentId = entry.target.getAttribute('data-component-id');
        if (componentId && entry.isIntersecting) {
          this.markComponentVisible(componentId);
          this.scheduleResolution(componentId, 'visibility');
        }
      });
    }, {
      rootMargin: '50px', // Resolve slightly before component is visible
      threshold: 0.1
    });
  }

  /**
   * Mark component as visible and trigger resolution
   */
  markComponentVisible(componentId) {
    const deps = this.componentDependencies.get(componentId);
    if (deps && !deps.isVisible) {
      deps.isVisible = true;
      deps.priority += 50; // Increase priority for visible components
      console.log(`👁️ Component ${componentId} became visible, scheduling resolution`);
    }
  }

  /**
   * Schedule dependency resolution with priority
   */
  scheduleResolution(componentId, trigger = 'manual') {
    if (this.dependencyCache.has(componentId)) {
      // Already resolved
      return Promise.resolve(this.dependencyCache.get(componentId));
    }

    if (this.pendingResolutions.has(componentId)) {
      // Resolution in progress
      return this.pendingResolutions.get(componentId);
    }

    const resolutionPromise = this.resolveComponentDependencies(componentId, trigger);
    this.pendingResolutions.set(componentId, resolutionPromise);

    return resolutionPromise;
  }

  /**
   * Resolve dependencies for a specific component
   */
  async resolveComponentDependencies(componentId, trigger) {
    try {
      const deps = this.componentDependencies.get(componentId);
      if (!deps || deps.isResolved) {
        return this.dependencyCache.get(componentId) || {};
      }

      console.log(`🔧 Resolving dependencies for ${componentId} (trigger: ${trigger})`);

      // Get component data
      const components = this.storeActions.getCurrentPageComponents(this.moduleId);
      const component = components[componentId];

      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      // Use existing dependency resolution logic but only for this component
      const resolvedValues = this.storeActions.addToDependencyGraph(
        this.moduleId,
        componentId,
        component.component
      );

      // Cache the result
      this.dependencyCache.set(componentId, resolvedValues);
      deps.isResolved = true;

      // Update component state
      this.storeActions.setResolvedComponent(componentId, resolvedValues, this.moduleId);

      // Clean up pending resolution
      this.pendingResolutions.delete(componentId);

      console.log(`✅ Dependencies resolved for ${componentId}`);
      return resolvedValues;

    } catch (error) {
      console.error(`❌ Error resolving dependencies for ${componentId}:`, error);
      this.pendingResolutions.delete(componentId);

      // Return minimal state to prevent rendering issues
      return this.createFallbackState(componentId);
    }
  }

  /**
   * Create fallback state for failed resolutions
   */
  createFallbackState(componentId) {
    const fallbackState = {
      properties: {},
      styles: { visibility: true },
      general: { isVisible: true },
      others: {},
      validation: {},
      generalStyles: {}
    };

    this.dependencyCache.set(componentId, fallbackState);
    return fallbackState;
  }

  /**
   * Setup component watchers for interaction-based resolution
   */
  setupComponentWatchers(components) {
    // Watch for component interactions
    document.addEventListener('click', (event) => {
      const componentElement = event.target.closest('[data-component-id]');
      if (componentElement) {
        const componentId = componentElement.getAttribute('data-component-id');
        this.scheduleResolution(componentId, 'interaction');
      }
    });

    // Watch for input focus events
    document.addEventListener('focusin', (event) => {
      const componentElement = event.target.closest('[data-component-id]');
      if (componentElement) {
        const componentId = componentElement.getAttribute('data-component-id');
        this.scheduleResolution(componentId, 'focus');
      }
    });
  }

  /**
   * Batch resolve multiple components efficiently
   */
  async batchResolve(componentIds, trigger = 'batch') {
    console.log(`📦 Batch resolving ${componentIds.length} components`);

    const resolutions = componentIds.map(id => this.scheduleResolution(id, trigger));
    const results = await Promise.allSettled(resolutions);

    const resolved = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`📦 Batch resolution complete: ${resolved} resolved, ${failed} failed`);

    return results;
  }

  /**
   * Preload dependencies for components likely to be needed
   */
  async preloadCriticalComponents() {
    // Identify critical components (containers, visible components, etc.)
    const criticalComponents = [];

    this.componentDependencies.forEach((deps, componentId) => {
      if (deps.type === 'Container' ||
        deps.type === 'Tabs' ||
        !deps.references.length || // Simple components
        deps.isVisible) {
        criticalComponents.push(componentId);
      }
    });

    if (criticalComponents.length > 0) {
      console.log(`⚡ Preloading ${criticalComponents.length} critical components`);
      await this.batchResolve(criticalComponents, 'preload');
    }
  }

  /**
   * Get dependency status for debugging
   */
  getDependencyStatus() {
    const status = {
      total: this.componentDependencies.size,
      resolved: 0,
      pending: this.pendingResolutions.size,
      visible: 0,
      cached: this.dependencyCache.size
    };

    this.componentDependencies.forEach(deps => {
      if (deps.isResolved) status.resolved++;
      if (deps.isVisible) status.visible++;
    });

    return status;
  }

  /**
   * Observer management for component elements
   */
  observeComponent(element, componentId) {
    element.setAttribute('data-component-id', componentId);
    this.visibilityObserver.observe(element);
  }

  unobserveComponent(element) {
    this.visibilityObserver.unobserve(element);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.visibilityObserver.disconnect();
    this.dependencyCache.clear();
    this.pendingResolutions.clear();
    this.componentDependencies.clear();
    this.resolutionQueue.length = 0;
  }

  /**
   * Manual resolution trigger for specific components
   */
  async resolveNow(componentId) {
    return await this.scheduleResolution(componentId, 'manual');
  }

  /**
   * Resolve all remaining components (fallback for compatibility)
   */
  async resolveAll() {
    const unresolved = [];
    this.componentDependencies.forEach((deps, componentId) => {
      if (!deps.isResolved) {
        unresolved.push(componentId);
      }
    });

    if (unresolved.length > 0) {
      console.log(`🔄 Resolving all remaining ${unresolved.length} components`);
      return await this.batchResolve(unresolved, 'resolveAll');
    }
  }
}
