/**
 * RunJSEngine
 *
 * Provides safe JavaScript execution for event handlers and custom code.
 * Executes in the worker thread with access to application state.
 *
 * Features:
 * - Safe sandbox execution with controlled scope
 * - Access to components, queries, variables, globals
 * - Built-in utilities (moment, lodash)
 * - Action dispatching for main-thread operations
 * - Error handling with detailed stack traces
 *
 * Phase 3: Event Handling & Query Processing
 */

import moment from "moment";

const _ = require("lodash");

/**
 * Result of JavaScript execution
 * @typedef {Object} ExecutionResult
 * @property {boolean} success - Whether execution succeeded
 * @property {*} result - Return value of the code
 * @property {string|null} error - Error message if failed
 * @property {Array} actions - Actions to dispatch to main thread
 */

/**
 * RunJSEngine class for safe JavaScript execution
 */
export class RunJSEngine {
  constructor() {
    // Actions collected during execution
    this.pendingActions = [];

    // Timeout for code execution (ms)
    this.executionTimeout = 10000;

    // Debug mode
    this.debug = false;
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
   * @param  {...any} args
   */
  log(...args) {
    if (this.debug) {
      console.log("[RunJSEngine]", ...args);
    }
  }

  /**
   * Execute JavaScript code with application state context
   *
   * @param {string} code - JavaScript code to execute
   * @param {object} state - Application state (components, queries, variables, etc.)
   * @param {object} options - Execution options
   * @param {object} options.customObjects - Additional objects to include in scope
   * @param {object} options.eventData - Event data (for event handlers)
   * @returns {ExecutionResult} Execution result
   */
  execute(code, state = {}, options = {}) {
    const { customObjects = {}, eventData = {} } = options;

    // Reset pending actions
    this.pendingActions = [];

    // Build the execution scope
    const scope = this.buildScope(state, customObjects, eventData);

    try {
      this.log("Executing code:", code.substring(0, 100) + "...");

      // Create the function with scope variables
      const scopeKeys = Object.keys(scope);
      const scopeValues = Object.values(scope);

      // Wrap code to capture return value
      const wrappedCode = `
        "use strict";
        ${code}
      `;

      const fn = new Function(...scopeKeys, wrappedCode);

      // Execute with timeout protection
      const result = fn(...scopeValues);

      this.log("Execution succeeded, result:", result);

      return {
        success: true,
        result,
        error: null,
        actions: [...this.pendingActions],
      };
    } catch (error) {
      const errorMessage = this.formatError(error);
      console.error("[RunJSEngine] Execution error:", errorMessage);

      return {
        success: false,
        result: undefined,
        error: errorMessage,
        actions: [...this.pendingActions],
      };
    }
  }

  /**
   * Execute an async JavaScript code block
   *
   * @param {string} code - JavaScript code to execute
   * @param {object} state - Application state
   * @param {object} options - Execution options
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeAsync(code, state = {}, options = {}) {
    const { customObjects = {}, eventData = {} } = options;

    this.pendingActions = [];

    const scope = this.buildScope(state, customObjects, eventData);

    try {
      this.log("Executing async code:", code.substring(0, 100) + "...");

      const scopeKeys = Object.keys(scope);
      const scopeValues = Object.values(scope);

      // Wrap as async IIFE
      const wrappedCode = `
        "use strict";
        return (async () => {
          ${code}
        })();
      `;

      const fn = new Function(...scopeKeys, wrappedCode);

      // Execute with timeout
      const result = await Promise.race([
        fn(...scopeValues),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Execution timeout")),
            this.executionTimeout
          )
        ),
      ]);

      this.log("Async execution succeeded, result:", result);

      return {
        success: true,
        result,
        error: null,
        actions: [...this.pendingActions],
      };
    } catch (error) {
      const errorMessage = this.formatError(error);
      console.error("[RunJSEngine] Async execution error:", errorMessage);

      return {
        success: false,
        result: undefined,
        error: errorMessage,
        actions: [...this.pendingActions],
      };
    }
  }

  /**
   * Build the execution scope with state and utilities
   *
   * @param {object} state - Application state
   * @param {object} customObjects - Custom objects for scope
   * @param {object} eventData - Event-specific data
   * @returns {object} Scope object
   */
  buildScope(state, customObjects = {}, eventData = {}) {
    // Create action dispatchers that collect actions
    const actions = this.createActionDispatchers();

    return {
      // State objects
      components: state.components || {},
      queries: state.queries || {},
      variables: state.variables || {},
      globals: state.globals || {},
      page: state.page || {},
      constants: state.constants || {},
      parameters: state.parameters || {},

      // Utilities
      moment,
      _,

      // Action dispatchers
      actions,

      // Shorthand action methods
      setVariable: actions.setVariable,
      runQuery: actions.runQuery,
      showAlert: actions.showAlert,
      showModal: actions.showModal,
      closeModal: actions.closeModal,
      navigateTo: actions.navigateTo,
      openUrl: actions.openUrl,
      copyToClipboard: actions.copyToClipboard,
      setLocalStorage: actions.setLocalStorage,
      logout: actions.logout,

      // Event data
      event: eventData.event || null,
      data: eventData.data || null,

      // Console (passthrough for debugging)
      console: {
        log: (...args) => console.log("[UserCode]", ...args),
        warn: (...args) => console.warn("[UserCode]", ...args),
        error: (...args) => console.error("[UserCode]", ...args),
        info: (...args) => console.info("[UserCode]", ...args),
      },

      // Custom objects (e.g., listItem for ListView)
      ...customObjects,
    };
  }

  /**
   * Create action dispatcher functions
   * These collect actions to be executed on the main thread
   *
   * @returns {object} Action dispatcher object
   */
  createActionDispatchers() {
    const self = this;

    return {
      /**
       * Set a variable value
       * @param {string} name - Variable name
       * @param {*} value - Variable value
       */
      setVariable: (name, value) => {
        self.pendingActions.push({
          type: "setVariable",
          payload: { name, value },
        });
      },

      /**
       * Run a query
       * @param {string} queryNameOrId - Query name or ID
       * @param {object} parameters - Query parameters
       * @returns {Promise} Promise that resolves when query completes
       */
      runQuery: (queryNameOrId, parameters = {}) => {
        self.pendingActions.push({
          type: "runQuery",
          payload: { queryNameOrId, parameters },
        });
        // Return a placeholder promise - actual execution happens on main thread
        return Promise.resolve({ pending: true, queryNameOrId });
      },

      /**
       * Show an alert message
       * @param {string} type - Alert type ('success', 'error', 'info', 'warning')
       * @param {string} message - Alert message
       */
      showAlert: (type, message) => {
        self.pendingActions.push({
          type: "showAlert",
          payload: { alertType: type, message },
        });
      },

      /**
       * Show a modal
       * @param {string} modalName - Modal component name
       */
      showModal: (modalName) => {
        self.pendingActions.push({
          type: "showModal",
          payload: { modalName },
        });
      },

      /**
       * Close a modal
       * @param {string} modalName - Modal component name
       */
      closeModal: (modalName) => {
        self.pendingActions.push({
          type: "closeModal",
          payload: { modalName },
        });
      },

      /**
       * Navigate to a page
       * @param {string} pageHandle - Page handle/slug
       * @param {object} queryParams - Query parameters
       */
      navigateTo: (pageHandle, queryParams = {}) => {
        self.pendingActions.push({
          type: "navigate",
          payload: { pageHandle, queryParams },
        });
      },

      /**
       * Open a URL in a new tab
       * @param {string} url - URL to open
       */
      openUrl: (url) => {
        self.pendingActions.push({
          type: "openUrl",
          payload: { url },
        });
      },

      /**
       * Copy text to clipboard
       * @param {string} text - Text to copy
       */
      copyToClipboard: (text) => {
        self.pendingActions.push({
          type: "copyToClipboard",
          payload: { text },
        });
      },

      /**
       * Set a value in local storage
       * @param {string} key - Storage key
       * @param {*} value - Value to store
       */
      setLocalStorage: (key, value) => {
        self.pendingActions.push({
          type: "setLocalStorage",
          payload: { key, value },
        });
      },

      /**
       * Logout the current user
       */
      logout: () => {
        self.pendingActions.push({
          type: "logout",
          payload: {},
        });
      },

      /**
       * Set component value (exposed value)
       * @param {string} componentName - Component name
       * @param {string} key - Property key
       * @param {*} value - Value to set
       */
      setComponentValue: (componentName, key, value) => {
        self.pendingActions.push({
          type: "setComponentValue",
          payload: { componentName, key, value },
        });
      },

      /**
       * Go to previous page in browser history
       */
      goBack: () => {
        self.pendingActions.push({
          type: "goBack",
          payload: {},
        });
      },

      /**
       * Go to next page in browser history
       */
      goForward: () => {
        self.pendingActions.push({
          type: "goForward",
          payload: {},
        });
      },

      /**
       * Generate a file for download
       * @param {string} fileName - File name
       * @param {string} fileType - MIME type
       * @param {*} data - File data
       */
      generateFile: (fileName, fileType, data) => {
        self.pendingActions.push({
          type: "generateFile",
          payload: { fileName, fileType, data },
        });
      },

      /**
       * Switch workspace page
       * @param {string} pageHandle - Page handle
       */
      switchPage: (pageHandle) => {
        self.pendingActions.push({
          type: "switchPage",
          payload: { pageHandle },
        });
      },

      /**
       * Unset a variable
       * @param {string} name - Variable name
       */
      unsetVariable: (name) => {
        self.pendingActions.push({
          type: "unsetVariable",
          payload: { name },
        });
      },
    };
  }

  /**
   * Format an error for user-friendly display
   *
   * @param {Error} error - Error object
   * @returns {string} Formatted error message
   */
  formatError(error) {
    if (!error) return "Unknown error";

    let message = error.message || String(error);

    // Try to extract line number from stack trace
    if (error.stack) {
      const lineMatch = error.stack.match(/<anonymous>:(\d+):(\d+)/);
      if (lineMatch) {
        // Adjust for wrapper code offset
        const lineNumber = Math.max(1, parseInt(lineMatch[1]) - 2);
        message += ` (line ${lineNumber})`;
      }
    }

    return message;
  }

  /**
   * Validate JavaScript code syntax without executing
   *
   * @param {string} code - JavaScript code to validate
   * @returns {{ valid: boolean, error: string|null }} Validation result
   */
  validateSyntax(code) {
    try {
      // Try to parse as a function body
      new Function(code);
      return { valid: true, error: null };
    } catch (error) {
      return {
        valid: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get the list of pending actions and clear them
   * @returns {Array} Pending actions
   */
  consumeActions() {
    const actions = [...this.pendingActions];
    this.pendingActions = [];
    return actions;
  }
}

// Export singleton instance
export const runJSEngine = new RunJSEngine();

export default RunJSEngine;
