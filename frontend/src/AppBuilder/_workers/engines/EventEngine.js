/**
 * EventEngine
 *
 * Handles component event processing in the worker thread.
 * Parses and executes event handlers with proper context.
 *
 * Features:
 * - Parse event definitions from component properties
 * - Execute JavaScript code handlers via RunJSEngine
 * - Support for common event types (onClick, onChange, etc.)
 * - Handle event propagation and conditional execution
 * - Support indexed contexts (ListView rows)
 *
 * Phase 3: Event Handling & Query Processing
 */

import { RunJSEngine } from "./RunJSEngine";

/**
 * Event handler definition
 * @typedef {Object} EventHandler
 * @property {string} eventId - Unique event ID
 * @property {string} actionId - Action type (e.g., 'run-javascript', 'run-query')
 * @property {object} options - Handler options/parameters
 */

/**
 * Event execution result
 * @typedef {Object} EventResult
 * @property {boolean} success - Whether execution succeeded
 * @property {Array} actions - Actions to dispatch to main thread
 * @property {string|null} error - Error message if failed
 */

/**
 * Known event types that components can fire
 */
export const EventTypes = {
  // Button/Interactive events
  ON_CLICK: "onClick",
  ON_DOUBLE_CLICK: "onDoubleClick",
  ON_HOVER: "onHover",

  // Form/Input events
  ON_CHANGE: "onChange",
  ON_FOCUS: "onFocus",
  ON_BLUR: "onBlur",
  ON_ENTER: "onEnter",
  ON_SUBMIT: "onSubmit",

  // Selection events
  ON_SELECT: "onSelect",
  ON_DESELECT: "onDeselect",
  ON_SELECTION_CHANGE: "onSelectionChange",

  // Table/List events
  ON_ROW_CLICK: "onRowClicked",
  ON_ROW_HOVER: "onRowHovered",
  ON_PAGE_CHANGE: "onPageChanged",
  ON_SORT: "onSort",
  ON_FILTER: "onFilter",
  ON_SEARCH: "onSearch",

  // Toggle/Checkbox events
  ON_CHECK: "onCheck",
  ON_UNCHECK: "onUncheck",
  ON_TOGGLE: "onToggle",

  // File events
  ON_FILE_SELECTED: "onFileSelected",
  ON_FILE_LOADED: "onFileLoaded",
  ON_FILE_DESELECTED: "onFileDeselected",

  // Tab events
  ON_TAB_SWITCH: "onTabSwitch",

  // Modal events
  ON_OPEN: "onOpen",
  ON_CLOSE: "onClose",

  // Calendar events
  ON_DATE_SELECT: "onCalendarEventSelect",
  ON_DATE_NAVIGATION: "onCalendarNavigate",

  // Map events
  ON_BOUNDS_CHANGE: "onBoundsChange",
  ON_CREATE_MARKER: "onCreateMarker",
  ON_MARKER_CLICK: "onMarkerClick",

  // Video/Media events
  ON_PLAY: "onPlay",
  ON_PAUSE: "onPause",
  ON_ENDED: "onEnded",

  // Custom/Component loaded
  ON_LOAD: "onLoad",
  ON_MOUNT: "onComponentMount",
  ON_UNMOUNT: "onComponentUnmount",
};

/**
 * Action IDs for event handler types
 */
export const ActionIds = {
  RUN_JAVASCRIPT: "run-javascript",
  RUN_QUERY: "run-query",
  SET_VARIABLE: "set-variable",
  UNSET_VARIABLE: "unset-variable",
  SHOW_ALERT: "show-alert",
  SHOW_MODAL: "show-modal",
  CLOSE_MODAL: "close-modal",
  NAVIGATE: "navigate",
  OPEN_URL: "go-to-url",
  COPY_TO_CLIPBOARD: "copy-to-clipboard",
  SET_LOCAL_STORAGE: "set-localstorage-value",
  LOGOUT: "logout",
  SWITCH_PAGE: "switch-page",
  GENERATE_FILE: "generate-file",
  CONTROL_COMPONENT: "control-component",
};

/**
 * EventEngine class for handling component events
 */
export class EventEngine {
  constructor() {
    // JavaScript execution engine
    this.runJSEngine = new RunJSEngine();

    // Store reference for resolving component names
    this.store = null;

    // Resolution engine for resolving event option values
    this.resolutionEngine = null;

    // Debug mode
    this.debug = false;
  }

  /**
   * Initialize the event engine with dependencies
   * @param {object} store - Worker store reference
   * @param {object} resolutionEngine - Resolution engine reference
   */
  initialize(store, resolutionEngine) {
    this.store = store;
    this.resolutionEngine = resolutionEngine;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debug = enabled;
    this.runJSEngine.setDebugMode(enabled);
  }

  /**
   * Log debug message
   * @param {...any} args
   */
  log(...args) {
    if (this.debug) {
      console.log("[EventEngine]", ...args);
    }
  }

