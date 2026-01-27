/**
 * useWorkerResolved Hook
 *
 * Provides resolved component properties from the worker architecture.
 * Components use this hook to get their resolved values (text, styles, etc.)
 * that have been computed in the worker thread.
 *
 * Usage:
 * ```jsx
 * const { resolved, isReady, error } = useWorkerResolved(componentId);
 *
 * // For ListView children with index:
 * const { resolved } = useWorkerResolved(componentId, { index: rowIndex });
 *
 * // Access resolved properties:
 * const text = resolved?.text ?? 'Default';
 * const backgroundColor = resolved?.backgroundColor ?? '#fff';
 * ```
 */

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import useUIStore from "../_stores/uiStore";
import { isWorkerArchitectureEnabled } from "../_helpers/featureFlags";

/**
 * Hook to get resolved properties for a component
 *
 * @param {string} componentId - Component ID
 * @param {object} options - Hook options
 * @param {number} [options.index] - Subcontainer index (for ListView children)
 * @returns {object} { resolved, isReady, error, isEnabled }
 */
export function useWorkerResolved(componentId, options = {}) {
  const { index } = options;
  const isEnabled = isWorkerArchitectureEnabled();

  // Subscribe to the resolved values for this component
  const { resolved, workerState } = useUIStore(
    useShallow((state) => {
      // Get resolved properties for this component
      let resolvedProps = state.viewModel.resolved[componentId];

      // If index is specified, get the indexed version
      if (index !== undefined && resolvedProps) {
        resolvedProps = resolvedProps[index];
      }

      return {
        resolved: resolvedProps,
        workerState: state.workerState,
      };
    })
  );

  // Memoize the return value
  return useMemo(
    () => ({
      resolved: resolved || {},
      isReady: workerState.isReady,
      isInitializing: workerState.isInitializing,
      error: workerState.error,
      isEnabled,
    }),
    [
      resolved,
      workerState.isReady,
      workerState.isInitializing,
      workerState.error,
      isEnabled,
    ]
  );
}

/**
 * Hook to get a specific resolved property for a component
 *
 * @param {string} componentId - Component ID
 * @param {string} propertyKey - Property key to get
 * @param {*} defaultValue - Default value if not resolved
 * @param {object} options - Hook options
 * @param {number} [options.index] - Subcontainer index
 * @returns {*} Resolved property value or default
 */
export function useWorkerResolvedProperty(
  componentId,
  propertyKey,
  defaultValue = undefined,
  options = {}
) {
  const { resolved, isReady, isEnabled } = useWorkerResolved(
    componentId,
    options
  );

  return useMemo(() => {
    if (!isEnabled || !isReady) {
      return defaultValue;
    }
    return resolved[propertyKey] ?? defaultValue;
  }, [resolved, propertyKey, defaultValue, isEnabled, isReady]);
}

/**
 * Hook to get multiple resolved properties for a component
 *
 * @param {string} componentId - Component ID
 * @param {string[]} propertyKeys - Array of property keys to get
 * @param {object} defaults - Default values for each key
 * @param {object} options - Hook options
 * @returns {object} Object with resolved property values
 */
export function useWorkerResolvedProperties(
  componentId,
  propertyKeys,
  defaults = {},
  options = {}
) {
  const { resolved, isReady, isEnabled } = useWorkerResolved(
    componentId,
    options
  );

  return useMemo(() => {
    const result = {};
    for (const key of propertyKeys) {
      if (!isEnabled || !isReady) {
        result[key] = defaults[key];
      } else {
        result[key] = resolved[key] ?? defaults[key];
      }
    }
    return result;
  }, [resolved, propertyKeys, defaults, isEnabled, isReady]);
}

/**
 * Hook to get all resolved components (for debugging)
 *
 * @returns {object} All resolved components
 */
export function useAllWorkerResolved() {
  const { resolved, workerState } = useUIStore(
    useShallow((state) => ({
      resolved: state.viewModel.resolved,
      workerState: state.workerState,
    }))
  );

  return useMemo(
    () => ({
      resolved,
      isReady: workerState.isReady,
      error: workerState.error,
      isEnabled: isWorkerArchitectureEnabled(),
    }),
    [resolved, workerState.isReady, workerState.error]
  );
}

/**
 * Hook to get exposed values for a component
 * This is for values that components set (e.g., input value)
 *
 * @param {string} componentId - Component ID
 * @param {object} options - Hook options
 * @param {number} [options.index] - Subcontainer index
 * @returns {object} Exposed values for the component
 */
export function useWorkerExposedValue(componentId, options = {}) {
  const { index } = options;

  const exposedValue = useUIStore(
    useShallow((state) => {
      let values = state.viewModel.exposedValues.components?.[componentId];
      if (index !== undefined && values) {
        values = values[index];
      }
      return values;
    })
  );

  return exposedValue || {};
}

/**
 * Hook to get a query's state
 *
 * @param {string} queryId - Query ID
 * @returns {object} Query state { data, isLoading, error }
 */
export function useWorkerQueryState(queryId) {
  const queryState = useUIStore(
    useShallow((state) => state.viewModel.queryStates[queryId])
  );

  return useMemo(
    () =>
      queryState || {
        data: null,
        isLoading: false,
        isFetching: false,
        error: null,
      },
    [queryState]
  );
}

/**
 * Hook to get a variable's value
 *
 * @param {string} variableName - Variable name
 * @returns {*} Variable value
 */
export function useWorkerVariable(variableName) {
  return useUIStore(
    useShallow(
      (state) => state.viewModel.exposedValues.variables?.[variableName]
    )
  );
}

/**
 * Hook to check if worker resolution is ready
 *
 * @returns {object} { isReady, isInitializing, error, isEnabled }
 */
export function useWorkerReady() {
  const workerState = useUIStore(useShallow((state) => state.workerState));

  return useMemo(
    () => ({
      isReady: workerState.isReady,
      isInitializing: workerState.isInitializing,
      error: workerState.error,
      isEnabled: isWorkerArchitectureEnabled(),
    }),
    [workerState.isReady, workerState.isInitializing, workerState.error]
  );
}

export default useWorkerResolved;
