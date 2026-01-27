/**
 * OperationBatcher
 *
 * Collects operations during RPC method execution and batches them for
 * efficient transfer to the main thread via callback.
 *
 * Features:
 * - Batches multiple operations into a single callback invocation
 * - Automatically flushes every 16ms (one frame) or on idle
 * - Provides immediate flush capability for critical operations
 */

export class OperationBatcher {
  constructor(onFlush) {
    this.onFlush = onFlush;
    this.pendingOps = [];
    this.flushTimeout = null;
    this.batchInterval = 16; // ~60fps, one frame
  }

  /**
   * Emit an operation to be batched
   * @param {string} type - Operation type from OperationTypes
   * @param {object} payload - Operation payload
   */
  emit(type, payload) {
    this.pendingOps.push({
      type,
      ...payload,
    });
    this.scheduleFlush();
  }

  /**
   * Schedule a flush if not already scheduled
   */
  scheduleFlush() {
    if (this.flushTimeout === null) {
      this.flushTimeout = setTimeout(() => {
        this.flush();
      }, this.batchInterval);
    }
  }

  /**
   * Immediately flush all pending operations
   */
  flush() {
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingOps.length === 0) {
      console.log('[OperationBatcher] flush() called but no pending ops');
      return;
    }

    const operations = this.pendingOps;
    console.log('[OperationBatcher] Flushing', operations.length, 'operations:', operations.map(op => op.type));

    // Clear pending items before flush in case flush triggers more operations
    this.pendingOps = [];

    // Call the callback with batched operations
    if (this.onFlush) {
      console.log('[OperationBatcher] Calling onFlush callback');
      this.onFlush(operations);
    } else {
      console.warn('[OperationBatcher] No onFlush callback set!');
    }
  }

  /**
   * Emit an operation and immediately flush
   * Use for critical operations that need immediate delivery
   * @param {string} type - Operation type
   * @param {object} payload - Operation payload
   */
  emitImmediate(type, payload) {
    this.emit(type, payload);
    this.flush();
  }

  /**
   * Clear all pending operations without sending
   * Use during cleanup or reset
   */
  clear() {
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.pendingOps = [];
  }

  /**
   * Get count of pending operations
   * @returns {number} Number of pending operations
   */
  get pendingCount() {
    return this.pendingOps.length;
  }
}

export default OperationBatcher;
