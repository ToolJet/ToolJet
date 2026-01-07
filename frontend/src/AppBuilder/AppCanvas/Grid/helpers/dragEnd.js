/**
 * Drag Context Breakdown:
 *
 * This object encapsulates all relevant details about a drag event,
 * grouping the **source (where the widget came from)** and **target (where it's being dropped)**.
 *
 * Core Concepts:
 * - `draggedWidget` → The widget being dragged (`e.target`).
 * - `sourceSlot` → The original parent container of `draggedWidget`.
 *   - This could be a **header, footer, or a sub-container (like a container body)**.
 * - `targetSlot` → The new parent container where `draggedWidget` is dropped.
 * - `sourceWidget` → The **widget that owns** `sourceSlot` (its direct parent).
 * - `targetWidget` → The **widget that owns** `targetSlot` (its direct parent).
 *
 * These entities are structured into a **contextual grouping**, allowing for easy access:
 *
 * {
 *   source: {
 *     widget: sourceWidget,  // The original widget that holds the source slot.
 *     slot: sourceSlot,      // The slot where the widget was initially located.
 *     id: sourceWidget.id,   // Unique identifier of the source widget.
 *     slotId: sourceSlot.id, // Unique identifier of the source slot.
 *
 *     isModal: computed function,  // Checks if sourceWidget is a Modal.
 *     slotType: computed function, // Determines if the slot is a header, footer, or body.
 *     widgetType: computed function, // Returns the type of the widget (e.g., Table, Form, etc.).
 *   },
 *
 *   target: {
 *     widget: targetWidget,  // The new widget where the dragged widget is being placed.
 *     slot: targetSlot,      // The slot inside `targetWidget` where the drop is happening.
 *     id: targetWidget.id,   // Unique identifier of the target widget.
 *     slotId: targetSlot.id, // Unique identifier of the target slot.
 *
 *     isModal: computed function,  // Checks if targetWidget is a Modal.
 *     slotType: computed function, // Determines if the slot is a header, footer, or body.
 *     widgetType: computed function, // Returns the type of the target widget.
 *   }
 * }
 *
 * Additional Checks:
 * - `isSourceModal` → **Is the source inside a modal?**
 * - `isTargetModal` → **Is the target inside a modal?**
 * - `isDraggingToModalSlots` → **Is the widget being dragged into a modal slot (header/footer)?**
 * - `targetSlotType` → **Determines whether the drop is happening in a header, footer, or body.**
 *
 * Why This Matters?
 * - This structure helps **validate and restrict movements**, ensuring widgets follow UI constraints.
 * - Prevents invalid drops (e.g., putting a button inside a Table component).
 * - Enables **modular and flexible** widget movement across different UI sections.
 */
import { getMouseDistanceFromParentDiv } from '../gridUtils';

import { DROPPABLE_PARENTS } from '../../appCanvasConstants';
import { isDroppingRestrictedWidget } from '../gridUtils';

const CANVAS_ID = 'canvas';
const REAL_CANVAS_ID = 'real-canvas';

/**
 * Represents the widget being dragged.
 *
 * This class encapsulates all necessary information about the dragged widget,
 * including its type, position, and whether it is allowed to move into certain areas.
 */
export class DragEntity {
  constructor(widget) {
    this.widget = widget; // The widget object being dragged
    this.id = widget?.id || null; // Unique ID of the dragged widget
    this.left = widget.left; // Initial X position (relative to grid)
    this.top = widget.top; // Initial Y position (relative to grid)
  }

  get widgetType() {
    return this.widget?.component?.component || null;
  }
}

/**
 * Defines a **droppable area** in the canvas.
 *
 * A droppable area is a container that can accept dragged widgets.
 * This class helps determine if a slot is valid and handles various properties like modals.
 */
export class DropAreaEntity {
  constructor(widget, slotId) {
    this.widget = widget; // The widget that owns this slot
    this.id = widget?.id || CANVAS_ID; // ID of the widget
    this.slotId = slotId || REAL_CANVAS_ID; // ID of the slot where the widget is located
  }

  // Checks if the widget is a modal
  get isModal() {
    return ['Modal', 'ModalV2'].includes(this.widget?.component?.component);
  }

  // Checks if the widget is the new version of modal
  get isNewModal() {
    return this.widget?.component?.component === 'ModalV2';
  }

  // Checks if the widget is the legacy modal
  get isLegacyModal() {
    return this.widget?.component?.component === 'Modal';
  }

  // Determines if the slot belongs to a modal's header/footer
  get isInModalSlot() {
    return this.isNewModal && this.isOnCustomSlot;
  }

  // Identifies if the slot is a custom slot (e.g., modal header/footer)
  get isOnCustomSlot() {
    return this.slotId.includes('-header') || this.slotId.includes('-footer');
  }

  // Determines if the slot is a valid drop target
  get isDroppable() {
    return DROPPABLE_PARENTS.has(this.widgetType);
  }

