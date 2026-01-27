/**
 * WorkerManager
 *
 * Manages the Web Worker lifecycle and provides RPC access via Comlink.
 *
 * Responsibilities:
 * - Create and terminate the worker
 * - Provide Comlink proxy for RPC calls to worker
 * - Set up callback for receiving state updates from worker
 * - Handle worker errors and recovery
 * - Health check monitoring
 */

import * as Comlink from 'comlink';

class WorkerManager {
  constructor(options = {}) {
    // Worker instance
    this.worker = null;

    // Comlink proxy to the worker's ComputeEngine
    this.workerApi = null;

    // UI Store reference (to be set via setStore)
    this.uiStore = null;

    // App definition for recovery
    this.appDefinition = null;
    this.moduleId = 'canvas';

    // State
    this.isReady = false;
    this.isTerminated = false;

    // Health check
    this.healthCheckInterval = null;
    this.lastPongTime = null;

    // Configuration
    this.config = {
      healthCheckInterval: options.healthCheckInterval || 5000,
    };

    // Callbacks
    this.onReady = options.onReady || null;
    this.onError = options.onError || null;
    this.onRecovery = options.onRecovery || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set the UI store reference
   * @param {object} store - Zustand store with applyOperations action
   */
  setStore(store) {
    this.uiStore = store;
  }

  /**
   * Initialize the worker with an app definition
   * @param {object} appDefinition - App definition from backend
   * @param {string} moduleId - Module identifier
   * @returns {Promise<object>} Initialization result
   */
  async initialize(appDefinition, moduleId = 'canvas') {
    console.log('[WorkerManager] initialize() called with appDefinition:', appDefinition);
    this.appDefinition = appDefinition;
    this.moduleId = moduleId;

    console.log('[WorkerManager] Creating worker...');
    await this.createWorker();
    console.log('[WorkerManager] Worker created, workerApi:', this.workerApi);

    // TEST MODE: Skip Comlink calls for test worker
    if (this.testMode) {
      console.log('[WorkerManager] TEST MODE - skipping Comlink initialization');
      this.isReady = true;
      if (this.onReady) {
        this.onReady({ success: true, testMode: true });
      }
      return { success: true, testMode: true };
    }

    // Set up the callback for receiving state updates
    console.log('[WorkerManager] Setting up main thread callback...');
    await this.workerApi.setMainThreadCallback(
      Comlink.proxy((operations) => {
        this.handleOperations(operations);
      })
    );
    console.log('[WorkerManager] Callback set up');

    // Initialize the engine
    console.log('[WorkerManager] Calling workerApi.initialize...');
    const result = await this.workerApi.initialize(appDefinition, moduleId);
    console.log('[WorkerManager] workerApi.initialize completed with result:', result);

    // Mark as ready
    this.isReady = true;
    this.lastPongTime = Date.now();

    if (this.onReady) {
      this.onReady(result);
    }

    // Start health check
    this.startHealthCheck();

    return result;
  }

  /**
   * Create a new worker instance with Comlink
   */
  async createWorker() {
    console.log('[WorkerManager] createWorker() called');

    // Terminate existing worker if any
    if (this.worker) {
      console.log('[WorkerManager] Terminating existing worker');
      this.terminateWorker();
    }

    // Reset state
    this.isReady = false;
    this.isTerminated = false;

    try {
      // Create worker using webpack 5 worker syntax
      console.log('[WorkerManager] Creating worker...');

      this.worker = new Worker(
        new URL('./compute.worker.js', import.meta.url),
        { name: 'ToolJetComputeWorker' }
      );
      console.log('[WorkerManager] Worker instance created:', this.worker);

      // Set up message handler for operations and debugging
      this.worker.onmessage = (event) => {
        console.log('[WorkerManager] Message from worker:', event.data);

        // Handle operations from worker
        if (event.data?.type === 'OPERATIONS') {
          console.log('[WorkerManager] Received OPERATIONS:', event.data.operations?.length);
          this.handleOperations(event.data.operations);
        }

        if (event.data?.type === 'WORKER_ERROR') {
          console.error('[WorkerManager] Worker initialization error:', event.data.error);
          console.error('[WorkerManager] Worker error stack:', event.data.stack);
        }
      };

      // Wrap with Comlink to get RPC proxy
      this.workerApi = Comlink.wrap(this.worker);
      console.log('[WorkerManager] Comlink proxy created:', this.workerApi);

      // Set up error handler
      this.worker.onerror = (error) => {
        console.error('[WorkerManager] Worker error event:', error);
        console.error('[WorkerManager] Error message:', error.message);
        console.error('[WorkerManager] Error filename:', error.filename);
        console.error('[WorkerManager] Error lineno:', error.lineno);
        console.error('[WorkerManager] Error colno:', error.colno);
        this.handleWorkerError(error);
      };
    } catch (error) {
      console.error('[WorkerManager] Failed to create worker:', error);
      throw error;
    }
  }

  /**
   * Terminate the worker
   */
  terminateWorker() {
    this.stopHealthCheck();

    if (this.workerApi) {
      this.workerApi[Comlink.releaseProxy]();
      this.workerApi = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.isReady = false;
    this.isTerminated = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATIONS HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle operations received from worker
   * @param {object[]} operations - Array of operations
   */
  handleOperations(operations) {
    console.log("[WorkerManager] Received operations from worker:", operations);
    if (this.uiStore && operations && operations.length > 0) {
      console.log("[WorkerManager] Applying", operations.length, "operations to uiStore");
      this.uiStore.getState().applyOperations(operations);
      console.log("[WorkerManager] Applied. viewModel.resolved:", this.uiStore.getState().viewModel.resolved);
    }
  }

  /**
   * Handle worker error
   * @param {ErrorEvent} error - Worker error event
   */
  handleWorkerError(error) {
    console.error('[WorkerManager] Worker error:', error);
    console.error('[WorkerManager] Full error details:', {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      error: error.error
    });

    if (this.onError) {
      this.onError({
        message: error.message || 'Worker error',
        recoverable: true,
      });
    }

    // Disable auto-recovery for debugging
    // this.attemptRecovery();
    console.error('[WorkerManager] Auto-recovery disabled for debugging. Check worker errors above.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RPC METHODS (Convenience wrappers)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set exposed value for a component
   */
  async setExposedValue(componentId, key, value, context = {}) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setExposedValue(componentId, key, value, context);
  }

  /**
   * Set multiple exposed values for a component
   */
  async setExposedValues(componentId, values, context = {}) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setExposedValues(componentId, values, context);
  }

  /**
   * Set a component property
   */
  async setProperty(componentId, propertyPath, value) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setProperty(componentId, propertyPath, value);
  }

  /**
   * Set a variable
   */
  async setVariable(name, value) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setVariable(name, value);
  }

  /**
   * Fire an event
   */
  async fireEvent(componentId, eventName, context = {}) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.fireEvent(componentId, eventName, context);
  }

