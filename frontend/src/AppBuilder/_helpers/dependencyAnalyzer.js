/**
 * Dependency Graph Performance Analyzer
 * Run this to understand why dependency graph initialization is slow
 */

export class DependencyGraphAnalyzer {
  constructor() {
    this.analysis = {
      totalComponents: 0,
      totalDependencies: 0,
      circularDependencies: [],
      heaviestComponents: [],
      dependencyDepth: 0,
      orphanedComponents: [],
      recommendations: []
    };
  }

  /**
   * Analyze the current dependency graph performance
   */
  analyzeDependencyGraph() {
    console.log('🔍 Analyzing Dependency Graph Performance...');

    const startTime = performance.now();

    try {
      const store = window.useStore?.getState();
      if (!store) {
        console.error('❌ Cannot access store. Make sure you are in the ToolJet app.');
        return null;
      }

      const components = store.modules?.canvas?.components || {};
      this.analyzeComponents(components);
      this.findCircularDependencies(components);
      this.calculateDependencyDepth(components);
      this.identifyHeaviestComponents(components);
      this.findOrphanedComponents(components);
      this.generateRecommendations();

      const analysisTime = performance.now() - startTime;
      console.log(`📊 Analysis completed in ${analysisTime.toFixed(2)}ms`);

      this.printReport();
      return this.analysis;

    } catch (error) {
      console.error('❌ Error during analysis:', error);
      return null;
    }
  }

  /**
   * Analyze basic component structure
   */
  analyzeComponents(components) {
    this.analysis.totalComponents = Object.keys(components).length;

    let totalDeps = 0;
    Object.values(components).forEach(component => {
      const componentDeps = this.extractComponentDependencies(component);
      totalDeps += componentDeps.length;
    });

    this.analysis.totalDependencies = totalDeps;

    console.log(`📋 Found ${this.analysis.totalComponents} components with ${totalDeps} total dependencies`);
  }