  /**
   * Fire a component event
   *
   * @param {string} componentId - Component ID that fired the event
   * @param {string} eventName - Event name (e.g., 'onClick')
   * @param {object} state - Current application state
   * @param {object} context - Event context
   * @param {object} context.eventData - Event-specific data (e.g., row data for table click)
   * @param {number} context.index - Index for ListView contexts
   * @param {object} context.customObjects - Custom objects (e.g., listItem)
   * @param {string} moduleId - Module ID
   * @returns {EventResult} Event execution result
   */
  async fireEvent(
    componentId,
    eventName,
    state,
    context = {},
    moduleId = "canvas"
  ) {
    const { eventData = {}, index = null, customObjects = {} } = context;

    this.log(`Firing event: ${componentId}.${eventName}`);

    // Get event handlers for this component and event
    const handlers = this.getEventHandlers(componentId, eventName, moduleId);

    if (handlers.length === 0) {
      this.log(`No handlers found for ${componentId}.${eventName}`);
      return { success: true, actions: [], error: null };
    }

    this.log(
      `Found ${handlers.length} handler(s) for ${componentId}.${eventName}`
    );

    // Collect all actions from all handlers
    const allActions = [];
    const errors = [];

    for (const handler of handlers) {
      try {
        const result = await this.executeHandler(handler, state, {
          componentId,
          eventName,
          eventData,
          index,
          customObjects,
        });

        if (result.actions) {
          allActions.push(...result.actions);
        }

        if (!result.success && result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        console.error("[EventEngine] Handler execution error:", error);
        errors.push(error.message || String(error));
      }
    }

    return {
      success: errors.length === 0,
      actions: allActions,
      error: errors.length > 0 ? errors.join("; ") : null,
    };
  }

  /**
   * Get event handlers for a component event
   *
   * @param {string} componentId - Component ID
   * @param {string} eventName - Event name
   * @param {string} moduleId - Module ID
   * @returns {EventHandler[]} Array of event handlers
   */
  getEventHandlers(componentId, eventName, moduleId) {
    if (!this.store) {
      console.warn("[EventEngine] Store not initialized");
      return [];
    }

    // Get events from store
    const events = this.store.getEvents(moduleId) || {};
    const componentEvents = events[componentId] || [];

    // Filter events for this event name
    return componentEvents.filter((event) => {
      return event.event === eventName || event.eventId === eventName;
    });
  }

  /**
   * Execute a single event handler
   *
   * @param {EventHandler} handler - Event handler definition
   * @param {object} state - Application state
   * @param {object} context - Execution context
   * @returns {EventResult} Execution result
   */
  async executeHandler(handler, state, context) {
    const { actionId, options = {} } = handler;

    this.log(`Executing handler: ${actionId}`);

    switch (actionId) {
      case ActionIds.RUN_JAVASCRIPT:
        return this.executeJavaScript(options, state, context);

      case ActionIds.RUN_QUERY:
        return this.executeRunQuery(options, state, context);

      case ActionIds.SET_VARIABLE:
        return this.executeSetVariable(options, state, context);

      case ActionIds.UNSET_VARIABLE:
        return this.executeUnsetVariable(options, state, context);

      case ActionIds.SHOW_ALERT:
        return this.executeShowAlert(options, state, context);

      case ActionIds.SHOW_MODAL:
        return this.executeShowModal(options, state, context);

      case ActionIds.CLOSE_MODAL:
        return this.executeCloseModal(options, state, context);

      case ActionIds.NAVIGATE:
        return this.executeNavigate(options, state, context);

      case ActionIds.OPEN_URL:
        return this.executeOpenUrl(options, state, context);

      case ActionIds.COPY_TO_CLIPBOARD:
        return this.executeCopyToClipboard(options, state, context);

      case ActionIds.SET_LOCAL_STORAGE:
        return this.executeSetLocalStorage(options, state, context);

      case ActionIds.LOGOUT:
        return this.executeLogout();

      case ActionIds.SWITCH_PAGE:
        return this.executeSwitchPage(options, state, context);

      case ActionIds.GENERATE_FILE:
        return this.executeGenerateFile(options, state, context);

      case ActionIds.CONTROL_COMPONENT:
        return this.executeControlComponent(options, state, context);

      default:
        this.log(`Unknown action ID: ${actionId}`);
        return {
          success: false,
          actions: [],
          error: `Unknown action: ${actionId}`,
        };
    }
  }

  /**
   * Resolve a value that may contain dynamic expressions
   * @param {*} value - Value to resolve
   * @param {object} state - Application state
   * @param {object} customObjects - Custom objects for resolution
   * @returns {*} Resolved value
   */
  resolveValue(value, state, customObjects = {}) {
    if (!this.resolutionEngine || typeof value !== "string") {
      return value;
    }

    return this.resolutionEngine.resolveDynamicValues(
      value,
      state,
      customObjects
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER EXECUTORS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute JavaScript code handler
   */
  async executeJavaScript(options, state, context) {
    const { code } = options;

    if (!code) {
      return { success: true, actions: [], error: null };
    }

    const result = await this.runJSEngine.executeAsync(code, state, {
      customObjects: context.customObjects,
      eventData: {
        event: context.eventName,
        data: context.eventData,
      },
    });

    return {
      success: result.success,
      actions: result.actions,
      error: result.error,
    };
  }

  /**
   * Execute run query handler
   */
  executeRunQuery(options, state, context) {
    const { queryId, queryName, parameters = {} } = options;
    const queryRef = queryId || queryName;

    // Resolve parameters
    const resolvedParams = {};
    for (const [key, value] of Object.entries(parameters)) {
      resolvedParams[key] = this.resolveValue(
        value,
        state,
        context.customObjects
      );
    }

    return {
      success: true,
      actions: [
        {
          type: "runQuery",
          payload: {
            queryNameOrId: queryRef,
            parameters: resolvedParams,
          },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute set variable handler
   */
  executeSetVariable(options, state, context) {
    const { variable, value } = options;
    const resolvedValue = this.resolveValue(
      value,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "setVariable",
          payload: { name: variable, value: resolvedValue },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute unset variable handler
   */
  executeUnsetVariable(options) {
    const { variable } = options;

    return {
      success: true,
      actions: [
        {
          type: "unsetVariable",
          payload: { name: variable },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute show alert handler
   */
  executeShowAlert(options, state, context) {
    const { alertType = "info", message } = options;
    const resolvedMessage = this.resolveValue(
      message,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "showAlert",
          payload: { alertType, message: resolvedMessage },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute show modal handler
   */
  executeShowModal(options, state, context) {
    const { modal, modalName } = options;
    const name = this.resolveValue(
      modal || modalName,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "showModal",
          payload: { modalName: name },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute close modal handler
   */
  executeCloseModal(options, state, context) {
    const { modal, modalName } = options;
    const name = this.resolveValue(
      modal || modalName,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "closeModal",
          payload: { modalName: name },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute navigate handler
   */
  executeNavigate(options, state, context) {
    const { page, queryParams = {} } = options;
    const resolvedPage = this.resolveValue(page, state, context.customObjects);

    // Resolve query params
    const resolvedParams = {};
    for (const [key, value] of Object.entries(queryParams)) {
      resolvedParams[key] = this.resolveValue(
        value,
        state,
        context.customObjects
      );
    }

    return {
      success: true,
      actions: [
        {
          type: "navigate",
          payload: { pageHandle: resolvedPage, queryParams: resolvedParams },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute open URL handler
   */
  executeOpenUrl(options, state, context) {
    const { url } = options;
    const resolvedUrl = this.resolveValue(url, state, context.customObjects);

    return {
      success: true,
      actions: [
        {
          type: "openUrl",
          payload: { url: resolvedUrl },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute copy to clipboard handler
   */
  executeCopyToClipboard(options, state, context) {
    const { text, contentToCopy } = options;
    const resolvedText = this.resolveValue(
      text || contentToCopy,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "copyToClipboard",
          payload: { text: resolvedText },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute set local storage handler
   */
  executeSetLocalStorage(options, state, context) {
    const { key, value } = options;
    const resolvedKey = this.resolveValue(key, state, context.customObjects);
    const resolvedValue = this.resolveValue(
      value,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "setLocalStorage",
          payload: { key: resolvedKey, value: resolvedValue },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute logout handler
   */
  executeLogout() {
    return {
      success: true,
      actions: [
        {
          type: "logout",
          payload: {},
        },
      ],
      error: null,
    };
  }

  /**
   * Execute switch page handler
   */
  executeSwitchPage(options, state, context) {
    const { pageHandle } = options;
    const resolvedPage = this.resolveValue(
      pageHandle,
      state,
      context.customObjects
    );

    return {
      success: true,
      actions: [
        {
          type: "switchPage",
          payload: { pageHandle: resolvedPage },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute generate file handler
   */
  executeGenerateFile(options, state, context) {
    const { fileName, fileType, data } = options;
    const resolvedFileName = this.resolveValue(
      fileName,
      state,
      context.customObjects
    );
    const resolvedFileType = this.resolveValue(
      fileType,
      state,
      context.customObjects
    );
    const resolvedData = this.resolveValue(data, state, context.customObjects);

    return {
      success: true,
      actions: [
        {
          type: "generateFile",
          payload: {
            fileName: resolvedFileName,
            fileType: resolvedFileType,
            data: resolvedData,
          },
        },
      ],
      error: null,
    };
  }

  /**
   * Execute control component handler (e.g., setFocus, clearValue)
   */
  executeControlComponent(options, state, context) {
    const { componentId, componentName, action } = options;
    const targetId = componentId || componentName;

    return {
      success: true,
      actions: [
        {
          type: "controlComponent",
          payload: {
            componentId: targetId,
            action,
          },
        },
      ],
      error: null,
    };
  }
}

// Export singleton instance
export const eventEngine = new EventEngine();

export default EventEngine;
