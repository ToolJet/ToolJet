import { v4 as uuidv4 } from 'uuid';
import { resolveReferences } from '@/_helpers/utils';

/**
 * Generate a unique name for a new item
 * @param {Array} items - Existing items
 * @param {string} prefix - Name prefix (e.g., 'new_column', 'new_field')
 * @returns {string} Unique name
 */
export const generateUniqueName = (items, prefix) => {
  let found = false;
  let currentNumber = 1;
  let name = '';

  while (!found) {
    name = `${prefix}${currentNumber}`;
    if (!items.find((item) => item.name === name)) {
      found = true;
    }
    currentNumber += 1;
  }

  return name;
};

/**
 * Reorder array by moving item from startIndex to endIndex
 * @param {Array} array - Array to reorder
 * @param {number} startIndex - Source index
 * @param {number} endIndex - Destination index
 * @returns {Array} New reordered array
 */
export const reorderArray = (array, startIndex, endIndex) => {
  const result = [...array];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

/**
 * Duplicate an item with a new UUID
 * @param {Object} item - Item to duplicate
 * @returns {Object} Duplicated item with new id
 */
export const duplicateWithNewId = (item) => ({
  ...item,
  id: uuidv4(),
});

/**
 * Check if all items are editable
 * @param {Array} items - Items to check
 * @param {string} typeProp - Property name for item type (e.g., 'columnType', 'fieldType')
 * @param {Array} nonEditableTypes - Types that cannot be editable
 * @param {Object} currentState - Current app state for resolving references
 * @returns {boolean}
 */
export const checkAllEditable = (items, typeProp, nonEditableTypes, currentState) => {
  const editableItems = items.filter((item) => item && !nonEditableTypes.includes(item[typeProp]));
  return editableItems.every((item) => resolveReferences(item.isEditable, currentState));
};

/**
 * Get draggable item style
 * @param {boolean} isDragging - Whether item is being dragged
 * @param {Object} draggableStyle - Style from react-beautiful-dnd
 * @returns {Object} Combined style
 */
export const getDraggableStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  ...draggableStyle,
});

/**
 * Get popover field source string
 * @param {string} componentName - Component name
 * @param {string} itemName - Item name (column/field name)
 * @param {string} fieldName - Field name within the item
 * @returns {string} Source string
 */
export const getPopoverSource = (componentName, itemName, fieldName) =>
  `component/${componentName}/${itemName ?? 'default'}::${fieldName}`;
