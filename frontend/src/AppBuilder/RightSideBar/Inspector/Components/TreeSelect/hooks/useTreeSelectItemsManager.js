import { useState, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

export const useTreeSelectItemsManager = (component, paramUpdated) => {
  const [treeItems, setTreeItems] = useState([]);
  const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  // Helper function to update tree items
  const updateTreeItems = (newItems) => {
    setTreeItems(newItems);
    paramUpdated({ name: 'options' }, 'value', newItems, 'properties', false);
  };

  // Helper function to construct tree items from component definition
  const constructTreeItems = () => {
    let itemsValue = component?.component?.definition?.properties?.options?.value;
    if (!Array.isArray(itemsValue)) {
      itemsValue = itemsValue ? Object.values(itemsValue) : [];
    }
    return itemsValue;
  };

  // Generate unique ID
  const generateUniqueId = (prefix = 'option') => {
    const existingIds = new Set();
    const collectIds = (items) => {
      items.forEach((item) => {
        if (item.value) existingIds.add(item.value);
        if (item.children) collectIds(item.children);
      });
    };
    collectIds(treeItems);

    let counter = 1;
    let newId = `${prefix}${counter}`;
    while (existingIds.has(newId)) {
      counter++;
      newId = `${prefix}${counter}`;
    }
    return newId;
  };

  // Generate new tree option item
  const generateNewItem = () => {
    const id = generateUniqueId('option');
    return {
      label: `Option ${id.replace('option', '')}`,
      value: id,
    };
  };

  // Event handlers
  const handleItemChange = (propertyPath, value, itemValue, parentValue = null) => {
    const updateItems = (items) => {
      return items.map((item) => {
        if (parentValue && item.value === parentValue && item.children) {
          return {
            ...item,
            children: item.children.map((child) => {
              if (child.value === itemValue) {
                return { ...child, [propertyPath]: value };
              }
              return child;
            }),
          };
        }
        if (item.value === itemValue) {
          return { ...item, [propertyPath]: value };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    updateTreeItems(updateItems(treeItems));
  };

  const handleDeleteItem = (itemValue, parentValue = null) => {
    const deleteFromItems = (items) => {
      return items
        .filter((item) => {
          if (parentValue) return true;
          return item.value !== itemValue;
        })
        .map((item) => {
          if (parentValue && item.value === parentValue && item.children) {
            return {
              ...item,
              children: item.children.filter((child) => child.value !== itemValue),
            };
          }
          if (item.children) {
            return { ...item, children: deleteFromItems(item.children) };
          }
          return item;
        });
    };
    updateTreeItems(deleteFromItems(treeItems));
  };

  const handleAddItem = () => {
    const newItem = generateNewItem();
    updateTreeItems([...treeItems, newItem]);
  };

  const handleAddNestedItem = (parentValue) => {
    const newItem = generateNewItem();
    const addToParent = (items) => {
      return items.map((item) => {
        if (item.value === parentValue) {
          return {
            ...item,
            children: [...(item.children || []), newItem],
          };
        }
        if (item.children) {
          return { ...item, children: addToParent(item.children) };
        }
        return item;
      });
    };
    updateTreeItems(addToParent(treeItems));
  };

  // Handler for @dnd-kit reorder - receives the new tree structure
  const handleReorder = (newItems) => {
    const cleanItems = cleanupDndProperties(newItems);
    updateTreeItems(cleanItems);
  };

  // Remove temporary properties added by @dnd-kit
  const cleanupDndProperties = (items) => {
    return items.map((item) => {
      const { parentId, depth, index, ...cleanItem } = item;

      if (cleanItem.children && cleanItem.children.length > 0) {
        cleanItem.children = cleanupDndProperties(cleanItem.children);
      } else if (cleanItem.children && cleanItem.children.length === 0) {
        delete cleanItem.children;
      }

      return cleanItem;
    });
  };

  const toggleItemExpanded = (itemValue) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemValue]: prev[itemValue] === false ? true : false,
    }));
  };

  // Side effects
  useEffect(() => {
    const items = constructTreeItems();
    setTreeItems(items);
    // Initialize expanded state for items with children
    const initialExpanded = {};
    const initExpand = (itemList) => {
      itemList.forEach((item) => {
        if (item.children && item.children.length > 0) {
          initialExpanded[item.value] = true;
          initExpand(item.children);
        }
      });
    };
    initExpand(items);
    setExpandedItems(initialExpanded);
  }, [component?.id]);

  return {
    treeItems,
    hoveredItemIndex,
    setHoveredItemIndex,
    expandedItems,
    toggleItemExpanded,
    handleItemChange,
    handleDeleteItem,
    handleAddItem,
    handleAddNestedItem,
    handleReorder,
    getResolvedValue,
  };
};