  /**
   * Run a query
   */
  async runQuery(queryId, parameters = {}) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.runQuery(queryId, parameters);
  }

  /**
   * Send query result to worker
   */
  async sendQueryResult(queryId, data, error = null) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.handleQueryResult(queryId, data, error);
  }

  /**
   * Add a component
   */
  async addComponent(component) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.addComponent(component);
  }

  /**
   * Delete a component
   */
  async deleteComponent(componentId) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.deleteComponent(componentId);
  }

  /**
   * Move a component
   */
  async moveComponent(componentId, newParentId) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.moveComponent(componentId, newParentId);
  }

  /**
   * Set component layout
   */
  async setLayout(componentId, layout, layoutType) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setLayout(componentId, layout, layoutType);
  }

  /**
   * Update visible range (for virtualization)
   */
  async setVisibleRange(parentId, start, end) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setVisibleRange(parentId, start, end);
  }

  /**
   * Set custom resolvables (ListView data)
   */
  async setCustomResolvables(parentId, data, key = 'listItem') {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setCustomResolvables(parentId, data, key);
  }

  /**
   * Request full state sync
   */
  async requestFullSync() {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.requestFullSync();
  }

  /**
   * Get debug information from worker
   */
  async getDebugInfo() {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.getDebugInfo();
  }

  /**
   * Get resolved properties for a component
   */
  async getResolvedProperties(componentId) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.getResolvedProperties(componentId);
  }

  /**
   * Force re-resolve all components
   */
  async forceResolveAll() {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.forceResolveAll();
  }

  /**
   * Enable/disable debug mode in worker
   */
  async setDebugMode(enabled) {
    if (!this.isReady || !this.workerApi) return null;
    return this.workerApi.setDebugMode(enabled);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    this.stopHealthCheck();

    this.healthCheckInterval = setInterval(async () => {
      if (this.isReady && !this.isTerminated && this.workerApi) {
        try {
          // Check if last pong was too long ago
          if (this.lastPongTime && Date.now() - this.lastPongTime > this.config.healthCheckInterval * 3) {
            console.warn('[WorkerManager] Worker health check failed');
            this.attemptRecovery();
            return;
          }

          // Send ping
          const result = await this.workerApi.ping();
          if (result.pong) {
            this.lastPongTime = Date.now();
          }
        } catch (error) {
          console.warn('[WorkerManager] Health check error:', error);
          this.attemptRecovery();
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Attempt to recover the worker
   */
  async attemptRecovery() {
    console.log('[WorkerManager] Attempting worker recovery');

    // Get current exposed values from UI store for restoration
    const exposedValues = this.uiStore?.getState()?.viewModel?.exposedValues;

    try {
      // Create new worker
      await this.createWorker();

      // Set up callback
      await this.workerApi.setMainThreadCallback(
        Comlink.proxy((operations) => {
          this.handleOperations(operations);
        })
      );

      // Re-initialize
      await this.workerApi.initialize(this.appDefinition, this.moduleId);

      // Restore runtime state
      if (exposedValues) {
        await this.workerApi.restoreState(exposedValues);
      }

      this.isReady = true;
      this.lastPongTime = Date.now();

      // Restart health check
      this.startHealthCheck();

      if (this.onRecovery) {
        this.onRecovery({ success: true });
      }

      console.log('[WorkerManager] Worker recovery successful');
    } catch (error) {
      console.error('[WorkerManager] Worker recovery failed:', error);

      if (this.onRecovery) {
        this.onRecovery({ success: false, error });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Destroy the worker manager
   */
  destroy() {
    this.terminateWorker();
    this.uiStore = null;
    this.appDefinition = null;
    this.onReady = null;
    this.onError = null;
    this.onRecovery = null;
  }
}

export default WorkerManager;