  // Returns the type of slot (header, footer, body, etc.)
  get slotType() {
    return this.slotId ? this.slotId.split('-').pop() : CANVAS_ID;
  }

  // Returns the type of the widget inside the slot
  get widgetType() {
    return this.widget?.component?.component || CANVAS_ID;
  }
}

/**
 * Represents the **dragging context**, encapsulating information
 * about the source, target, and the dragged widget.
 *
 * This helps determine:
 * - Whether the move is valid
 * - Where the widget should be placed
 * - Any restrictions based on parent-child relationships
 */
export class DragContext {
  constructor({ sourceSlotId, targetSlotId, draggedWidgetId, widgets, isModuleEditor = false }) {
    const sourceWidgetId = sourceSlotId?.slice(0, 36);
    const sourceWidget = getWidgetById(widgets, sourceWidgetId);

    const targetWidgetId = targetSlotId?.slice(0, 36);
    const targetWidget = getWidgetById(widgets, targetWidgetId);

    const draggedWidget = getWidgetById(widgets, draggedWidgetId);

    this.source = new DropAreaEntity(sourceWidget, sourceSlotId);
    this.target = new DropAreaEntity(targetWidget, targetSlotId);
    this.dragged = new DragEntity(draggedWidget);
    this.widgets = widgets;
    this.isModuleEditor = isModuleEditor;
  }

  /**
   * Updates the **target slot** dynamically as the drag event progresses.
   */
  updateTarget(targetSlotId) {
    const targetWidgetId = targetSlotId?.slice(0, 36);
    const targetWidget = getWidgetById(this.widgets, targetWidgetId);
    this.target = new DropAreaEntity(targetWidget, targetSlotId);
  }

  get isDroppable() {
    const { dragged, target, isModuleEditor } = this;
    // If the target is the canvas and we are in module editor,
    // then we don't want to drop the widget outside the module
    if (isModuleEditor && target.id === 'canvas') {
      return false;
    }

    const isRestrictedWidget = isDroppingRestrictedWidget(target, dragged);

    return !isRestrictedWidget;
  }
}

/**
 * Constructs the **dragging context** by gathering all relevant details from the event.
 * @param {Object} params - Parameters for building the context.
 * @param {Object} params.event - The drag event.
 * @param {Array} params.widgets - The list of all widgets.
 * @param {boolean} params.isModuleEditor - Whether we are in module editor mode.
 * @param {Array} params.excludeWidgetIds - Optional array of widget IDs to exclude from drop target detection.
 */
export function dragContextBuilder({ event, widgets, isModuleEditor = false, excludeWidgetIds = [] }) {
  const draggedWidgetId = event.target.id;
  const draggedWidget = getWidgetById(widgets, draggedWidgetId);
  const sourceSlotId = draggedWidget.parent;

  // Initialize drag context
  const context = new DragContext({
    widgets,
    draggedWidgetId,
    sourceSlotId,
    targetSlotId: sourceSlotId,
    isModuleEditor,
  });

  // Determine the potential drop target (exclude all selected widgets in multi-select)
  const targetSlotId = getDroppableSlotIdOnScreen(event, widgets, excludeWidgetIds);
  context.updateTarget(targetSlotId);

  return context;
}

/**
 * Given an event, finds the **nearest valid droppable slot**.
 */
/**
 * Given an event, finds the **nearest valid droppable slot**.
 * @param {Object} event - The drag event with clientX, clientY coordinates.
 * @param {Array} widgets - The list of all widgets.
 * @param {Array} excludeWidgetIds - Optional array of widget IDs to exclude from being considered as drop targets.
 */
export const getDroppableSlotIdOnScreen = (event, widgets, excludeWidgetIds = []) => {
  const widgetType = getWidgetById(widgets, event.target.id)?.component?.component || CANVAS_ID;

  // Build a Set of all IDs to exclude (includes event.target.id + any additional excluded IDs)
  const excludeIds = new Set([event.target.id, ...excludeWidgetIds]);

  // TO:DO - Have to remove this condition for ModuleViewer
  if (widgetType !== 'ModuleViewer') {
    const targetElems = document.elementsFromPoint(event.clientX, event.clientY);
    const draggedOverElements = targetElems.filter((ele) => {
      // Extract widget ID from element (handles both 'canvas-<id>' and direct '<id>' formats)
      const elementWidgetId = ele.id.replace('canvas-', '')?.slice(0, 36);
      // Exclude if this element belongs to any of the dragged widgets
      return !excludeIds.has(elementWidgetId) && ele.classList.contains('real-canvas');
    });
    const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
    const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));

    // Determine potential new parent
    const newParentId = draggedOverContainer?.getAttribute('data-parentId') || draggedOverElem?.id;

    // Also check if newParentId itself is one of the excluded widgets
    if (newParentId && excludeIds.has(newParentId.slice(0, 36))) {
      // Skip this and try to find the next valid parent
      return undefined;
    }

    return newParentId === 'canvas' ? undefined : newParentId;
  } else {
    const [slotId] = document
      .elementsFromPoint(event.clientX, event.clientY)
      .filter(
        (ele) =>
          !event.target.contains(ele) && ele.id !== event.target.id && ele.classList.contains('drag-container-parent')
      )
      .map((ele) => extractSlotId(ele))
      .filter((slotId) => {
        const widgetType = getWidgetById(widgets, slotId.slice(0, 36))?.component?.component || CANVAS_ID;
        return DROPPABLE_PARENTS.has(widgetType);
      });

    return slotId;
  }
};

