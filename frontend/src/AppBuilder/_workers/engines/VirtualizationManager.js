/**
 * VirtualizationManager
 *
 * Manages lazy resolution for virtualized containers (ListView, Kanban, etc.).
 * Tracks visible ranges and determines which indices need resolution.
 *
 * Features:
 * - Visible range tracking with configurable buffer
 * - Incremental resolution (only resolve newly visible indices)
 * - Memory cleanup for off-screen indices (optional)
 * - Priority-based resolution (visible first, then buffer)
 *
 * Phase 4: Performance Optimization
 */

/**
 * Visible range configuration
 * @typedef {Object} VisibleRange
 * @property {number} start - First visible index
 * @property {number} end - Last visible index
 * @property {number} buffer - Buffer size for pre-loading
 * @property {number} totalItems - Total number of items
 */

/**
 * Resolution plan
 * @typedef {Object} ResolutionPlan
 * @property {number[]} toResolve - Indices that need resolution
 * @property {number[]} toCleanup - Indices that can be cleaned up (optional)
 * @property {number[]} alreadyResolved - Indices that are already resolved
 * @property {number} resolveStart - Buffered start index
 * @property {number} resolveEnd - Buffered end index
 */

/**
 * VirtualizationManager class
 */
export class VirtualizationManager {
  constructor() {
    // Store reference (set via initialize)
    this.store = null;

    // Track previous ranges to detect changes
    this.previousRanges = new Map();

    // Track resolved indices per container
    this.resolvedIndices = new Map();

    // Configuration
    this.config = {
      defaultBuffer: 10,
      maxResolvedIndices: 500, // Maximum indices to keep in memory per container
      cleanupThreshold: 100, // Trigger cleanup when this many indices are off-screen
      enableCleanup: true, // Whether to cleanup off-screen indices
    };

    // Debug mode
    this.debug = false;
  }

  /**
   * Initialize with store reference
   * @param {object} store - Worker store reference
   */
  initialize(store) {
    this.store = store;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debug = enabled;
  }

  /**
   * Log debug message
   * @param {...any} args
   */
  log(...args) {
    if (this.debug) {
      console.log("[VirtualizationManager]", ...args);
    }
  }

  /**
   * Configure virtualization settings
   * @param {object} config - Configuration options
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate the resolution plan for a container
   *
   * @param {string} parentId - Container ID (e.g., ListView ID)
   * @param {number} start - First visible index
   * @param {number} end - Last visible index
   * @param {number} totalItems - Total number of items in the data
   * @param {number} buffer - Buffer size (default from config)
   * @returns {ResolutionPlan} Plan for what to resolve and cleanup
   */
  calculateResolutionPlan(parentId, start, end, totalItems, buffer = null) {
    const effectiveBuffer = buffer ?? this.config.defaultBuffer;

    // Calculate buffered range (clamped to valid indices)
    const resolveStart = Math.max(0, start - effectiveBuffer);
    const resolveEnd = Math.min(totalItems - 1, end + effectiveBuffer);

    this.log(
      `Calculating plan for ${parentId}: visible=[${start}, ${end}], buffered=[${resolveStart}, ${resolveEnd}], total=${totalItems}`
    );

    // Get already resolved indices for this container
    const alreadyResolved = this.getResolvedIndices(parentId);

    // Determine which indices need resolution
    const toResolve = [];
    const stillNeeded = new Set();

    for (let i = resolveStart; i <= resolveEnd; i++) {
      stillNeeded.add(i);
      if (!alreadyResolved.has(i)) {
        toResolve.push(i);
      }
    }

    // Determine which indices can be cleaned up
    const toCleanup = [];
    if (this.config.enableCleanup) {
      for (const index of alreadyResolved) {
        if (!stillNeeded.has(index)) {
          toCleanup.push(index);
        }
      }
    }

    // Sort for efficient iteration
    toResolve.sort((a, b) => a - b);
    toCleanup.sort((a, b) => a - b);

    this.log(
      `Plan: resolve=${toResolve.length}, cleanup=${toCleanup.length}, alreadyResolved=${alreadyResolved.size}`
    );

    return {
      toResolve,
      toCleanup,
      alreadyResolved: Array.from(alreadyResolved),
      resolveStart,
      resolveEnd,
    };
  }

  /**
   * Get the set of resolved indices for a container
   * @param {string} parentId - Container ID
   * @returns {Set<number>} Set of resolved indices
   */
  getResolvedIndices(parentId) {
    if (!this.resolvedIndices.has(parentId)) {
      this.resolvedIndices.set(parentId, new Set());
    }
    return this.resolvedIndices.get(parentId);
  }

  /**
   * Mark indices as resolved
   * @param {string} parentId - Container ID
   * @param {number[]} indices - Indices that have been resolved
   */
  markResolved(parentId, indices) {
    const resolved = this.getResolvedIndices(parentId);
    for (const index of indices) {
      resolved.add(index);
    }
    this.log(`Marked ${indices.length} indices as resolved for ${parentId}`);
  }

