/**
 * ComputeEngine
 *
 * The main engine class that runs inside the Web Worker.
 * Exposes async methods that are called via Comlink RPC from the main thread.
 *
 * Responsibilities:
 * - Provide RPC methods for all operations (setExposedValue, fireEvent, etc.)
 * - Coordinate sub-engines (Resolution, Dependency, Event, RunJS, Validation)
 * - Manage the worker store
 * - Push state updates to main thread via callback
 *
 * Phase 1: Resolution Engine & Dependency Tracking
 */

import { createWorkerStore } from "./workerStore";
import { OperationBatcher } from "./utils/operationBatcher";
import { OperationTypes } from "./protocol";
import { ResolutionEngine } from "./engines/ResolutionEngine";
import {
  DependencyGraph,
  ComponentDependencyTracker,
} from "./engines/DependencyGraph";
import { EventEngine } from "./engines/EventEngine";
import { RunJSEngine } from "./engines/RunJSEngine";
import { ValidationEngine } from "./engines/ValidationEngine";
import { VirtualizationManager } from "./engines/VirtualizationManager";

class ComputeEngine {
  constructor() {
    this.store = null;
    this.batcher = null;
    this.mainThreadCallback = null;

    // Sub-engines
    this.resolutionEngine = new ResolutionEngine();
    this.dependencyTracker = new ComponentDependencyTracker();

    // Phase 3 engines
    this.runJSEngine = new RunJSEngine();
    this.eventEngine = new EventEngine();
    this.validationEngine = new ValidationEngine();

    // Phase 4 engine
    this.virtualizationManager = new VirtualizationManager();

    // Initialize Phase 3 engine dependencies (store set after initialize)
    this.eventEngine.initialize(null, this.resolutionEngine);
    this.validationEngine.initialize(
      null,
      this.resolutionEngine,
      this.runJSEngine
    );

    // Initialization state
    this.isInitialized = false;
    this.moduleId = "canvas";

    // Debug mode
    this.debug = false;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debug = enabled;
    this.runJSEngine?.setDebugMode(enabled);
    this.eventEngine?.setDebugMode(enabled);
    this.validationEngine?.setDebugMode(enabled);
    this.virtualizationManager?.setDebugMode(enabled);
    return { success: true };
  }

