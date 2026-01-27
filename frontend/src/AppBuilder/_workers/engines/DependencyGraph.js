/**
 * DependencyGraph
 *
 * Tracks dependencies between components, queries, and variables in the worker thread.
 * Used to determine which components need re-resolution when a value changes.
 *
 * Based on the dependency-graph npm package pattern, but implemented
 * for the worker environment.
 */

/**
 * Simple dependency graph implementation for the worker
 * Tracks who depends on whom and enables cascading updates
 */
export class DependencyGraph {
  constructor() {
    // Map of node -> Set of nodes that this node depends on
    this.dependencies = new Map();
    // Map of node -> Set of nodes that depend on this node
    this.dependents = new Map();
    // Map of node -> associated data
    this.nodeData = new Map();
  }

  /**
   * Check if a node exists in the graph
   * @param {string} node - Node identifier
   * @returns {boolean}
   */
  hasNode(node) {
    return this.dependencies.has(node);
  }

  /**
   * Add a node to the graph
   * @param {string} node - Node identifier
   * @param {*} data - Optional data to associate with the node
   */
  addNode(node, data = null) {
    if (!this.dependencies.has(node)) {
      this.dependencies.set(node, new Set());
      this.dependents.set(node, new Set());
    }
    if (data !== null) {
      this.nodeData.set(node, data);
    }
  }

  /**
   * Remove a node from the graph
   * @param {string} node - Node identifier
   */
  removeNode(node) {
    if (!this.hasNode(node)) return;

    // Remove this node from all its dependencies' dependents lists
    const deps = this.dependencies.get(node);
    if (deps) {
      for (const dep of deps) {
        const depDependents = this.dependents.get(dep);
        if (depDependents) {
          depDependents.delete(node);
        }
      }
    }

    // Remove this node from all its dependents' dependencies lists
    const depts = this.dependents.get(node);
    if (depts) {
      for (const dept of depts) {
        const deptDependencies = this.dependencies.get(dept);
        if (deptDependencies) {
          deptDependencies.delete(node);
        }
      }
    }

    // Remove the node
    this.dependencies.delete(node);
    this.dependents.delete(node);
    this.nodeData.delete(node);
  }

  /**
   * Get data associated with a node
   * @param {string} node - Node identifier
   * @returns {*} Node data
   */
  getNodeData(node) {
    return this.nodeData.get(node);
  }

  /**
   * Set data for a node
   * @param {string} node - Node identifier
   * @param {*} data - Data to associate
   */
  setNodeData(node, data) {
    if (!this.hasNode(node)) {
      this.addNode(node);
    }
    this.nodeData.set(node, data);
  }

  /**
   * Add a dependency relationship
   * fromNode depends on toNode (toNode -> fromNode)
   *
   * @param {string} fromNode - The node that has a dependency (e.g., components.button1.text)
   * @param {string} toNode - The node being depended on (e.g., queries.query1.data)
   */
  addDependency(fromNode, toNode) {
    // Ensure both nodes exist
    if (!this.hasNode(fromNode)) {
      this.addNode(fromNode);
    }
    if (!this.hasNode(toNode)) {
      this.addNode(toNode);
    }

    // fromNode depends on toNode
    this.dependencies.get(fromNode).add(toNode);
    // toNode has fromNode as a dependent
    this.dependents.get(toNode).add(fromNode);
  }

  /**
   * Remove a dependency relationship
   * @param {string} fromNode - The dependent node
   * @param {string} toNode - The dependency node
   */
  removeDependency(fromNode, toNode) {
    if (this.dependencies.has(fromNode)) {
      this.dependencies.get(fromNode).delete(toNode);
    }
    if (this.dependents.has(toNode)) {
      this.dependents.get(toNode).delete(fromNode);
    }
  }

