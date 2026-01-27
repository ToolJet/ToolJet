/**
 * Worker Store
 *
 * The source of truth store that runs inside the Web Worker.
 * This store owns all application state and performs all computations.
 *
 * Structure:
 * - modules: Per-module state (component definitions, resolved values, exposed values)
 * - dependencyGraph: Reference to the DependencyGraph instance
 * - queries: Query definitions
 * - events: Event definitions by module
 * - visibleRanges: For lazy resolution of virtualized containers
 */

/**
 * Create a new module state structure
 * @param {string} moduleId - Module identifier
 * @returns {object} Empty module state
 */
function createModuleState(moduleId) {
  return {
    // Component definitions from backend (the "source" data)
    componentDefinitions: {},

    // Resolved component values (computed from definitions + exposed values)
    resolvedComponents: {},

    // Resolved properties per component (flat key-value pairs after resolution)
    resolvedProperties: {},

    // Indexed resolved properties for subcontainers (ListView rows)
    indexedResolvedProperties: {},

    // Exposed values (runtime state from components, queries, variables)
    exposedValues: {
      components: {},
      queries: {},
      variables: {},
      constants: {},
      globals: {},
      page: {
        handle: "",
        variables: {},
      },
    },

    // Custom resolvables for subcontainers (ListView, Kanban row contexts)
    customResolvables: {},

    // Container-to-children mapping for rendering
    containerChildren: {},

    // Component name to ID mapping for quick lookups
    componentNameIdMapping: {},
  };
}

/**
 * Create the worker store
 * @returns {object} Worker store instance
 */