  /**
   * Mark indices as cleaned up (removed from resolved set)
   * @param {string} parentId - Container ID
   * @param {number[]} indices - Indices that have been cleaned up
   */
  markCleanedUp(parentId, indices) {
    const resolved = this.getResolvedIndices(parentId);
    for (const index of indices) {
      resolved.delete(index);
    }
    this.log(`Marked ${indices.length} indices as cleaned up for ${parentId}`);
  }

  /**
   * Check if an index is resolved
   * @param {string} parentId - Container ID
   * @param {number} index - Index to check
   * @returns {boolean} True if index is resolved
   */
  isResolved(parentId, index) {
    return this.getResolvedIndices(parentId).has(index);
  }

  /**
   * Check if the visible range has changed significantly
   *
   * @param {string} parentId - Container ID
   * @param {number} start - New start index
   * @param {number} end - New end index
   * @returns {boolean} True if range has changed
   */
  hasRangeChanged(parentId, start, end) {
    const previous = this.previousRanges.get(parentId);
    if (!previous) {
      return true;
    }
    return previous.start !== start || previous.end !== end;
  }

  /**
   * Update the stored visible range
   * @param {string} parentId - Container ID
   * @param {number} start - Start index
   * @param {number} end - End index
   */
  updateRange(parentId, start, end) {
    this.previousRanges.set(parentId, { start, end });
  }

  /**
   * Get scroll direction based on range change
   *
   * @param {string} parentId - Container ID
   * @param {number} newStart - New start index
   * @returns {'up' | 'down' | 'none'} Scroll direction
   */
  getScrollDirection(parentId, newStart) {
    const previous = this.previousRanges.get(parentId);
    if (!previous) {
      return "none";
    }
    if (newStart > previous.start) {
      return "down";
    } else if (newStart < previous.start) {
      return "up";
    }
    return "none";
  }

  /**
   * Prioritize indices for resolution based on visibility
   * Returns indices sorted by priority (visible first, then buffer)
   *
   * @param {number[]} indices - Indices to prioritize
   * @param {number} visibleStart - First visible index
   * @param {number} visibleEnd - Last visible index
   * @returns {number[]} Prioritized indices
   */
  prioritizeIndices(indices, visibleStart, visibleEnd) {
    const visible = [];
    const buffer = [];

    for (const index of indices) {
      if (index >= visibleStart && index <= visibleEnd) {
        visible.push(index);
      } else {
        buffer.push(index);
      }
    }

    // Sort visible by distance from center
    const center = (visibleStart + visibleEnd) / 2;
    visible.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    // Sort buffer by distance from visible range
    buffer.sort((a, b) => {
      const distA = a < visibleStart ? visibleStart - a : a - visibleEnd;
      const distB = b < visibleStart ? visibleStart - b : b - visibleEnd;
      return distA - distB;
    });

    return [...visible, ...buffer];
  }

  /**
   * Check if cleanup should be triggered
   *
   * @param {string} parentId - Container ID
   * @param {number} resolveStart - Buffered start index
   * @param {number} resolveEnd - Buffered end index
   * @returns {boolean} True if cleanup should be triggered
   */
  shouldTriggerCleanup(parentId, resolveStart, resolveEnd) {
    if (!this.config.enableCleanup) {
      return false;
    }

    const resolved = this.getResolvedIndices(parentId);
    let offScreenCount = 0;

    for (const index of resolved) {
      if (index < resolveStart || index > resolveEnd) {
        offScreenCount++;
      }
    }

    return offScreenCount >= this.config.cleanupThreshold;
  }

  /**
   * Get statistics for a container
   *
   * @param {string} parentId - Container ID
   * @returns {object} Statistics
   */
  getStats(parentId) {
    const resolved = this.getResolvedIndices(parentId);
    const range = this.previousRanges.get(parentId) || { start: 0, end: 0 };

    return {
      resolvedCount: resolved.size,
      visibleStart: range.start,
      visibleEnd: range.end,
      maxAllowed: this.config.maxResolvedIndices,
    };
  }

  /**
   * Clear all tracking for a container
   * @param {string} parentId - Container ID
   */
  clearContainer(parentId) {
    this.resolvedIndices.delete(parentId);
    this.previousRanges.delete(parentId);
    this.log(`Cleared tracking for ${parentId}`);
  }

  /**
   * Clear all virtualization state
   */
  clearAll() {
    this.resolvedIndices.clear();
    this.previousRanges.clear();
    this.log("Cleared all virtualization state");
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    const containers = {};

    for (const [parentId, resolved] of this.resolvedIndices) {
      const range = this.previousRanges.get(parentId);
      containers[parentId] = {
        resolvedCount: resolved.size,
        resolvedIndices: Array.from(resolved).slice(0, 20), // First 20 for debug
        range: range || null,
      };
    }

    return {
      config: this.config,
      containers,
    };
  }
}

// Export singleton instance
export const virtualizationManager = new VirtualizationManager();

export default VirtualizationManager;
