/**
 * WorkerBridge
 *
 * This component bridges the worker architecture with the existing ToolJet stores.
 * When enabled, it:
 * 1. Initializes the worker with the app definition
 * 2. Syncs resolved values from worker to the main Zustand store
 * 3. Intercepts exposed value changes and routes them through the worker
 *
 * Usage:
 * ```jsx
 * <WorkerBridge appDefinition={appDef} moduleId="canvas">
 *   <YourAppContent />
 * </WorkerBridge>
 * ```
 */

import React, { useEffect, useRef, useCallback } from "react";
import { useWorkerManager } from "../../_hooks/useWorkerManager";
import useStore from "../../_stores/store";
import useUIStore from "../../_stores/uiStore";
import {
  isWorkerArchitectureEnabled,
  isWorkerDebugEnabled,
} from "../../_helpers/featureFlags";
import { shallow } from "zustand/shallow";

/**
 * WorkerBridge component
 *
 * @param {object} props
 * @param {object} props.appDefinition - App definition to initialize worker with
 * @param {string} props.moduleId - Module ID (default: 'canvas')
 * @param {React.ReactNode} props.children - Child components
 */
export function WorkerBridge({ appDefinition, moduleId = "canvas", children }) {
  const isEnabled = isWorkerArchitectureEnabled();
  const debug = isWorkerDebugEnabled();
  const initializedRef = useRef(false);
  const prevComponentsRef = useRef({});

  // Worker manager
  const { workerManager, isReady, initialize } = useWorkerManager();

  // Subscribe to current page components for live sync
  const currentComponents = useStore(
    (state) => {
      if (!isEnabled) return null;
      const module = state.modules?.[moduleId];
      if (!module?.pages) return null;
      const currentPageId = module.currentPageId;
      const currentPage = module.pages.find((p) => p.id === currentPageId);
      return currentPage?.components || {};
    },
    shallow
  );

  // Main store actions for syncing
  const setResolvedComponentByProperty = useStore(
    (state) => state.setResolvedComponentByProperty,
    shallow
  );
  const setResolvedComponent = useStore(
    (state) => state.setResolvedComponent,
    shallow
  );

  // Subscribe to worker operations from uiStore
  const viewModelResolved = useUIStore(
    (state) => state.viewModel.resolved,
    shallow
  );

  // Helper to sync resolved values to main store
  const syncResolvedToMainStore = useCallback(
    (componentId, resolved, index, modId) => {
      if (!resolved) return;

      // The worker returns resolved values categorized by type (properties, styles, etc.)
      // We need to sync each category to the main store

      // Known property categories
      const propertyCategories = ["properties", "styles", "validation", "others", "general", "generalStyles"];

      for (const category of propertyCategories) {
        if (resolved[category] && typeof resolved[category] === "object") {
          for (const [prop, value] of Object.entries(resolved[category])) {
            setResolvedComponentByProperty(
              componentId,
              category,
              prop,
              value,
              index,
              modId
            );
          }
        }
      }

      // Also handle flat resolved values for backwards compatibility
      // (in case worker sends flat structure)
      const styleKeys = [
        "backgroundColor",
        "textColor",
        "borderColor",
        "borderRadius",
        "boxShadow",
        "visibility",
        "disabledState",
        "loadingState",
      ];

      const flatProperties = {};
      const flatStyles = {};

      for (const [key, value] of Object.entries(resolved)) {
        // Skip category objects
        if (propertyCategories.includes(key)) continue;

        if (styleKeys.includes(key)) {
          flatStyles[key] = value;
        } else if (typeof value !== "object" || value === null) {
          flatProperties[key] = value;
        }
      }

      // Update flat properties
      for (const [prop, value] of Object.entries(flatProperties)) {
        setResolvedComponentByProperty(
          componentId,
          "properties",
          prop,
          value,
          index,
          modId
        );
      }

      // Update flat styles
      for (const [prop, value] of Object.entries(flatStyles)) {
        setResolvedComponentByProperty(
          componentId,
          "styles",
          prop,
          value,
          index,
          modId
        );
      }
    },
    [setResolvedComponentByProperty]
  );

  // Sync worker resolved values to main store
  useEffect(() => {
    console.log("[WorkerBridge] Sync effect triggered - isEnabled:", isEnabled, "isReady:", isReady, "viewModelResolved:", viewModelResolved);

    if (!isEnabled || !isReady) {
      console.log("[WorkerBridge] Skipping sync - not enabled or not ready");
      return;
    }

    console.log("[WorkerBridge] Syncing resolved values to main store", viewModelResolved);

    // Sync each component's resolved values to the main store
    for (const [componentId, resolved] of Object.entries(viewModelResolved)) {
      if (resolved && typeof resolved === "object") {
        // Check if this is indexed (ListView) or regular
        const hasNumericKeys = Object.keys(resolved).some((k) => !isNaN(k));

        if (hasNumericKeys) {
          // Indexed resolved values (ListView children)
          for (const [index, indexedResolved] of Object.entries(resolved)) {
            syncResolvedToMainStore(
              componentId,
              indexedResolved,
              parseInt(index),
              moduleId
            );
          }
        } else {
          // Regular resolved values
          syncResolvedToMainStore(componentId, resolved, null, moduleId);
        }
      }
    }
  }, [viewModelResolved, isEnabled, isReady, moduleId, debug, syncResolvedToMainStore]);

  // Initialize worker when app definition is available
  useEffect(() => {
    console.log("[WorkerBridge] Init effect - isEnabled:", isEnabled, "appDefinition:", !!appDefinition, "workerManager:", !!workerManager, "initialized:", initializedRef.current);

    if (
      !isEnabled ||
      !appDefinition ||
      !workerManager ||
      initializedRef.current
    ) {
      return;
    }

    const initWorker = async () => {
      try {
        console.log("[WorkerBridge] Initializing worker with app definition:", appDefinition);

        // Convert app definition to worker format
        const workerAppDef = convertToWorkerFormat(appDefinition, moduleId);
        console.log("[WorkerBridge] Converted to worker format:", workerAppDef);

        const result = await initialize(workerAppDef, moduleId);
        initializedRef.current = true;

        console.log("[WorkerBridge] Worker initialized successfully, result:", result);
      } catch (error) {
        console.error("[WorkerBridge] Failed to initialize worker:", error);
      }
    };

    initWorker();
  }, [isEnabled, appDefinition, workerManager, moduleId, initialize, debug]);

  // Sync component additions/deletions to worker
  useEffect(() => {
    if (!isEnabled || !isReady || !workerManager || !currentComponents || !initializedRef.current) {
      // If not yet initialized, just store current components as baseline
      if (currentComponents && Object.keys(currentComponents).length > 0) {
        prevComponentsRef.current = { ...currentComponents };
      }
      return;
    }

    const prevComponents = prevComponentsRef.current;
    const currentIds = new Set(Object.keys(currentComponents));
    const prevIds = new Set(Object.keys(prevComponents));

    // Find new components (added after initialization)
    const addedIds = [...currentIds].filter((id) => !prevIds.has(id));

    // Find removed components (deleted)
    const removedIds = [...prevIds].filter((id) => !currentIds.has(id));

    // Add new components to worker
    for (const id of addedIds) {
      const componentData = currentComponents[id];
      if (componentData?.component) {
        const workerComponent = {
          id,
          name: componentData.component.name,
          componentType: componentData.component.component,
          parent: componentData.component.parent || "canvas",
          properties: componentData.component.definition?.properties || {},
          styles: componentData.component.definition?.styles || {},
          general: componentData.component.definition?.general || {},
          generalStyles: componentData.component.definition?.generalStyles || {},
          layouts: componentData.layouts || {},
        };

        if (debug) {
          console.log("[WorkerBridge] Adding component to worker:", id);
        }

        workerManager.addComponent(workerComponent).catch((error) => {
          console.error("[WorkerBridge] Failed to add component:", error);
        });
      }
    }

    // Remove deleted components from worker
    for (const id of removedIds) {
      if (debug) {
        console.log("[WorkerBridge] Removing component from worker:", id);
      }

      workerManager.deleteComponent(id).catch((error) => {
        console.error("[WorkerBridge] Failed to delete component:", error);
      });
    }

    // Update prev components ref
    prevComponentsRef.current = { ...currentComponents };
  }, [currentComponents, isEnabled, isReady, workerManager, debug]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      initializedRef.current = false;
      prevComponentsRef.current = {};
    };
  }, []);

  return <>{children}</>;
}