export function createWorkerStore() {
  const store = {
    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    modules: {
      canvas: createModuleState("canvas"),
    },

    // Dependency graph instance (set during initialization)
    dependencyGraph: null,

    // Query definitions
    queries: {},

    // Event definitions by module
    events: {},

    // Visible ranges for lazy resolution
    visibleRanges: {},

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get or create a module
     * @param {string} moduleId - Module identifier (default: 'canvas')
     * @returns {object} Module state
     */
    getModule(moduleId = "canvas") {
      if (!this.modules[moduleId]) {
        this.modules[moduleId] = createModuleState(moduleId);
      }
      return this.modules[moduleId];
    },

    /**
     * Check if a module exists
     * @param {string} moduleId - Module identifier
     * @returns {boolean} True if module exists
     */
    hasModule(moduleId) {
      return !!this.modules[moduleId];
    },

    /**
     * Delete a module
     * @param {string} moduleId - Module identifier
     */
    deleteModule(moduleId) {
      if (moduleId !== "canvas") {
        delete this.modules[moduleId];
        delete this.events[moduleId];
      }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COMPONENT DEFINITION METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get a component definition
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     * @returns {object|undefined} Component definition
     */
    getComponentDefinition(componentId, moduleId = "canvas") {
      return this.modules[moduleId]?.componentDefinitions[componentId];
    },

    /**
     * Set a component definition
     * @param {string} componentId - Component ID
     * @param {object} definition - Component definition
     * @param {string} moduleId - Module identifier
     */
    setComponentDefinition(componentId, definition, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.componentDefinitions[componentId] = definition;
    },

    /**
     * Delete a component definition
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     */
    deleteComponentDefinition(componentId, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      delete module.componentDefinitions[componentId];
      delete module.resolvedComponents[componentId];
      delete module.exposedValues.components[componentId];
    },

    /**
     * Get all component definitions for a module
     * @param {string} moduleId - Module identifier
     * @returns {object} Map of componentId to definition
     */
    getAllComponentDefinitions(moduleId = "canvas") {
      return this.modules[moduleId]?.componentDefinitions || {};
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RESOLVED COMPONENT METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get resolved component values
     * @param {string} componentId - Component ID
     * @param {number|null} index - Subcontainer index (for ListView children)
     * @param {string} moduleId - Module identifier
     * @returns {object|undefined} Resolved component values
     */
    getResolvedComponent(componentId, index = null, moduleId = "canvas") {
      const resolved = this.modules[moduleId]?.resolvedComponents[componentId];
      if (index !== null && resolved) {
        return resolved[index];
      }
      return resolved;
    },

    /**
     * Set resolved component values
     * @param {string} componentId - Component ID
     * @param {object} resolved - Resolved values { properties, styles, validation }
     * @param {number|null} index - Subcontainer index
     * @param {string} moduleId - Module identifier
     */
    setResolvedComponent(
      componentId,
      resolved,
      index = null,
      moduleId = "canvas"
    ) {
      const module = this.getModule(moduleId);
      if (index !== null) {
        if (!module.resolvedComponents[componentId]) {
          module.resolvedComponents[componentId] = {};
        }
        module.resolvedComponents[componentId][index] = resolved;
      } else {
        module.resolvedComponents[componentId] = resolved;
      }
    },

    /**
     * Delete resolved component values
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     */
    deleteResolvedComponent(componentId, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      delete module.resolvedComponents[componentId];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RESOLVED PROPERTIES METHODS (Phase 1)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get resolved properties for a component
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     * @returns {object|undefined} Resolved properties
     */
    getResolvedProperties(componentId, moduleId = "canvas") {
      return this.modules[moduleId]?.resolvedProperties?.[componentId];
    },

    /**
     * Set resolved properties for a component
     * @param {string} componentId - Component ID
     * @param {object} resolved - Resolved properties object
     * @param {string} moduleId - Module identifier
     */
    setResolvedProperties(componentId, resolved, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.resolvedProperties[componentId] = resolved;
    },

    /**
     * Get indexed resolved properties (for ListView children)
     * @param {string} componentId - Component ID
     * @param {number} index - Row index
     * @param {string} moduleId - Module identifier
     * @returns {object|undefined} Resolved properties for that index
     */
    getIndexedResolvedProperties(componentId, index, moduleId = "canvas") {
      return this.modules[moduleId]?.indexedResolvedProperties?.[componentId]?.[
        index
      ];
    },

    /**
     * Set indexed resolved properties
     * @param {string} componentId - Component ID
     * @param {number} index - Row index
     * @param {object} resolved - Resolved properties
     * @param {string} moduleId - Module identifier
     */
    setIndexedResolvedProperties(
      componentId,
      index,
      resolved,
      moduleId = "canvas"
    ) {
      const module = this.getModule(moduleId);
      if (!module.indexedResolvedProperties[componentId]) {
        module.indexedResolvedProperties[componentId] = {};
      }
      module.indexedResolvedProperties[componentId][index] = resolved;
    },

    /**
     * Get all resolved properties for a module
     * @param {string} moduleId - Module identifier
     * @returns {object} All resolved properties keyed by component ID
     */
    getAllResolvedProperties(moduleId = "canvas") {
      return this.modules[moduleId]?.resolvedProperties || {};
    },

    /**
     * Delete resolved properties for a component
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     */
    deleteResolvedProperties(componentId, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      delete module.resolvedProperties[componentId];
      delete module.indexedResolvedProperties[componentId];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EXPOSED VALUE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get all exposed values for a module
     * @param {string} moduleId - Module identifier
     * @returns {object} Exposed values object
     */
    getAllExposedValues(moduleId = "canvas") {
      return this.modules[moduleId]?.exposedValues;
    },

    /**
     * Get exposed value for a component
     * @param {string} componentId - Component ID
     * @param {string} key - Property key (optional, returns all if not specified)
     * @param {number|null} index - Subcontainer index
     * @param {string} moduleId - Module identifier
     * @returns {*} Exposed value
     */
    getComponentExposedValue(
      componentId,
      key = null,
      index = null,
      moduleId = "canvas"
    ) {
      const components = this.modules[moduleId]?.exposedValues?.components;
      if (!components) return undefined;

      let componentValues = components[componentId];
      if (index !== null && componentValues) {
        componentValues = componentValues[index];
      }

      if (key !== null && componentValues) {
        return componentValues[key];
      }
      return componentValues;
    },

    /**
     * Set exposed value for a component
     * @param {string} componentId - Component ID
     * @param {string} key - Property key
     * @param {*} value - Value to set
     * @param {number|null} index - Subcontainer index
     * @param {string} moduleId - Module identifier
     */
    setComponentExposedValue(
      componentId,
      key,
      value,
      index = null,
      moduleId = "canvas"
    ) {
      const module = this.getModule(moduleId);
      const components = module.exposedValues.components;

      if (index !== null) {
        if (!components[componentId]) {
          components[componentId] = {};
        }
        if (!components[componentId][index]) {
          components[componentId][index] = {};
        }
        components[componentId][index][key] = value;
      } else {
        if (!components[componentId]) {
          components[componentId] = {};
        }
        components[componentId][key] = value;
      }
    },

    /**
     * Set multiple exposed values for a component
     * @param {string} componentId - Component ID
     * @param {object} values - Key-value pairs to set
     * @param {number|null} index - Subcontainer index
     * @param {string} moduleId - Module identifier
     */
    setComponentExposedValues(
      componentId,
      values,
      index = null,
      moduleId = "canvas"
    ) {
      for (const [key, value] of Object.entries(values)) {
        this.setComponentExposedValue(componentId, key, value, index, moduleId);
      }
    },

    /**
     * Get exposed value for a query
     * @param {string} queryId - Query ID
     * @param {string} moduleId - Module identifier
     * @returns {object} Query exposed value
     */
    getQueryExposedValue(queryId, moduleId = "canvas") {
      return this.modules[moduleId]?.exposedValues?.queries?.[queryId];
    },

    /**
     * Set exposed value for a query
     * @param {string} queryId - Query ID
     * @param {object} value - Query state { data, rawData, isLoading, error, lastUpdatedAt }
     * @param {string} moduleId - Module identifier
     */
    setQueryExposedValue(queryId, value, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.exposedValues.queries[queryId] = value;
    },

    /**
     * Get variable value
     * @param {string} name - Variable name
     * @param {string} moduleId - Module identifier
     * @returns {*} Variable value
     */
    getVariable(name, moduleId = "canvas") {
      return this.modules[moduleId]?.exposedValues?.variables?.[name];
    },

    /**
     * Set variable value
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     * @param {string} moduleId - Module identifier
     */
    setVariable(name, value, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.exposedValues.variables[name] = value;
    },

    /**
     * Set globals
     * @param {object} globals - Global values
     * @param {string} moduleId - Module identifier
     */
    setGlobals(globals, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.exposedValues.globals = globals;
    },

    /**
     * Set page info
     * @param {object} page - Page info { handle, variables }
     * @param {string} moduleId - Module identifier
     */
    setPage(page, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.exposedValues.page = page;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOM RESOLVABLES METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get custom resolvables for a parent (e.g., ListView row data)
     * @param {string} parentId - Parent container ID
     * @param {number} index - Row index
     * @param {string} moduleId - Module identifier
     * @returns {object} Custom resolvables for that index
     */
    getCustomResolvables(parentId, index, moduleId = "canvas") {
      return this.modules[moduleId]?.customResolvables?.[parentId]?.[index];
    },

    /**
     * Set custom resolvables for a parent
     * @param {string} parentId - Parent container ID
     * @param {Array} data - Array of resolvable objects
     * @param {string} moduleId - Module identifier
     */
    setCustomResolvables(parentId, data, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.customResolvables[parentId] = data;
    },

    /**
     * Get all custom resolvables for a parent
     * @param {string} parentId - Parent container ID
     * @param {string} moduleId - Module identifier
     * @returns {Array} Array of custom resolvables
     */
    getAllCustomResolvables(parentId, moduleId = "canvas") {
      return this.modules[moduleId]?.customResolvables?.[parentId] || [];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CONTAINER CHILDREN METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get children of a container
     * @param {string} containerId - Container ID
     * @param {string} moduleId - Module identifier
     * @returns {string[]} Array of child component IDs
     */
    getContainerChildren(containerId, moduleId = "canvas") {
      return this.modules[moduleId]?.containerChildren?.[containerId] || [];
    },

    /**
     * Set children of a container
     * @param {string} containerId - Container ID
     * @param {string[]} childIds - Array of child component IDs
     * @param {string} moduleId - Module identifier
     */
    setContainerChildren(containerId, childIds, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.containerChildren[containerId] = childIds;
    },

    /**
     * Add a child to a container
     * @param {string} containerId - Container ID
     * @param {string} childId - Child component ID
     * @param {string} moduleId - Module identifier
     */
    addContainerChild(containerId, childId, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      if (!module.containerChildren[containerId]) {
        module.containerChildren[containerId] = [];
      }
      if (!module.containerChildren[containerId].includes(childId)) {
        module.containerChildren[containerId].push(childId);
      }
    },

    /**
     * Remove a child from a container
     * @param {string} containerId - Container ID
     * @param {string} childId - Child component ID
     * @param {string} moduleId - Module identifier
     */
    removeContainerChild(containerId, childId, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      const children = module.containerChildren[containerId];
      if (children) {
        const index = children.indexOf(childId);
        if (index !== -1) {
          children.splice(index, 1);
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NAME-ID MAPPING METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get component ID by name
     * @param {string} name - Component name
     * @param {string} moduleId - Module identifier
     * @returns {string|undefined} Component ID
     */
    getComponentIdByName(name, moduleId = "canvas") {
      return this.modules[moduleId]?.componentNameIdMapping?.[name];
    },

    /**
     * Set component name-ID mapping
     * @param {string} name - Component name
     * @param {string} id - Component ID
     * @param {string} moduleId - Module identifier
     */
    setComponentNameMapping(name, id, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      module.componentNameIdMapping[name] = id;
    },

    /**
     * Remove component name mapping
     * @param {string} name - Component name
     * @param {string} moduleId - Module identifier
     */
    removeComponentNameMapping(name, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      delete module.componentNameIdMapping[name];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // VISIBLE RANGE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get visible range for a container
     * @param {string} parentId - Parent container ID
     * @returns {object} Visible range { start, end, buffer }
     */
    getVisibleRange(parentId) {
      return this.visibleRanges[parentId];
    },

    /**
     * Set visible range for a container
     * @param {string} parentId - Parent container ID
     * @param {number} start - Start index
     * @param {number} end - End index
     * @param {number} buffer - Buffer size (default: 10)
     */
    setVisibleRange(parentId, start, end, buffer = 10) {
      this.visibleRanges[parentId] = { start, end, buffer };
    },

    /**
     * Clear visible range for a container
     * @param {string} parentId - Parent container ID
     */
    clearVisibleRange(parentId) {
      delete this.visibleRanges[parentId];
    },

    /**
     * Check if an index is within the visible range (including buffer)
     * @param {string} parentId - Parent container ID
     * @param {number} index - Index to check
     * @returns {boolean} True if index is within buffered visible range
     */
    isIndexVisible(parentId, index) {
      const range = this.visibleRanges[parentId];
      if (!range) return true; // If no range set, consider all visible
      const { start, end, buffer } = range;
      return index >= start - buffer && index <= end + buffer;
    },

    /**
     * Get all indexed resolved properties for a component
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     * @returns {object} Map of index to resolved properties
     */
    getAllIndexedResolvedProperties(componentId, moduleId = "canvas") {
      return (
        this.modules[moduleId]?.indexedResolvedProperties?.[componentId] || {}
      );
    },

    /**
     * Clear indexed resolved properties for specific indices
     * @param {string} componentId - Component ID
     * @param {number[]} indices - Indices to clear
     * @param {string} moduleId - Module identifier
     */
    clearIndexedResolvedProperties(componentId, indices, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      const props = module.indexedResolvedProperties[componentId];
      if (props) {
        for (const index of indices) {
          delete props[index];
        }
      }
    },

    /**
     * Clear all indexed resolved properties for a component
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     */
    clearAllIndexedResolvedProperties(componentId, moduleId = "canvas") {
      const module = this.getModule(moduleId);
      delete module.indexedResolvedProperties[componentId];
    },

    /**
     * Get the indices that have resolved properties
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     * @returns {number[]} Array of resolved indices
     */
    getResolvedIndices(componentId, moduleId = "canvas") {
      const props =
        this.modules[moduleId]?.indexedResolvedProperties?.[componentId];
      return props ? Object.keys(props).map(Number) : [];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get a query definition
     * @param {string} queryId - Query ID
     * @returns {object|undefined} Query definition
     */
    getQuery(queryId) {
      return this.queries[queryId];
    },

    /**
     * Set a query definition
     * @param {string} queryId - Query ID
     * @param {object} query - Query definition
     */
    setQuery(queryId, query) {
      this.queries[queryId] = query;
    },

    /**
     * Delete a query
     * @param {string} queryId - Query ID
     */
    deleteQuery(queryId) {
      delete this.queries[queryId];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get events for a module
     * @param {string} moduleId - Module identifier
     * @returns {object} Events object
     */
    getEvents(moduleId = "canvas") {
      return this.events[moduleId] || {};
    },

    /**
     * Set events for a module
     * @param {object} events - Events object
     * @param {string} moduleId - Module identifier
     */
    setEvents(events, moduleId = "canvas") {
      this.events[moduleId] = events;
    },

    /**
     * Get events for a specific component
     * @param {string} componentId - Component ID
     * @param {string} moduleId - Module identifier
     * @returns {Array} Events for the component
     */
    getComponentEvents(componentId, moduleId = "canvas") {
      return this.events[moduleId]?.[componentId] || [];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RESET METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Reset the entire store to initial state
     */
    reset() {
      this.modules = {
        canvas: createModuleState("canvas"),
      };
      this.dependencyGraph = null;
      this.queries = {};
      this.events = {};
      this.visibleRanges = {};
    },

    /**
     * Reset a specific module
     * @param {string} moduleId - Module identifier
     */
    resetModule(moduleId = "canvas") {
      this.modules[moduleId] = createModuleState(moduleId);
      delete this.events[moduleId];
    },
  };

  return store;
}

export default createWorkerStore;
