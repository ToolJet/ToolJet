const { DepGraph } = require('dependency-graph');

class DependencyGraph {
  constructor() {
    this.graph = new DepGraph();
  }

  getNodeData(path) {
    return this.graph.getNodeData(path);
  }

  hasNode(path) {
    return this.graph.hasNode(path);
  }

  addDependency(fromPath, toPath, nodeData = '') {
    if (fromPath.startsWith('variables.')) {
      if (!this.hasNode(fromPath)) {
        const parts = fromPath.split('.');
        fromPath = parts.slice(0, 2).join('.');
        this.graph.addNode(fromPath);
      }
    } else {
      fromPath = this.addNode(fromPath, 3);
    }

    if (!this.hasNode(toPath)) {
      this.addNode(toPath, 2);
    }

    this.graph.addDependency(fromPath, toPath); // queries.queryID.data -> components.componentID.property.text
    this.graph.setNodeData(toPath, nodeData);
  }

  removeDependency(toPath, clearToPath = false) {
    const dependents = this.getDirectDependents(toPath);
    let oldFromPath = null;
    if (dependents.length === 0) return;
    for (const dependent of dependents) {
      if (!toPath.startsWith(dependent)) {
        oldFromPath = dependent;
        break;
      }
    }

    if (oldFromPath) {
      this.graph.removeDependency(oldFromPath, toPath);
      this.removeNodeAndParentsIfOrphaned(oldFromPath);
    }

    if (clearToPath) this.removeNodeAndParentsIfOrphaned(toPath);
  }

  updateDependency(newFromPath, toPath, nodeData = '') {
    this.removeDependency(toPath);
    this.addDependency(newFromPath, toPath, nodeData);
  }

  removeNode(path) {
    if (this.hasNode(path)) {
      const nodesToRemove = this.graph.overallOrder().filter((node) => node.startsWith(`${path}.`));
      const potentialOrphans = new Set();

      nodesToRemove.forEach((node) => {
        const dependents = this.getDependents(node);
        const dependencies = this.getDependencies(node);

        dependents.forEach((dependent) => {
          this.graph.removeDependency(dependent, node);
          potentialOrphans.add(dependent);
        });

        dependencies.forEach((dependency) => {
          this.graph.removeDependency(node, dependency);
          potentialOrphans.add(dependency);
        });

        this.graph.removeNode(node);
      });

      this.cleanupOrphanedNodes(potentialOrphans);
    }
  }

  cleanupOrphanedNodes(potentialOrphans) {
    potentialOrphans.forEach((node) => {
      if (this.hasNode(node)) {
        const dependencies = this.getDependencies(node);
        const dependents = this.getDependents(node);
        if (dependencies.length + dependents.length <= 1) {
          this.graph.removeNode(node);
          this.removeNodeAndParentsIfOrphaned(node);
        }
      }
    });
  }

  removeNodeAndParentsIfOrphaned(path) {
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 1; i--) {
      const currentPath = parts.slice(0, i).join('.');
      if (this.hasNode(currentPath)) {
        const dependencies = this.getDependencies(currentPath);
        const dependents = this.getDependents(currentPath);
        if (dependencies.length + dependents.length <= 1) {
          this.removeNode(currentPath);
        } else {
          break;
        }
      }
    }
  }

  /**
   * @description Add a node to the graph.
   * @param {string} path - The path of the node to add.
   * @param {number} splitParts - The number of parts to split the path into.
   * LHS needs to be split into 3 parts (queries.queryID.data), and RHS needs to be split into 2 parts (components.componentID).
   */
  addNode(path, splitParts = 3) {
    const parts = path.split('.');

    const basePath = parts.slice(0, 2).join('.'); // queries.queryID or components.componentID
    if (!this.hasNode(basePath)) {
      this.graph.addNode(basePath);
    }
    if (splitParts === 3) {
      if (!this.hasNode(path)) {
        this.graph.addNode(path);
      }
      const dataPath = parts.slice(0, 3).join('.'); // queries.queryID.data
      if (!this.hasNode(dataPath)) {
        this.graph.addNode(dataPath);
      }
      if (dataPath !== basePath) {
        this.graph.addDependency(basePath, dataPath);
      }
      return dataPath;
    } else if (splitParts === 2) {
      if (!this.hasNode(path)) {
        this.graph.addNode(path);
      }
      if (path !== basePath) {
        this.graph.addDependency(basePath, path);
      }
    }
  }

  getDependencies(path) {
    return this.hasNode(path) ? this.graph.dependenciesOf(path) : [];
  }

  getDirectDependencies(path) {
    return this.hasNode(path) ? this.graph.directDependenciesOf(path) : [];
  }

  getDependents(path) {
    return this.hasNode(path) ? this.graph.dependantsOf(path) : [];
  }

  getDirectDependents(path) {
    return this.hasNode(path) ? this.graph.directDependantsOf(path) : [];
  }

  getOverallOrder() {
    return this.graph.overallOrder();
  }
}

export default DependencyGraph;