/**
 * Convert ToolJet app definition to worker format
 * The worker expects a slightly different structure
 */
function convertToWorkerFormat(appDefinition, moduleId) {
  const components = [];
  const queries = [];
  const variables = {};
  const events = {};

  // Extract components from the app definition
  if (appDefinition?.pages) {
    // Multi-page app structure
    for (const page of Object.values(appDefinition.pages)) {
      if (page.components) {
        for (const [id, componentData] of Object.entries(page.components)) {
          components.push({
            id,
            name: componentData.component?.name,
            componentType: componentData.component?.component,
            parent: componentData.component?.parent || "canvas",
            properties: componentData.component?.definition?.properties || {},
            styles: componentData.component?.definition?.styles || {},
            general: componentData.component?.definition?.general || {},
            generalStyles:
              componentData.component?.definition?.generalStyles || {},
            layouts: componentData.layouts || {},
          });
        }
      }
    }
  } else if (appDefinition?.components) {
    // Direct components structure
    for (const [id, componentData] of Object.entries(
      appDefinition.components
    )) {
      if (componentData?.component) {
        components.push({
          id,
          name: componentData.component.name,
          componentType: componentData.component.component,
          parent: componentData.component.parent || "canvas",
          properties: componentData.component.definition?.properties || {},
          styles: componentData.component.definition?.styles || {},
          general: componentData.component.definition?.general || {},
          generalStyles:
            componentData.component.definition?.generalStyles || {},
          layouts: componentData.layouts || {},
        });
      }
    }
  }

  // Extract queries - can be array or object
  if (appDefinition?.queries) {
    if (Array.isArray(appDefinition.queries)) {
      // Array format from dataQuery store
      for (const query of appDefinition.queries) {
        queries.push({
          id: query.id,
          name: query.name,
          kind: query.kind,
          options: query.options,
        });
      }
    } else {
      // Object format
      for (const [id, query] of Object.entries(appDefinition.queries)) {
        queries.push({
          id,
          name: query.name,
          kind: query.kind,
          options: query.options,
        });
      }
    }
  }

  // Extract variables
  if (appDefinition?.variables) {
    Object.assign(variables, appDefinition.variables);
  }

  return {
    components,
    queries,
    variables,
    events,
    globals: appDefinition?.globals || {},
    page: appDefinition?.page || {},
  };
}