  /**
   * Extract dependencies from a component
   */
  extractComponentDependencies(component) {
    const dependencies = new Set();
    const componentStr = JSON.stringify(component);

    // Find references to other components (common patterns)
    const patterns = [
      /\{\{components\.(\w+)/g,  // {{components.componentName
      /\{\{globals\.(\w+)/g,    // {{globals.variableName
      /\{\{queries\.(\w+)/g,    // {{queries.queryName
      /"component":\s*"(\w+)"/g, // Direct component references
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(componentStr)) !== null) {
        dependencies.add(match[1]);
      }
    });

    return Array.from(dependencies);
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(components) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (componentId, path = []) => {
      if (recursionStack.has(componentId)) {
        const cycleStart = path.indexOf(componentId);
        const cycle = path.slice(cycleStart).concat([componentId]);
        cycles.push(cycle);
        return;
      }

      if (visited.has(componentId)) {
        return;
      }

      visited.add(componentId);
      recursionStack.add(componentId);
      path.push(componentId);

      const component = components[componentId];
      if (component) {
        const deps = this.extractComponentDependencies(component);
        deps.forEach(depId => {
          if (components[depId]) {
            dfs(depId, [...path]);
          }
        });
      }

      recursionStack.delete(componentId);
      path.pop();
    };

    Object.keys(components).forEach(componentId => {
      if (!visited.has(componentId)) {
        dfs(componentId);
      }
    });

    this.analysis.circularDependencies = cycles;

    if (cycles.length > 0) {
      console.warn(`⚠️ Found ${cycles.length} circular dependencies:`, cycles);
    } else {
      console.log('✅ No circular dependencies found');
    }
  }

  /**
   * Calculate maximum dependency depth
   */
  calculateDependencyDepth(components) {
    let maxDepth = 0;
    const depths = new Map();

    const calculateDepth = (componentId, visited = new Set()) => {
      if (depths.has(componentId)) {
        return depths.get(componentId);
      }

      if (visited.has(componentId)) {
        return 0; // Circular dependency
      }

      visited.add(componentId);

      const component = components[componentId];
      if (!component) {
        return 0;
      }

      const deps = this.extractComponentDependencies(component);
      let depth = 0;

      deps.forEach(depId => {
        if (components[depId]) {
          depth = Math.max(depth, calculateDepth(depId, new Set(visited)) + 1);
        }
      });

      depths.set(componentId, depth);
      maxDepth = Math.max(maxDepth, depth);

      return depth;
    };

    Object.keys(components).forEach(componentId => {
      calculateDepth(componentId);
    });

    this.analysis.dependencyDepth = maxDepth;
    console.log(`📏 Maximum dependency depth: ${maxDepth}`);
  }

  /**
   * Identify components with most dependencies
   */
  identifyHeaviestComponents(components) {
    const componentWeights = Object.entries(components).map(([id, component]) => {
      const dependencies = this.extractComponentDependencies(component);
      const size = JSON.stringify(component).length;

      return {
        id,
        type: component.component?.component || 'unknown',
        dependencyCount: dependencies.length,
        size,
        weight: dependencies.length * 10 + size / 1000 // Combined weight
      };
    }).sort((a, b) => b.weight - a.weight);

    this.analysis.heaviestComponents = componentWeights.slice(0, 10);

    console.log('🏋️ Top 5 heaviest components:', this.analysis.heaviestComponents.slice(0, 5));
  }

  /**
   * Find components with no dependencies or dependents
   */
  findOrphanedComponents(components) {
    const allDependencies = new Set();
    const componentDeps = new Map();

    // Collect all dependencies
    Object.entries(components).forEach(([id, component]) => {
      const deps = this.extractComponentDependencies(component);
      componentDeps.set(id, deps);
      deps.forEach(dep => allDependencies.add(dep));
    });

    // Find orphaned components (no dependencies and not depended upon)
    const orphaned = Object.keys(components).filter(id => {
      const hasNoDeps = componentDeps.get(id).length === 0;
      const notDependedUpon = !allDependencies.has(id);
      return hasNoDeps && notDependedUpon;
    });

    this.analysis.orphanedComponents = orphaned;

    if (orphaned.length > 0) {
      console.log(`🏝️ Found ${orphaned.length} orphaned components:`, orphaned);
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Component count recommendations
    if (this.analysis.totalComponents > 200) {
      recommendations.push({
        type: 'CRITICAL',
        message: `High component count (${this.analysis.totalComponents}). Consider component virtualization.`,
        impact: 'HIGH',
        effort: 'MEDIUM'
      });
    }

    // Dependency depth recommendations
    if (this.analysis.dependencyDepth > 15) {
      recommendations.push({
        type: 'WARNING',
        message: `Deep dependency chain (${this.analysis.dependencyDepth} levels). Consider flattening structure.`,
        impact: 'MEDIUM',
        effort: 'HIGH'
      });
    }

    // Circular dependency recommendations
    if (this.analysis.circularDependencies.length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        message: `${this.analysis.circularDependencies.length} circular dependencies found. This causes infinite loops in dependency resolution.`,
        impact: 'CRITICAL',
        effort: 'HIGH'
      });
    }

    // Heavy component recommendations
    const heavyComponents = this.analysis.heaviestComponents.filter(c => c.weight > 100);
    if (heavyComponents.length > 0) {
      recommendations.push({
        type: 'WARNING',
        message: `${heavyComponents.length} components are very heavy. Consider breaking them down.`,
        impact: 'MEDIUM',
        effort: 'MEDIUM'
      });
    }

    // Total dependency recommendations
    const avgDepsPerComponent = this.analysis.totalDependencies / this.analysis.totalComponents;
    if (avgDepsPerComponent > 5) {
      recommendations.push({
        type: 'WARNING',
        message: `High average dependencies per component (${avgDepsPerComponent.toFixed(1)}). Consider reducing coupling.`,
        impact: 'MEDIUM',
        effort: 'HIGH'
      });
    }

    this.analysis.recommendations = recommendations;
  }

  /**
   * Print detailed analysis report
   */
  printReport() {
    console.log('\n📊 ===== DEPENDENCY GRAPH ANALYSIS REPORT =====');
    console.log(`📋 Total Components: ${this.analysis.totalComponents}`);
    console.log(`🔗 Total Dependencies: ${this.analysis.totalDependencies}`);
    console.log(`📏 Max Dependency Depth: ${this.analysis.dependencyDepth}`);
    console.log(`🔄 Circular Dependencies: ${this.analysis.circularDependencies.length}`);
    console.log(`🏝️ Orphaned Components: ${this.analysis.orphanedComponents.length}`);

    if (this.analysis.recommendations.length > 0) {
      console.log('\n⚠️ RECOMMENDATIONS:');
      this.analysis.recommendations.forEach((rec, index) => {
        const icon = rec.type === 'CRITICAL' ? '🔴' : rec.type === 'WARNING' ? '🟡' : 'ℹ️';
        console.log(`${icon} ${index + 1}. ${rec.message}`);
        console.log(`   Impact: ${rec.impact} | Effort: ${rec.effort}`);
      });
    }

    if (this.analysis.heaviestComponents.length > 0) {
      console.log('\n🏋️ HEAVIEST COMPONENTS:');
      this.analysis.heaviestComponents.slice(0, 5).forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.id} (${comp.type})`);
        console.log(`   Dependencies: ${comp.dependencyCount} | Size: ${(comp.size / 1024).toFixed(1)}KB`);
      });
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Address circular dependencies first (critical)');
    console.log('2. Optimize heaviest components');
    console.log('3. Consider component virtualization');
    console.log('4. Implement dependency batching');

    console.log('\n🔧 To get detailed data: window.depAnalyzer.analysis');
  }

  /**
   * Simulate optimized dependency resolution
   */
  simulateOptimizedResolution() {
    console.log('\n🧪 Simulating optimized dependency resolution...');

    const batchSize = 10;
    const totalBatches = Math.ceil(this.analysis.totalComponents / batchSize);
    const estimatedTimePerBatch = 50; // ms
    const estimatedTotalTime = totalBatches * estimatedTimePerBatch;

    console.log(`📊 Optimization Simulation:`);
    console.log(`  Current time: ~7,161ms`);
    console.log(`  Batched approach: ${totalBatches} batches × ${estimatedTimePerBatch}ms = ${estimatedTotalTime}ms`);
    console.log(`  Expected improvement: ${((7161 - estimatedTotalTime) / 7161 * 100).toFixed(1)}% faster`);

    return {
      currentTime: 7161,
      optimizedTime: estimatedTotalTime,
      improvement: ((7161 - estimatedTotalTime) / 7161 * 100).toFixed(1)
    };
  }
}

// Make it globally available
window.DependencyGraphAnalyzer = DependencyGraphAnalyzer;
window.depAnalyzer = new DependencyGraphAnalyzer();

// Usage instructions
console.log('🔍 Dependency Graph Analyzer loaded!');
console.log('📖 Usage: window.depAnalyzer.analyzeDependencyGraph()');
console.log('📊 Simulation: window.depAnalyzer.simulateOptimizedResolution()');

export default DependencyGraphAnalyzer;
