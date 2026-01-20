import { useState, useEffect, useCallback, useMemo } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { v4 as uuidv4 } from 'uuid';
import { generateUniqueName, reorderArray, duplicateWithNewId, checkAllEditable, getPopoverSource } from '../utils';

/**
 * Generic hook for managing list items (columns, fields, etc.)
 * @param {Object} params
 * @param {Object} params.component - Component definition
 * @param {Function} params.paramUpdated - Callback to update component params
 * @param {Object} params.currentState - Current app state
 * @param {Object} params.config - Configuration for the hook
 * @param {string} params.config.propertyName - Property name in component definition ('columns' | 'fields')
 * @param {string} params.config.typeProp - Property name for item type ('columnType' | 'fieldType')
 * @param {Array} params.config.nonEditableTypes - Types that cannot be editable (default: ['link', 'image'])
 * @param {string} params.config.namePrefix - Prefix for new item names (default: 'new_item')
 * @param {Object} params.config.defaultItemProps - Additional default properties for new items
 * @param {Function} params.config.onPropertyChange - Callback before property change (item, property, value) => modifiedItem
 * @param {Function} params.config.onRemove - Callback after item removal (removedItems, index) => Promise
 */
export const useListItemManager = ({ component, paramUpdated, currentState, config }) => {
  const {
    propertyName,
    typeProp,
    nonEditableTypes = ['link', 'image'],
    namePrefix = 'new_item',
    defaultItemProps = {},
    onPropertyChange,
    onRemove,
  } = config;

  const [isAllEditable, setIsAllEditable] = useState(false);

  // Get items from component definition - wrapped in useMemo to avoid dependency issues
  const itemsProperty = component?.component?.definition?.properties?.[propertyName];
  const items = useMemo(() => itemsProperty?.value || [], [itemsProperty?.value]);

  // Check if all items are editable
  const checkIfAllEditable = useCallback(
    (comp) => {
      const itemList = comp?.component?.definition?.properties?.[propertyName]?.value || [];
      return checkAllEditable(itemList, typeProp, nonEditableTypes, currentState);
    },
    [propertyName, typeProp, nonEditableTypes, currentState]
  );

  // Sync isAllEditable state with items changes
  useEffect(() => {
    setIsAllEditable(checkIfAllEditable(component));
  }, [component, checkIfAllEditable]);

  // Add new item
  const addItem = useCallback(() => {
    const newName = generateUniqueName(items, namePrefix);
    const newItem = {
      name: newName,
      id: uuidv4(),
      isEditable: isAllEditable,
      fxActiveFields: [],
      [typeProp]: 'string',
      ...defaultItemProps,
      ...(defaultItemProps.includeKey ? { key: newName } : {}),
    };
    // Remove the helper flag
    delete newItem.includeKey;

    paramUpdated({ name: propertyName }, 'value', [...items, newItem], 'properties', true);
  }, [items, namePrefix, isAllEditable, typeProp, defaultItemProps, paramUpdated, propertyName]);

  // Remove item by index
  const removeItem = useCallback(
    async (index, ...args) => {
      try {
        const newValue = [...items];
        const removedItems = newValue.splice(index, 1);
        await paramUpdated({ name: propertyName }, 'value', newValue, 'properties', true);

        // Call custom onRemove callback if provided
        if (onRemove) {
          await onRemove(removedItems, index, ...args);
        }
      } catch (error) {
        console.error(`Error removing ${propertyName}:`, error);
      }
    },
    [items, paramUpdated, propertyName, onRemove]
  );

  // Duplicate item by index
  const duplicateItem = useCallback(
    (index) => {
      const duplicated = duplicateWithNewId(items[index]);
      paramUpdated({ name: propertyName }, 'value', [...items, duplicated], 'properties', true);
    },
    [items, paramUpdated, propertyName]
  );

  // Reorder items (for drag & drop)
  const reorderItems = useCallback(
    (startIndex, endIndex) => {
      const reordered = reorderArray(items, startIndex, endIndex);
      paramUpdated({ name: propertyName }, 'value', reordered, 'properties', true);
    },
    [items, paramUpdated, propertyName]
  );

  // Update a single item property
  const updateProperty = useCallback(
    (index, property, value) => {
      let newItems = [...items];
      let item = { ...newItems[index] };

      // Apply custom property change logic if provided
      if (onPropertyChange) {
        item = onPropertyChange(item, property, value) || item;
      }

      item[property] = value;
      newItems[index] = item;

      // Handle non-editable types
      if (nonEditableTypes.includes(newItems[index][typeProp])) {
        newItems[index].isEditable = '{{false}}';
      }

      // Sync isEditable when type changes
      if (property === typeProp && !nonEditableTypes.includes(value) && isAllEditable) {
        newItems[index].isEditable = '{{true}}';
      }
      console.log(newItems, propertyName, 'newItems');
      paramUpdated({ name: propertyName }, 'value', newItems, 'properties', true);

      // Update isAllEditable state based on individual changes
      if (property === 'isEditable') {
        const resolvedValue = resolveReferences(value);
        if (!resolvedValue && isAllEditable) {
          setIsAllEditable(false);
        } else if (resolvedValue && !isAllEditable) {
          const allEditable = newItems
            .filter((i) => !nonEditableTypes.includes(i[typeProp]))
            .every((i) => resolveReferences(i.isEditable));
          if (allEditable) {
            setIsAllEditable(true);
          }
        }
      }
    },
    [items, paramUpdated, propertyName, typeProp, nonEditableTypes, isAllEditable, onPropertyChange]
  );

  // Update item events
  const updateEvents = useCallback(
    (itemId, events) => {
      const newItems = items.map((item) => (item.id === itemId ? { ...item, events } : item));
      paramUpdated({ name: propertyName }, 'value', newItems, 'properties');
    },
    [items, paramUpdated, propertyName]
  );

  // Toggle all items editable
  const setAllEditable = useCallback(
    (value) => {
      const newItems = items
        .filter((item) => item)
        .map((item) => ({
          ...item,
          isEditable: !nonEditableTypes.includes(item[typeProp]) ? value : '{{false}}',
        }));

      paramUpdated({ name: propertyName }, 'value', newItems, 'properties', true);
      setIsAllEditable(resolveReferences(value));
    },
    [items, paramUpdated, propertyName, typeProp, nonEditableTypes]
  );

  // Get popover field source
  const getPopoverFieldSource = useCallback(
    (itemName, fieldName) => getPopoverSource(component.component.name, itemName, fieldName),
    [component]
  );

  // Memoize filtered items
  const filteredItems = useMemo(() => items.filter((item) => item), [items]);

  return {
    items,
    filteredItems,
    isAllEditable,
    addItem,
    removeItem,
    duplicateItem,
    reorderItems,
    updateProperty,
    updateEvents,
    setAllEditable,
    getPopoverFieldSource,
  };
};