/**
 * Hook to use worker for setting exposed values
 * Falls back to main store when worker is not enabled
 */
export function useWorkerExposedValueSetter() {
  const isEnabled = isWorkerArchitectureEnabled();
  const { workerManager, isReady } = useWorkerManager();

  // Main store fallbacks
  const mainStoreSetExposedValue = useStore(
    (state) => state.setExposedValue,
    shallow
  );

  const setExposedValue = useCallback(
    async (componentId, key, value, moduleId = "canvas") => {
      console.log('[useWorkerExposedValueSetter] setExposedValue called:', {
        componentId, key, value, moduleId,
        isEnabled, isReady, hasWorkerManager: !!workerManager
      });

      if (isEnabled && isReady && workerManager) {
        // Route through worker
        console.log('[useWorkerExposedValueSetter] Routing through worker');
        await workerManager.setExposedValue(componentId, key, value, {});
      } else {
        // Use main store directly
        console.log('[useWorkerExposedValueSetter] Using main store directly');
        mainStoreSetExposedValue(componentId, key, value, moduleId);
      }
    },
    [isEnabled, isReady, workerManager, mainStoreSetExposedValue]
  );

  const setVariable = useCallback(
    async (name, value, moduleId = "canvas") => {
      if (isEnabled && isReady && workerManager) {
        await workerManager.setVariable(name, value);
      }
      // Always update main store too for now
      // This ensures compatibility during transition
    },
    [isEnabled, isReady, workerManager]
  );

  return {
    setExposedValue,
    setVariable,
    isWorkerEnabled: isEnabled && isReady,
  };
}

export default WorkerBridge;
