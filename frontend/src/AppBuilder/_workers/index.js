/**
 * Worker Architecture Exports
 *
 * This module provides the public API for the Comlink-based worker architecture.
 */

// Protocol types (operations for state sync)
export { OperationTypes, ActionTypes, createOperation } from "./protocol";

// Worker Manager (main thread)
export { default as WorkerManager } from "./WorkerManager";

// Utilities
export { OperationBatcher } from "./utils/operationBatcher";

// Worker store factory (for use inside worker)
export { createWorkerStore } from "./workerStore";

// Compute Engine (for use inside worker)
export { default as ComputeEngine, computeEngine } from "./ComputeEngine";

// Resolution Engine (Phase 1)
export { ResolutionEngine, resolutionEngine } from "./engines/ResolutionEngine";

// Dependency Graph (Phase 1)
export {
  DependencyGraph,
  ComponentDependencyTracker,
  dependencyTracker,
} from "./engines/DependencyGraph";

// Event Engine (Phase 3)
export {
  EventEngine,
  eventEngine,
  EventTypes,
  ActionIds,
} from "./engines/EventEngine";

// RunJS Engine (Phase 3)
export { RunJSEngine, runJSEngine } from "./engines/RunJSEngine";

// Validation Engine (Phase 3)
export {
  ValidationEngine,
  validationEngine,
  ValidationRuleTypes,
} from "./engines/ValidationEngine";

// Virtualization Manager (Phase 4)
export {
  VirtualizationManager,
  virtualizationManager,
} from "./engines/VirtualizationManager";

// Demo component
export { WorkerResolutionDemo } from "./demo/WorkerResolutionDemo";

// Integration (Phase 5)
export {
  WorkerBridge,
  useWorkerExposedValueSetter,
} from "./integration/WorkerBridge";
export { WorkerIntegrationTest } from "./integration/WorkerIntegrationTest";
