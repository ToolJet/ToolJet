/**
 * useWorkerManager Hook
 *
 * Provides access to the WorkerManager singleton and handles initialization.
 * Uses Comlink for RPC-style communication with the worker.
 *
 * Usage:
 * ```jsx
 * const { workerManager, isReady, error } = useWorkerManager();
 *
 * // Call methods directly (RPC style)
 * await workerManager.setExposedValue('input1', 'value', 'Hello');
 * await workerManager.fireEvent('button1', 'onClick');
 * ```
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import WorkerManager from '../_workers/WorkerManager';
import useUIStore from '../_stores/uiStore';
import { isWorkerArchitectureEnabled, isWorkerDebugEnabled } from '../_helpers/featureFlags';

// Singleton instance
let workerManagerInstance = null;

/**
 * Get the WorkerManager singleton
 * @returns {WorkerManager|null}
 */
export function getWorkerManager() {
  return workerManagerInstance;
}

/**
 * Create or get the WorkerManager singleton
 * @param {object} options - WorkerManager options
 * @returns {WorkerManager}
 */
function getOrCreateWorkerManager(options = {}) {
  if (!workerManagerInstance) {
    workerManagerInstance = new WorkerManager(options);
  }
  return workerManagerInstance;
}

/**
 * Destroy the WorkerManager singleton
 */
export function destroyWorkerManager() {
  if (workerManagerInstance) {
    workerManagerInstance.destroy();
    workerManagerInstance = null;
  }
}

/**
 * Hook to access and manage the WorkerManager
 *
 * @param {object} options - Hook options
 * @param {boolean} options.autoInitialize - Whether to auto-initialize (default: false)
 * @param {object} options.appDefinition - App definition for initialization
 * @param {string} options.moduleId - Module ID (default: 'canvas')
 * @returns {object} { workerManager, isReady, isInitializing, error, initialize }
 */
export function useWorkerManager(options = {}) {
  const { autoInitialize = false, appDefinition = null, moduleId = 'canvas' } = options;

  const initializingRef = useRef(false);
  // Use state instead of ref so changes trigger re-renders
  const [workerManager, setWorkerManager] = useState(null);

  // Get worker state from UI store
  const { workerState, setWorkerState } = useUIStore(
    useShallow((state) => ({
      workerState: state.workerState,
      setWorkerState: state.setWorkerState,
    }))
  );

  // Get the UI store for the worker manager
  const uiStore = useUIStore;

  // Create or get the worker manager
  useEffect(() => {
    console.log('[useWorkerManager] Effect running, isWorkerArchitectureEnabled:', isWorkerArchitectureEnabled());

    if (!isWorkerArchitectureEnabled()) {
      console.log('[useWorkerManager] Worker architecture not enabled, skipping');
      return;
    }

    const debug = isWorkerDebugEnabled();

    const manager = getOrCreateWorkerManager({
      onReady: (result) => {
        console.log('[useWorkerManager] Worker ready:', result);
        setWorkerState({ isReady: true, isInitializing: false, error: null });
      },
      onError: (error) => {
        console.error('[useWorkerManager] Worker error:', error);
        setWorkerState({ error: error.message });
      },
      onRecovery: (result) => {
        console.log('[useWorkerManager] Worker recovery:', result);
        if (!result.success) {
          setWorkerState({ error: 'Worker recovery failed' });
        }
      },
    });

    console.log('[useWorkerManager] WorkerManager created/retrieved:', manager);

    // Connect the UI store
    manager.setStore(uiStore);
    setWorkerManager(manager);

    return () => {
      // Don't destroy on unmount - keep the singleton alive
    };
  }, [setWorkerState, uiStore]);

  // Initialize function
  const initialize = useCallback(
    async (appDef, modId = 'canvas') => {
      console.log('[useWorkerManager] initialize() called with appDef:', appDef, 'modId:', modId);

      if (!isWorkerArchitectureEnabled()) {
        console.warn('[useWorkerManager] Worker architecture is not enabled');
        return null;
      }

      if (initializingRef.current) {
        console.warn('[useWorkerManager] Already initializing');
        return null;
      }

      console.log('[useWorkerManager] WorkerManager state:', workerManager);

      if (!workerManager) {
        console.error('[useWorkerManager] WorkerManager not created');
        return null;
      }

      try {
        initializingRef.current = true;
        setWorkerState({ isInitializing: true, error: null });

        console.log('[useWorkerManager] Calling manager.initialize...');
        const result = await workerManager.initialize(appDef, modId);
        console.log('[useWorkerManager] manager.initialize completed with result:', result);

        initializingRef.current = false;
        return result;
      } catch (error) {
        console.error('[useWorkerManager] Initialization failed:', error);
        setWorkerState({ isInitializing: false, error: error.message });
        initializingRef.current = false;
        throw error;
      }
    },
    [setWorkerState, workerManager]
  );

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && appDefinition && isWorkerArchitectureEnabled()) {
      initialize(appDefinition, moduleId);
    }
  }, [autoInitialize, appDefinition, moduleId, initialize]);

  // Memoized return value
  return useMemo(
    () => ({
      workerManager,
      isReady: workerState.isReady,
      isInitializing: workerState.isInitializing,
      error: workerState.error,
      initialize,
      isEnabled: isWorkerArchitectureEnabled(),
    }),
    [workerManager, workerState.isReady, workerState.isInitializing, workerState.error, initialize]
  );
}

/**
 * Hook to get convenience methods for common worker operations
 * These methods automatically use the worker if enabled
 *
 * @returns {object} Worker operation methods
 */
export function useWorkerOperations() {
  const { workerManager, isReady, isEnabled } = useWorkerManager();

  const setExposedValue = useCallback(
    async (componentId, key, value, context = {}) => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.setExposedValue(componentId, key, value, context);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  const setExposedValues = useCallback(
    async (componentId, values, context = {}) => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.setExposedValues(componentId, values, context);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  const fireEvent = useCallback(
    async (componentId, eventName, context = {}) => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.fireEvent(componentId, eventName, context);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  const runQuery = useCallback(
    async (queryId, parameters = {}) => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.runQuery(queryId, parameters);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  const setVariable = useCallback(
    async (name, value) => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.setVariable(name, value);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  const setCustomResolvables = useCallback(
    async (parentId, data, key = 'listItem') => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.setCustomResolvables(parentId, data, key);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  const setVisibleRange = useCallback(
    async (parentId, start, end) => {
      if (isEnabled && isReady && workerManager) {
        return workerManager.setVisibleRange(parentId, start, end);
      }
      return null;
    },
    [workerManager, isReady, isEnabled]
  );

  return useMemo(
    () => ({
      setExposedValue,
      setExposedValues,
      fireEvent,
      runQuery,
      setVariable,
      setCustomResolvables,
      setVisibleRange,
      isEnabled,
      isReady,
    }),
    [
      setExposedValue,
      setExposedValues,
      fireEvent,
      runQuery,
      setVariable,
      setCustomResolvables,
      setVisibleRange,
      isEnabled,
      isReady,
    ]
  );
}

export default useWorkerManager;