  /**
   * Log debug message
   * @param  {...any} args
   */
  log(...args) {
    if (this.debug) {
      console.log("[ComputeEngine]", ...args);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set the callback for pushing state updates to main thread
   * Called once during setup with a Comlink.proxy callback
   * @param {Function} callback - Function to call with operations array
   */
  setMainThreadCallback(callback) {
    console.log('[ComputeEngine] setMainThreadCallback called with:', typeof callback);
    this.mainThreadCallback = callback;

    // Create batcher that sends operations via postMessage (more reliable than Comlink callback)
    this.batcher = new OperationBatcher((operations) => {
      console.log('[ComputeEngine] Batcher callback invoked with', operations.length, 'ops');
      // Use postMessage directly for reliable delivery
      self.postMessage({ type: 'OPERATIONS', operations });
      console.log('[ComputeEngine] Posted operations via postMessage');
    });

    console.log('[ComputeEngine] Batcher created:', this.batcher);
    return { success: true };
  }

  /**
   * Initialize the engine with an app definition
   * @param {object} appDefinition - App definition from backend
   * @param {string} moduleId - Module identifier (default: 'canvas')
   * @returns {object} Initialization result
   */
  async initialize(appDefinition, moduleId = "canvas") {
    console.log("[ComputeEngine] Initialize called with appDefinition:", appDefinition);
    this.moduleId = moduleId;

    // Create store
    this.store = createWorkerStore();
    console.log("[ComputeEngine] Store created");

    // Update Phase 3 engine store references
    this.eventEngine.store = this.store;
    this.validationEngine.store = this.store;

    // Initialize Phase 4 virtualization manager
    this.virtualizationManager.initialize(this.store);

    // Load app definition into store
    this.loadAppDefinition(appDefinition, moduleId);
    console.log("[ComputeEngine] App definition loaded");

    // Clear and rebuild dependency tracking
    this.dependencyTracker.clear();

    // Build dependency graph and perform initial resolution
    console.log("[ComputeEngine] Building dependency graph...");
    this.buildDependencyGraph(moduleId);

    console.log("[ComputeEngine] Performing initial resolution...");
    await this.resolveAllComponents(moduleId);

    // Send initial state to main thread
    console.log("[ComputeEngine] Pushing full state to main thread...");
    this.pushFullState(moduleId);

    // Mark as initialized
    this.isInitialized = true;

    const componentCount = Object.keys(
      this.store.getAllComponentDefinitions(moduleId)
    ).length;
    const queryCount = Object.keys(this.store.queries).length;

    console.log(
      `[ComputeEngine] Initialized: ${componentCount} components, ${queryCount} queries`
    );

    return {
      success: true,
      componentCount,
      queryCount,
    };
  }

  /**
   * Build dependency graph for all components
   * @param {string} moduleId - Module ID
   */
  buildDependencyGraph(moduleId) {
    const components = this.store.getAllComponentDefinitions(moduleId);

    for (const [componentId, componentDef] of Object.entries(components)) {
      this.buildComponentDependencies(componentId, componentDef);
    }

    this.log(
      "Dependency graph built:",
      this.dependencyTracker.graph.size,
      "nodes"
    );
  }

  /**
   * Build dependencies for a single component
   * @param {string} componentId - Component ID
   * @param {object} componentDef - Component definition
   */
  buildComponentDependencies(componentId, componentDef) {
    const processProperties = (props, propType) => {
      if (!props) return;

      for (const [key, propDef] of Object.entries(props)) {
        const value = propDef?.value;
        if (
          value &&
          typeof value === "string" &&
          this.resolutionEngine.hasDynamicContent(value)
        ) {
          const dependencies = this.resolutionEngine.extractDependencies(value);
          if (dependencies.length > 0) {
            this.dependencyTracker.registerProperty(
              componentId,
              `${propType}.${key}`,
              value,
              dependencies
            );
          }
        }
      }
    };

    processProperties(componentDef.properties, "properties");
    processProperties(componentDef.styles, "styles");
    processProperties(componentDef.general, "general");
    processProperties(componentDef.generalStyles, "generalStyles");
  }

  /**
   * Resolve all components
   * @param {string} moduleId - Module ID
   */
  async resolveAllComponents(moduleId) {
    const components = this.store.getAllComponentDefinitions(moduleId);
    const state = this.buildCurrentState(moduleId);

    for (const [componentId, componentDef] of Object.entries(components)) {
      const resolved = this.resolveComponent(componentId, componentDef, state);
      this.store.setResolvedProperties(componentId, resolved, moduleId);

      // Push to main thread
      this.batcher.emit(OperationTypes.SET_RESOLVED, {
        componentId,
        resolved,
      });
    }
  }

  /**
   * Resolve a single component's properties
   * @param {string} componentId - Component ID
   * @param {object} componentDef - Component definition
   * @param {object} state - Current state for resolution
   * @param {object} customObjects - Custom objects like listItem
   * @returns {object} Resolved properties
   */
  resolveComponent(componentId, componentDef, state, customObjects = {}) {
    return this.resolutionEngine.resolveComponentProperties(
      componentDef,
      state,
      customObjects
    );
  }

  /**
   * Build current state object for resolution
   * @param {string} moduleId - Module ID
   * @returns {object} State object
   */
  buildCurrentState(moduleId) {
    const module = this.store.getModule(moduleId);

    // Build components state from exposed values
    const components = {};
    for (const [id, values] of Object.entries(
      module.exposedValues.components || {}
    )) {
      components[id] = values;
    }

    // Build queries state from exposed values
    const queries = {};
    for (const [id, values] of Object.entries(
      module.exposedValues.queries || {}
    )) {
      queries[id] = values;
    }

    return {
      components,
      queries,
      variables: module.variables || {},
      globals: module.globals || {},
      page: module.page || {},
      constants: module.constants || {},
      parameters: module.parameters || {},
    };
  }

  /**
   * Resolve dependents when a value changes
   * @param {string} changedPath - Path that changed (e.g., 'components.input1.value')
   * @param {string} moduleId - Module ID
   */
  async resolveDependents(changedPath, moduleId) {
    console.log('[ComputeEngine] resolveDependents called for:', changedPath);
    const affected = this.dependencyTracker.getAffectedProperties(changedPath);
    console.log('[ComputeEngine] Affected properties:', affected);

    if (affected.length === 0) {
      console.log('[ComputeEngine] No affected properties found');
      return;
    }

    this.log(`Resolving ${affected.length} dependents of ${changedPath}`);

    const state = this.buildCurrentState(moduleId);

    for (const { componentId, property, expression } of affected) {
      const componentDef = this.store.getComponentDefinition(
        componentId,
        moduleId
      );
      if (!componentDef) continue;

      // Resolve just this property
      const resolvedValue = this.resolutionEngine.resolveDynamicValues(
        expression,
        state
      );

      // Update resolved properties in store
      const currentResolved =
        this.store.getResolvedProperties(componentId, moduleId) || {};
      const [propType, propKey] = property.split(".");
      if (!currentResolved[propKey]) {
        currentResolved[propKey] = resolvedValue;
      } else {
        currentResolved[propKey] = resolvedValue;
      }

      this.store.setResolvedProperties(componentId, currentResolved, moduleId);

      // Push to main thread
      console.log('[ComputeEngine] Emitting SET_RESOLVED for', componentId, 'with resolved:', currentResolved);
      this.batcher.emit(OperationTypes.SET_RESOLVED, {
        componentId,
        resolved: currentResolved,
      });
    }
  }

  /**
   * Load app definition into store
   * @param {object} appDefinition - App definition from backend
   * @param {string} moduleId - Module ID
   */
  loadAppDefinition(appDefinition, moduleId) {
    const module = this.store.getModule(moduleId);

    // Load component definitions
    if (appDefinition.components) {
      for (const component of appDefinition.components) {
        // Store component definition
        module.componentDefinitions[component.id] = component;

        // Build container children mapping
        const parentId = component.parent || "canvas";
        this.store.addContainerChild(parentId, component.id, moduleId);

        // Build name-ID mapping
        if (component.name) {
          this.store.setComponentNameMapping(
            component.name,
            component.id,
            moduleId
          );
        }

        // Initialize exposed values with defaults
        this.initializeComponentExposedValues(component, moduleId);
      }
    }

    // Load queries
    if (appDefinition.queries) {
      for (const query of appDefinition.queries) {
        this.store.setQuery(query.id, query);

        // Initialize query exposed values
        this.store.setQueryExposedValue(
          query.id,
          {
            data: null,
            rawData: null,
            isLoading: false,
            isFetching: false,
            error: null,
            lastUpdatedAt: null,
          },
          moduleId
        );
      }
    }

    // Load events
    if (appDefinition.events) {
      this.store.setEvents(appDefinition.events, moduleId);
    }

    // Load variables
    if (appDefinition.variables) {
      for (const [name, value] of Object.entries(appDefinition.variables)) {
        this.store.setVariable(name, value, moduleId);
      }
    }

    // Load globals
    if (appDefinition.globals) {
      this.store.setGlobals(appDefinition.globals, moduleId);
    }

    // Load page info
    if (appDefinition.page) {
      this.store.setPage(appDefinition.page, moduleId);
    }
  }

  /**
   * Initialize exposed values for a component based on its type
   * @param {object} component - Component definition
   * @param {string} moduleId - Module ID
   */
  initializeComponentExposedValues(component, moduleId) {
    const defaultsByType = {
      Button: { isLoading: false, isDisabled: false },
      TextInput: { value: "", isValid: true, isFocused: false },
      NumberInput: { value: null, isValid: true },
      TextArea: { value: "", isValid: true },
      Dropdown: { value: null, selectedOption: null, searchText: "" },
      Multiselect: { values: [], selectedOptions: [] },
      Table: {
        selectedRow: null,
        selectedRows: [],
        data: [],
        currentPageData: [],
      },
      Text: {},
      Image: {},
      Container: {},
      Listview: { data: [], children: {} },
      Kanban: { columns: [], selectedCard: null },
      Form: { data: {}, isValid: true },
      Modal: { isOpen: false },
      Checkbox: { value: false },
      Toggle: { value: false },
      RadioButton: { value: null },
      DatePicker: { value: null },
      DateRangePicker: { startDate: null, endDate: null },
      FilePicker: { files: [] },
      Tabs: { currentTab: 0 },
    };

    const defaults = defaultsByType[component.componentType] || {};

    for (const [key, value] of Object.entries(defaults)) {
      this.store.setComponentExposedValue(
        component.id,
        key,
        value,
        null,
        moduleId
      );
    }
  }

  /**
   * Push full state to main thread
   * @param {string} moduleId - Module ID
   */
  pushFullState(moduleId) {
    if (!this.batcher) return;

    const module = this.store.getModule(moduleId);

    // Send exposed values
    this.batcher.emit(OperationTypes.SET_EXPOSED_FULL, {
      exposedValues: module.exposedValues,
    });

    // Send container children
    for (const [containerId, childIds] of Object.entries(
      module.containerChildren
    )) {
      this.batcher.emit(OperationTypes.SET_CHILDREN, {
        containerId,
        childIds,
      });
    }

    // Flush immediately for initial state
    this.batcher.flush();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS - Exposed Values
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set exposed value for a component
   * @param {string} componentId - Component ID
   * @param {string} key - Property key
   * @param {*} value - Value to set
   * @param {object} context - Optional context { parentId, index }
   * @returns {object} Result
   */
  async setExposedValue(componentId, key, value, context = {}) {
    console.log('[ComputeEngine] setExposedValue called:', { componentId, key, value, context });
    const { index = null } = context;
    const moduleId = this.moduleId;

    // Update store
    this.store.setComponentExposedValue(
      componentId,
      key,
      value,
      index,
      moduleId
    );
    console.log('[ComputeEngine] Store updated');

    // Push to main thread
    const path =
      index !== null
        ? `components.${componentId}[${index}].${key}`
        : `components.${componentId}.${key}`;

    this.batcher.emit(OperationTypes.SET_EXPOSED, { path, value });
    console.log('[ComputeEngine] Emitted SET_EXPOSED for path:', path);

    // Update dependents (cascading resolution)
    const depPath = `components.${componentId}.${key}`;
    console.log('[ComputeEngine] Resolving dependents for:', depPath);
    await this.resolveDependents(depPath, moduleId);
    console.log('[ComputeEngine] Dependents resolved');

    // Flush immediately to ensure updates reach main thread
    this.batcher.flush();
    console.log('[ComputeEngine] Batcher flushed');

    return { success: true };
  }

  /**
   * Set multiple exposed values for a component
   * @param {string} componentId - Component ID
   * @param {object} values - Key-value pairs
   * @param {object} context - Optional context
   * @returns {object} Result
   */
  async setExposedValues(componentId, values, context = {}) {
    const { index = null } = context;
    const moduleId = this.moduleId;

    // Update store
    this.store.setComponentExposedValues(componentId, values, index, moduleId);

    // Push each value to main thread and collect paths for dependency resolution
    const changedPaths = [];
    for (const [key, value] of Object.entries(values)) {
      const path =
        index !== null
          ? `components.${componentId}[${index}].${key}`
          : `components.${componentId}.${key}`;

      this.batcher.emit(OperationTypes.SET_EXPOSED, { path, value });
      changedPaths.push(`components.${componentId}.${key}`);
    }

    // Update dependents for all changed values
    for (const depPath of changedPaths) {
      await this.resolveDependents(depPath, moduleId);
    }

    return { success: true };
  }

  /**
   * Set a variable value
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   * @returns {object} Result
   */
  async setVariable(name, value) {
    this.store.setVariable(name, value, this.moduleId);

    this.batcher.emit(OperationTypes.SET_EXPOSED, {
      path: `variables.${name}`,
      value,
    });

    // Update dependents
    await this.resolveDependents(`variables.${name}`, this.moduleId);

    return { success: true };
  }

  /**
   * Set custom resolvables (e.g., ListView data)
   * @param {string} parentId - Parent container ID
   * @param {Array} data - Data array
   * @param {string} key - Key name (default: 'listItem')
   * @returns {object} Result
   */
  async setCustomResolvables(parentId, data, key = "listItem") {
    // Transform data into custom resolvables format
    const customResolvables = data.map((item) => ({ [key]: item }));

    this.store.setCustomResolvables(parentId, customResolvables, this.moduleId);

    // Re-resolve all children of this parent with their custom resolvables
    await this.resolveChildrenWithCustomResolvables(
      parentId,
      customResolvables
    );

    return { success: true };
  }

  /**
   * Resolve children of a container with custom resolvables
   * @param {string} parentId - Parent container ID
   * @param {Array} customResolvables - Array of custom resolvable objects
   */
  async resolveChildrenWithCustomResolvables(parentId, customResolvables) {
    const moduleId = this.moduleId;
    const childIds = this.store.getContainerChildren(parentId, moduleId) || [];

    if (childIds.length === 0) return;

    const state = this.buildCurrentState(moduleId);

    // For each index in the custom resolvables, resolve children
    for (let index = 0; index < customResolvables.length; index++) {
      const customObjects = customResolvables[index];

      for (const childId of childIds) {
        const componentDef = this.store.getComponentDefinition(
          childId,
          moduleId
        );
        if (!componentDef) continue;

        // Resolve with custom objects for this index
        const resolved = this.resolveComponent(
          childId,
          componentDef,
          state,
          customObjects
        );

        // Store indexed resolved properties
        this.store.setIndexedResolvedProperties(
          childId,
          index,
          resolved,
          moduleId
        );

        // Push to main thread
        this.batcher.emit(OperationTypes.SET_RESOLVED, {
          componentId: childId,
          index,
          resolved,
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS - Component Operations
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set a component property
   * @param {string} componentId - Component ID
   * @param {string} propertyPath - Property path (e.g., "properties.text")
   * @param {*} value - Value to set
   * @returns {object} Result
   */
  async setProperty(componentId, propertyPath, value) {
    const moduleId = this.moduleId;

    const component = this.store.getComponentDefinition(componentId, moduleId);
    if (!component) {
      return { success: false, error: "Component not found" };
    }

    // Parse property path (e.g., "properties.text" or "styles.backgroundColor")
    const [type, property] = propertyPath.split(".");

    if (type === "properties" && component.properties) {
      component.properties[property] = value;
    } else if (type === "styles" && component.styles) {
      component.styles[property] = value;
    }

    // Rebuild dependencies for this component
    this.buildComponentDependencies(componentId, component);

    // Re-resolve this component
    const state = this.buildCurrentState(moduleId);
    const resolved = this.resolveComponent(componentId, component, state);
    this.store.setResolvedProperties(componentId, resolved, moduleId);

    // Push to main thread
    this.batcher.emit(OperationTypes.SET_RESOLVED, {
      componentId,
      resolved,
    });

    return { success: true };
  }

  /**
   * Add a new component
   * @param {object} component - Component definition
   * @returns {object} Result
   */
  async addComponent(component) {
    const moduleId = this.moduleId;

    // Add to store
    this.store.setComponentDefinition(component.id, component, moduleId);

    // Update container children
    const parentId = component.parent || "canvas";
    this.store.addContainerChild(parentId, component.id, moduleId);

    // Add name mapping
    if (component.name) {
      this.store.setComponentNameMapping(
        component.name,
        component.id,
        moduleId
      );
    }

    // Initialize exposed values
    this.initializeComponentExposedValues(component, moduleId);

    // Push container children to main thread
    this.batcher.emit(OperationTypes.SET_CHILDREN, {
      containerId: parentId,
      childIds: this.store.getContainerChildren(parentId, moduleId),
    });

    // Build dependencies for this component
    this.buildComponentDependencies(component.id, component);

    // Resolve this component
    const state = this.buildCurrentState(moduleId);
    const resolved = this.resolveComponent(component.id, component, state);
    this.store.setResolvedProperties(component.id, resolved, moduleId);

    // Push resolved properties to main thread
    this.batcher.emit(OperationTypes.SET_RESOLVED, {
      componentId: component.id,
      resolved,
    });

    return { success: true, componentId: component.id };
  }

  /**
   * Delete a component
   * @param {string} componentId - Component ID
   * @returns {object} Result
   */
  async deleteComponent(componentId) {
    const moduleId = this.moduleId;

    const component = this.store.getComponentDefinition(componentId, moduleId);
    if (!component) {
      return { success: false, error: "Component not found" };
    }

    // Remove from parent container
    const parentId = component.parent || "canvas";
    this.store.removeContainerChild(parentId, componentId, moduleId);

    // Remove name mapping
    if (component.name) {
      this.store.removeComponentNameMapping(component.name, moduleId);
    }

    // Remove from dependency tracker
    this.dependencyTracker.removeComponent(componentId);

    // Delete from store
    this.store.deleteComponentDefinition(componentId, moduleId);

    // Push to main thread
    this.batcher.emit(OperationTypes.SET_CHILDREN, {
      containerId: parentId,
      childIds: this.store.getContainerChildren(parentId, moduleId),
    });

    this.batcher.emit(OperationTypes.DELETE_RESOLVED, { componentId });

    return { success: true };
  }

  /**
   * Move a component to a different parent
   * @param {string} componentId - Component ID
   * @param {string} newParentId - New parent container ID
   * @returns {object} Result
   */
  async moveComponent(componentId, newParentId) {
    const moduleId = this.moduleId;

    const component = this.store.getComponentDefinition(componentId, moduleId);
    if (!component) {
      return { success: false, error: "Component not found" };
    }

    const oldParentId = component.parent || "canvas";

    // Update component's parent
    component.parent = newParentId;

    // Update container children
    this.store.removeContainerChild(oldParentId, componentId, moduleId);
    this.store.addContainerChild(newParentId, componentId, moduleId);

    // Push to main thread
    this.batcher.emit(OperationTypes.SET_CHILDREN, {
      containerId: oldParentId,
      childIds: this.store.getContainerChildren(oldParentId, moduleId),
    });

    this.batcher.emit(OperationTypes.SET_CHILDREN, {
      containerId: newParentId,
      childIds: this.store.getContainerChildren(newParentId, moduleId),
    });

    return { success: true };
  }

  /**
   * Set component layout
   * @param {string} componentId - Component ID
   * @param {object} layout - Layout object
   * @param {string} layoutType - 'desktop' or 'mobile'
   * @returns {object} Result
   */
  async setLayout(componentId, layout, layoutType) {
    const component = this.store.getComponentDefinition(
      componentId,
      this.moduleId
    );
    if (!component) {
      return { success: false, error: "Component not found" };
    }

    if (!component.layouts) {
      component.layouts = {};
    }
    component.layouts[layoutType] = layout;

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS - Events & Queries (Skeleton - Phase 3)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fire a component event
   * @param {string} componentId - Component ID
   * @param {string} eventName - Event name
   * @param {object} context - Optional context { parentId, index, eventData, customObjects }
   * @returns {object} Result with actions to execute on main thread
   */
  async fireEvent(componentId, eventName, context = {}) {
    const moduleId = this.moduleId;
    const state = this.buildCurrentState(moduleId);

    this.log(`Firing event: ${componentId}.${eventName}`);

    // Execute event handlers via EventEngine
    const result = await this.eventEngine.fireEvent(
      componentId,
      eventName,
      state,
      context,
      moduleId
    );

    // Process any setVariable actions internally
    const mainThreadActions = [];
    for (const action of result.actions || []) {
      if (action.type === "setVariable") {
        // Handle setVariable internally
        await this.setVariable(action.payload.name, action.payload.value);
      } else if (action.type === "runQuery") {
        // Return query execution request to main thread
        mainThreadActions.push({
          type: "RUN_QUERY",
          queryNameOrId: action.payload.queryNameOrId,
          parameters: action.payload.parameters,
        });
      } else {
        // Other actions need main thread execution
        mainThreadActions.push(action);
      }
    }

    return {
      success: result.success,
      error: result.error,
      actions: mainThreadActions,
    };
  }

  /**
   * Run a query
   * @param {string} queryId - Query ID or name
   * @param {object} parameters - Query parameters
   * @returns {object} Result with action request for main thread
   */
  async runQuery(queryId, parameters = {}) {
    const moduleId = this.moduleId;

    this.log(`Running query: ${queryId}`);

    // Resolve query ID from name if needed
    const query = this.store.getQuery(queryId);
    if (!query) {
      // Try to find by name
      const allQueries = this.store.queries;
      const foundQuery = Object.values(allQueries).find(
        (q) => q.name === queryId || q.id === queryId
      );
      if (!foundQuery) {
        return { success: false, error: `Query not found: ${queryId}` };
      }
    }

    // Set query loading state
    const currentState =
      this.store.getQueryExposedValue(queryId, moduleId) || {};

    this.store.setQueryExposedValue(
      queryId,
      {
        ...currentState,
        isLoading: true,
        isFetching: true,
        error: null,
      },
      moduleId
    );

    // Push loading state to main thread
    this.batcher.emit(OperationTypes.SET_QUERY_STATE, {
      queryId,
      state: {
        isLoading: true,
        isFetching: true,
        error: null,
      },
    });

    // Resolve parameter values
    const state = this.buildCurrentState(moduleId);
    const resolvedParams = {};
    for (const [key, value] of Object.entries(parameters)) {
      resolvedParams[key] = this.resolutionEngine.resolveDynamicValues(
        value,
        state
      );
    }

    // Return action for main thread to execute the actual API call
    return {
      success: true,
      action: {
        type: "RUN_QUERY",
        queryId,
        parameters: resolvedParams,
      },
    };
  }

  /**
   * Handle query result from main thread
   * @param {string} queryId - Query ID
   * @param {*} data - Query result data
   * @param {string|null} error - Error message if any
   * @returns {object} Result
   */
  async handleQueryResult(queryId, data, error = null) {
    const moduleId = this.moduleId;

    // Update query exposed value
    const currentState =
      this.store.getQueryExposedValue(queryId, moduleId) || {};

    this.store.setQueryExposedValue(
      queryId,
      {
        ...currentState,
        data: error ? currentState.data : data,
        rawData: error ? currentState.rawData : data,
        isLoading: false,
        isFetching: false,
        error: error || null,
        lastUpdatedAt: new Date().toISOString(),
      },
      moduleId
    );

    // Push to main thread
    this.batcher.emit(OperationTypes.SET_QUERY_STATE, {
      queryId,
      state: {
        data: error ? currentState.data : data,
        isLoading: false,
        error: error || null,
      },
    });

    // Update dependents (components using this query's data)
    await this.resolveDependents(`queries.${queryId}.data`, moduleId);

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS - Validation (Phase 3)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate a component's current value
   * @param {string} componentId - Component ID
   * @returns {object} Validation result { isValid, errors }
   */
  async validateComponent(componentId) {
    const moduleId = this.moduleId;
    const componentDef = this.store.getComponentDefinition(
      componentId,
      moduleId
    );

    if (!componentDef) {
      return { isValid: true, errors: [] };
    }

    const state = this.buildCurrentState(moduleId);
    const value = state.components?.[componentId]?.value;

    const result = this.validationEngine.validateComponent(
      componentId,
      value,
      componentDef,
      state
    );

    // Push validation result to main thread
    this.batcher.emit(OperationTypes.SET_VALIDATION, {
      componentId,
      errors: result.errors,
    });

    return result;
  }

  /**
   * Validate multiple components (e.g., form validation)
   * @param {string[]} componentIds - Array of component IDs
   * @returns {object} Validation results { isFormValid, results }
   */
  async validateComponents(componentIds) {
    const moduleId = this.moduleId;
    const state = this.buildCurrentState(moduleId);

    const results = this.validationEngine.validateForm(
      componentIds,
      state,
      moduleId
    );
    const isFormValid = this.validationEngine.isFormValid(results);

    // Push all validation results to main thread
    for (const [componentId, result] of results) {
      this.batcher.emit(OperationTypes.SET_VALIDATION, {
        componentId,
        errors: result.errors,
      });
    }

    // Convert Map to object for serialization
    const resultsObject = {};
    for (const [componentId, result] of results) {
      resultsObject[componentId] = result;
    }

    return {
      isFormValid,
      results: resultsObject,
    };
  }

  /**
   * Execute custom JavaScript code
   * @param {string} code - JavaScript code to execute
   * @param {object} customObjects - Additional objects to include in scope
   * @returns {object} Execution result
   */
  async executeJS(code, customObjects = {}) {
    const state = this.buildCurrentState(this.moduleId);

    const result = await this.runJSEngine.executeAsync(code, state, {
      customObjects,
    });

    // Process any actions generated by the JS code
    const mainThreadActions = [];
    for (const action of result.actions || []) {
      if (action.type === "setVariable") {
        await this.setVariable(action.payload.name, action.payload.value);
      } else {
        mainThreadActions.push(action);
      }
    }

    return {
      success: result.success,
      result: result.result,
      error: result.error,
      actions: mainThreadActions,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS - Virtualization
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update visible range for lazy resolution (Phase 4)
   *
   * This method implements lazy resolution for virtualized containers like ListView.
   * Instead of resolving all rows, it only resolves visible rows plus a buffer.
   *
   * @param {string} parentId - Parent container ID (e.g., ListView component ID)
   * @param {number} start - First visible index
   * @param {number} end - Last visible index
   * @param {object} options - Optional configuration
   * @param {number} options.buffer - Buffer size (default: 10)
   * @param {number} options.totalItems - Total number of items (required for proper clamping)
   * @returns {object} Result with resolution statistics
   */
  async setVisibleRange(parentId, start, end, options = {}) {
    const { buffer = 10, totalItems = end + buffer + 1 } = options;
    const moduleId = this.moduleId;

    // Update store with visible range
    this.store.setVisibleRange(parentId, start, end, buffer);

    // Check if range actually changed
    if (!this.virtualizationManager.hasRangeChanged(parentId, start, end)) {
      this.log(`Visible range unchanged for ${parentId}, skipping resolution`);
      return { success: true, skipped: true, reason: "range_unchanged" };
    }

    this.log(
      `Setting visible range for ${parentId}: [${start}, ${end}], buffer=${buffer}, total=${totalItems}`
    );

    // Calculate resolution plan
    const plan = this.virtualizationManager.calculateResolutionPlan(
      parentId,
      start,
      end,
      totalItems,
      buffer
    );

    // Update stored range
    this.virtualizationManager.updateRange(parentId, start, end);

    // Get children of this container
    const childIds = this.store.getContainerChildren(parentId, moduleId) || [];

    if (childIds.length === 0) {
      this.log(`No children found for ${parentId}`);
      return { success: true, resolved: 0, cleanedUp: 0 };
    }

    // Get custom resolvables for this parent
    const customResolvables =
      this.store.getAllCustomResolvables(parentId, moduleId) || [];

    if (customResolvables.length === 0) {
      this.log(`No custom resolvables found for ${parentId}`);
      return { success: true, resolved: 0, cleanedUp: 0 };
    }

    // Build current state for resolution
    const state = this.buildCurrentState(moduleId);

    // Prioritize indices (visible first, then buffer)
    const prioritizedIndices = this.virtualizationManager.prioritizeIndices(
      plan.toResolve,
      start,
      end
    );

    // Resolve only the indices that need resolution
    let resolvedCount = 0;

    for (const index of prioritizedIndices) {
      if (index >= customResolvables.length) {
        continue; // Skip if index is out of bounds
      }

      const customObjects = customResolvables[index] || {};

      for (const childId of childIds) {
        const componentDef = this.store.getComponentDefinition(
          childId,
          moduleId
        );
        if (!componentDef) continue;

        // Resolve with custom objects for this index
        const resolved = this.resolveComponent(
          childId,
          componentDef,
          state,
          customObjects
        );

        // Store indexed resolved properties
        this.store.setIndexedResolvedProperties(
          childId,
          index,
          resolved,
          moduleId
        );

        // Push to main thread
        this.batcher.emit(OperationTypes.SET_RESOLVED, {
          componentId: childId,
          index,
          resolved,
        });
      }

      resolvedCount++;
    }

    // Mark indices as resolved
    this.virtualizationManager.markResolved(parentId, prioritizedIndices);

    // Cleanup off-screen indices if enabled
    let cleanedUpCount = 0;

    if (
      plan.toCleanup.length > 0 &&
      this.virtualizationManager.shouldTriggerCleanup(
        parentId,
        plan.resolveStart,
        plan.resolveEnd
      )
    ) {
      this.log(`Cleaning up ${plan.toCleanup.length} off-screen indices`);

      for (const childId of childIds) {
        this.store.clearIndexedResolvedProperties(
          childId,
          plan.toCleanup,
          moduleId
        );
      }

      this.virtualizationManager.markCleanedUp(parentId, plan.toCleanup);
      cleanedUpCount = plan.toCleanup.length;
    }

    this.log(
      `Lazy resolution complete: resolved=${resolvedCount}, cleanedUp=${cleanedUpCount}`
    );

    return {
      success: true,
      resolved: resolvedCount,
      cleanedUp: cleanedUpCount,
      stats: this.virtualizationManager.getStats(parentId),
    };
  }

  /**
   * Configure virtualization settings
   * @param {object} config - Virtualization configuration
   * @returns {object} Result
   */
  configureVirtualization(config) {
    this.virtualizationManager.configure(config);
    return { success: true };
  }

  /**
   * Clear virtualization state for a container
   * @param {string} parentId - Parent container ID
   * @returns {object} Result
   */
  clearVirtualizationState(parentId) {
    this.virtualizationManager.clearContainer(parentId);
    this.store.clearVisibleRange(parentId);
    return { success: true };
  }

  /**
   * Get virtualization debug info
   * @returns {object} Virtualization debug info
   */
  getVirtualizationInfo() {
    return this.virtualizationManager.getDebugInfo();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS - Recovery & Sync
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Restore runtime state after worker recovery
   * @param {object} exposedValues - Exposed values to restore
   * @returns {object} Result
   */
  async restoreState(exposedValues) {
    const module = this.store.getModule(this.moduleId);

    if (exposedValues) {
      module.exposedValues = exposedValues;
    }

    // Push full state back
    this.pushFullState(this.moduleId);

    return { success: true };
  }

  /**
   * Request full state sync
   * @returns {object} Result
   */
  async requestFullSync() {
    this.pushFullState(this.moduleId);
    return { success: true };
  }

  /**
   * Health check ping
   * @returns {object} Pong response
   */
  async ping() {
    return {
      pong: true,
      timestamp: Date.now(),
      isInitialized: this.isInitialized,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clean up resources
   */
  destroy() {
    if (this.batcher) {
      this.batcher.clear();
    }
    this.dependencyTracker.clear();
    this.resolutionEngine.clearCache();
    this.virtualizationManager?.clearAll();
    this.store?.reset();
    this.isInitialized = false;
    this.mainThreadCallback = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBUG METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get debug information about the current state
   * @returns {object} Debug info
   */
  async getDebugInfo() {
    const moduleId = this.moduleId;
    const module = this.store?.getModule(moduleId);

    return {
      isInitialized: this.isInitialized,
      moduleId: this.moduleId,
      componentCount: module
        ? Object.keys(module.componentDefinitions).length
        : 0,
      queryCount: this.store ? Object.keys(this.store.queries).length : 0,
      dependencyGraph: this.dependencyTracker.toDebugObject(),
      exposedValues: module?.exposedValues || {},
      resolvedProperties: module?.resolvedProperties || {},
    };
  }

  /**
   * Get resolved properties for a specific component
   * @param {string} componentId - Component ID
   * @returns {object} Resolved properties
   */
  async getResolvedProperties(componentId) {
    return this.store?.getResolvedProperties(componentId, this.moduleId) || {};
  }

  /**
   * Get all resolved properties
   * @returns {object} All resolved properties keyed by component ID
   */
  async getAllResolvedProperties() {
    const module = this.store?.getModule(this.moduleId);
    return module?.resolvedProperties || {};
  }

  /**
   * Force re-resolve all components (useful for debugging)
   * @returns {object} Result
   */
  async forceResolveAll() {
    await this.resolveAllComponents(this.moduleId);
    return { success: true };
  }
}

// Export singleton instance for Comlink
export const computeEngine = new ComputeEngine();
export default ComputeEngine;