  /**
   * Get all nodes that depend on the given node (direct and indirect)
   * @param {string} node - Node identifier
   * @returns {string[]} Array of dependent nodes
   */
  getDependents(node) {
    const result = new Set();
    const visited = new Set();
    const queue = [node];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const directDependents = this.dependents.get(current);
      if (directDependents) {
        for (const dependent of directDependents) {
          if (!visited.has(dependent)) {
            result.add(dependent);
            queue.push(dependent);
          }
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Get direct dependents only (one level)
   * @param {string} node - Node identifier
   * @returns {string[]} Array of direct dependent nodes
   */
  getDirectDependents(node) {
    const deps = this.dependents.get(node);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get all nodes that the given node depends on (direct and indirect)
   * @param {string} node - Node identifier
   * @returns {string[]} Array of dependency nodes
   */
  getDependencies(node) {
    const result = new Set();
    const visited = new Set();
    const queue = [node];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const directDependencies = this.dependencies.get(current);
      if (directDependencies) {
        for (const dependency of directDependencies) {
          if (!visited.has(dependency)) {
            result.add(dependency);
            queue.push(dependency);
          }
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Get direct dependencies only (one level)
   * @param {string} node - Node identifier
   * @returns {string[]} Array of direct dependency nodes
   */
  getDirectDependencies(node) {
    const deps = this.dependencies.get(node);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get all nodes in topological order
   * @returns {string[]} Array of nodes in dependency order
   */
  getOverallOrder() {
    const result = [];
    const visited = new Set();
    const temp = new Set();

    const visit = (node) => {
      if (temp.has(node)) {
        // Circular dependency - skip
        return;
      }
      if (visited.has(node)) {
        return;
      }

      temp.add(node);
      const deps = this.dependencies.get(node);
      if (deps) {
        for (const dep of deps) {
          visit(dep);
        }
      }
      temp.delete(node);
      visited.add(node);
      result.push(node);
    };

    for (const node of this.dependencies.keys()) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return result;
  }

  /**
   * Clear all nodes and relationships
   */
  clear() {
    this.dependencies.clear();
    this.dependents.clear();
    this.nodeData.clear();
  }

  /**
   * Get count of nodes in the graph
   * @returns {number}
   */
  get size() {
    return this.dependencies.size;
  }

  /**
   * Get all nodes
   * @returns {string[]}
   */
  getNodes() {
    return Array.from(this.dependencies.keys());
  }

  /**
   * Debug: Get a visualization of the graph
   * @returns {object}
   */
  toDebugObject() {
    const result = {};
    for (const [node, deps] of this.dependencies) {
      result[node] = {
        dependsOn: Array.from(deps),
        dependents: Array.from(this.dependents.get(node) || []),
        data: this.nodeData.get(node),
      };
    }
    return result;
  }
}

/**
 * ComponentDependencyTracker
 *
 * Higher-level abstraction for tracking component dependencies.
 * Integrates with ResolutionEngine to automatically track dependencies.
 */
export class ComponentDependencyTracker {
  constructor() {
    this.graph = new DependencyGraph();
    // Map of componentId.property -> expression (for re-resolution)
    this.expressions = new Map();
  }

  /**
   * Register a component property and its dependencies
   *
   * @param {string} componentId - Component identifier
   * @param {string} property - Property name (e.g., 'text', 'visibility')
   * @param {string} expression - The expression (e.g., '{{components.input1.value}}')
   * @param {string[]} dependencies - Extracted dependency paths
   */
  registerProperty(componentId, property, expression, dependencies) {
    const nodeId = `components.${componentId}.${property}`;

    // Store the expression for later re-resolution
    this.expressions.set(nodeId, expression);

    // Ensure the node exists
    this.graph.addNode(nodeId, { componentId, property, expression });

    // Clear old dependencies for this property
    const oldDeps = this.graph.getDirectDependencies(nodeId);
    for (const oldDep of oldDeps) {
      this.graph.removeDependency(nodeId, oldDep);
    }

    // Add new dependencies
    for (const dep of dependencies) {
      this.graph.addDependency(nodeId, dep);
    }
  }

  /**
   * Get all component properties that need to be re-resolved when a path changes
   *
   * @param {string} changedPath - The path that changed (e.g., 'queries.query1.data')
   * @returns {Array<{componentId: string, property: string, expression: string}>}
   */
  getAffectedProperties(changedPath) {
    // Get all nodes that depend on this path (directly or indirectly)
    const affected = this.graph.getDependents(changedPath);

    // Filter to only component properties and return with their expressions
    return affected
      .filter((node) => node.startsWith("components."))
      .map((node) => {
        const data = this.graph.getNodeData(node);
        return {
          nodeId: node,
          componentId: data?.componentId,
          property: data?.property,
          expression: this.expressions.get(node),
        };
      })
      .filter((item) => item.componentId && item.property);
  }

  /**
   * Remove all dependencies for a component
   * @param {string} componentId - Component identifier
   */
  removeComponent(componentId) {
    const prefix = `components.${componentId}.`;
    const nodesToRemove = this.graph
      .getNodes()
      .filter((node) => node.startsWith(prefix));

    for (const node of nodesToRemove) {
      this.graph.removeNode(node);
      this.expressions.delete(node);
    }
  }

  /**
   * Clear all tracking data
   */
  clear() {
    this.graph.clear();
    this.expressions.clear();
  }

  /**
   * Get debug information
   * @returns {object}
   */
  toDebugObject() {
    return {
      graph: this.graph.toDebugObject(),
      expressions: Object.fromEntries(this.expressions),
    };
  }
}

// Export singleton instance
export const dependencyTracker = new ComponentDependencyTracker();

export default DependencyGraph;