/**
 * Finds a widget by its ID.
 */
export function getWidgetById(boxList, targetId) {
  return boxList.find((box) => box.id === targetId) ?? null;
}

/**
 * Extracts the **slot ID** from a given DOM element.
 */
const extractSlotId = (element) => {
  return element?.getAttribute('component-id') || element.id.replace(/^canvas-/, '');
};

/**
 * Computes the final (left, top) position for a dragged widget based on grid snapping and drop conditions.
 *
 * @param {Object} event - Drag event object containing movement data.
 * @param {DropAreaEntity} target - The target drop area entity (where widget is dropped).
 * @param {boolean} isParentChangeAllowed - Whether the widget can move to the target.
 * @param {number} gridWidth - The width of the grid for alignment.
 * @param {DragEntity} dragged - The entity being dragged.
 * @returns {Object} { left, top } - The computed position.
 */
export const getAdjustedDropPosition = (event, target, isParentChangeAllowed, gridWidth, dragged) => {
  if (isParentChangeAllowed) {
    // Compute the relative position inside the new container
    const { left: adjustedLeft, top: adjustedTop } = getMouseDistanceFromParentDiv(
      event,
      target.slotId,
      target.widgetType
    );

    return {
      left: Math.round(adjustedLeft / gridWidth) * gridWidth, // Snap to the nearest grid column
      top: Math.round(adjustedTop / 10) * 10, // Snap to the nearest 10px
    };
  }

  // If movement is restricted, revert to original position
  return {
    left: dragged.left * gridWidth,
    top: dragged.top,
  };
};

/**
 * Checks if the target is a ModuleContainer (in app editor, not module editor).
 *
 * @param {string} targetSlotId - The target slot ID.
 * @param {boolean} isModuleEditor - Whether we are in module editor mode.
 * @returns {boolean} - True if the target is a ModuleContainer.
 */
export const isTargetModuleContainer = (targetSlotId, isModuleEditor) => {
  if (isModuleEditor) return false;
  return document.getElementById(`canvas-${targetSlotId}`)?.getAttribute('component-type') === 'ModuleContainer';
};

/**
 * Computes the position for a widget being dropped using getBoundingClientRect.
 * This is used for both single and multi-drag scenarios.
 *
 * @param {HTMLElement} widgetElement - The dragged widget's DOM element.
 * @param {string} targetSlotId - The target slot ID.
 * @param {number} gridWidth - The grid width for snapping.
 * @param {number} gridHeight - The grid height for snapping (default 10).
 * @returns {Object} - { left, top } - The computed position.
 */
export const computeWidgetDropPosition = (widgetElement, targetSlotId, gridWidth, gridHeight = 10) => {
  const parentDiv = document.getElementById('canvas-' + targetSlotId) || document.getElementById('real-canvas');
  const parentDivRect = parentDiv?.getBoundingClientRect();
  const targetDivRect = widgetElement.getBoundingClientRect();

  // Calculate position relative to target container
  const adjustedLeft = targetDivRect.left - parentDivRect.left;
  const adjustedTop = targetDivRect.top - parentDivRect.top;

  // Apply grid snapping
  return {
    left: Math.round(adjustedLeft / gridWidth) * gridWidth,
    top: Math.round(adjustedTop / gridHeight) * gridHeight,
  };
};

/**
 * Gets the revert position for a widget (its original position before drag).
 *
 * @param {Object} widget - The widget object from boxList.
 * @param {number} gridWidth - The grid width for the widget's container.
 * @returns {Object} - { left, top } - The original position.
 */
export const getRevertPosition = (widget, gridWidth) => {
  return {
    left: widget.left * gridWidth,
    top: widget.top,
  };
};

/**
 * Converts a slotId to a parent ID format suitable for handleDragEnd.
 * - 'real-canvas' → null (main canvas)
 * - other slotIds → slotId
 *
 * @param {string} slotId - The slot ID.
 * @returns {string|null} - The parent ID or null for main canvas.
 */
export const getParentFromSlotId = (slotId) => {
  return slotId === 'real-canvas' ? null : slotId;
};

/**
 * Converts a slotId to a container ID format for reordering.
 * - 'real-canvas' or undefined → 'canvas'
 * - other slotIds → slotId
 *
 * @param {string} slotId - The slot ID.
 * @returns {string} - The container ID for reordering.
 */
export const getContainerIdFromSlotId = (slotId) => {
  return slotId === 'real-canvas' || !slotId ? 'canvas' : slotId;
};
