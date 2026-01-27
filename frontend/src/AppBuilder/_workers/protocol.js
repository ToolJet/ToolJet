/**
 * Communication Protocol for Worker Architecture
 *
 * With Comlink RPC pattern, we no longer need explicit command types.
 * Commands are now direct async method calls on the worker API.
 *
 * This file defines:
 * - Operation types for state sync (worker → main thread)
 * - Callback types for actions that need main thread execution
 */

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATION TYPES (Worker → Main Thread via callback)
// These are batched state updates sent from worker to main thread
// ═══════════════════════════════════════════════════════════════════════════════

export const OperationTypes = {
  /**
   * Set a single exposed value
   * Payload: { path, value }
   * Example: { path: 'components.input1.value', value: 'Hello' }
   */
  SET_EXPOSED: "SET_EXPOSED",

  /**
   * Set full exposed values (for initial sync or recovery)
   * Payload: { exposedValues }
   */
  SET_EXPOSED_FULL: "SET_EXPOSED_FULL",

  /**
   * Set resolved component values
   * Payload: { componentId, resolved, index? }
   */
  SET_RESOLVED: "SET_RESOLVED",

  /**
   * Delete resolved component (on component deletion)
   * Payload: { componentId }
   */
  DELETE_RESOLVED: "DELETE_RESOLVED",

  /**
   * Set container children
   * Payload: { containerId, childIds }
   */
  SET_CHILDREN: "SET_CHILDREN",

  /**
   * Set query state
   * Payload: { queryId, state: { isLoading, error, data } }
   */
  SET_QUERY_STATE: "SET_QUERY_STATE",

  /**
   * Set validation errors
   * Payload: { componentId, errors }
   */
  SET_VALIDATION: "SET_VALIDATION",
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION TYPES (Worker requests Main Thread to execute)
// These require DOM/browser APIs not available in workers
// ═══════════════════════════════════════════════════════════════════════════════

export const ActionTypes = {
  // Alert & Modal Actions
  SHOW_ALERT: "showAlert",
  SHOW_MODAL: "showModal",
  CLOSE_MODAL: "closeModal",

  // Navigation Actions
  NAVIGATE: "navigate",
  SWITCH_PAGE: "switchPage",
  OPEN_URL: "openUrl",
  GO_BACK: "goBack",
  GO_FORWARD: "goForward",

  // Clipboard & Storage Actions
  COPY_TO_CLIPBOARD: "copyToClipboard",
  SET_LOCAL_STORAGE: "setLocalStorage",

  // File Actions
  DOWNLOAD_FILE: "downloadFile",
  GENERATE_FILE: "generateFile",

  // Auth Actions
  LOGOUT: "logout",

  // Query Actions (Phase 3)
  RUN_QUERY: "runQuery",

  // Variable Actions (Phase 3)
  SET_VARIABLE: "setVariable",
  UNSET_VARIABLE: "unsetVariable",

  // Component Control Actions (Phase 3)
  CONTROL_COMPONENT: "controlComponent",
  SET_COMPONENT_VALUE: "setComponentValue",
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create an operation for state sync
 * @param {string} type - Operation type from OperationTypes
 * @param {object} payload - Operation payload
 * @returns {object} Operation object
 */
export function createOperation(type, payload) {
  return {
    type,
    ...payload,
  };
}
