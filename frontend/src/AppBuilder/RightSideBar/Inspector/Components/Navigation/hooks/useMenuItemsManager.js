import { useState, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

export const useMenuItemsManager = (component, paramUpdated) => {
  const [menuItems, setMenuItems] = useState([]);
  const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  // Helper function to update menu items
  const updateMenuItems = (newItems) => {
    setMenuItems(newItems);
    paramUpdated({ name: 'menuItems' }, 'value', newItems, 'properties', false);
  };

  // Helper function to construct menu items from component definition
  const constructMenuItems = () => {
    let itemsValue = component?.component?.definition?.properties?.menuItems?.value;
    if (!Array.isArray(itemsValue)) {
      itemsValue = itemsValue ? Object.values(itemsValue) : [];
    }
    return itemsValue.map((item) => {
      const newItem = { ...item };
      Object.keys(item).forEach((key) => {
        if (typeof item[key]?.value === 'boolean') {
          newItem[key] = { ...item[key], value: `{{${item[key]?.value}}}` };
        }
      });
      // Only process children for group items
      if (item.isGroup && item.children) {
        newItem.children = item.children.map((child) => {
          const newChild = { ...child };
          Object.keys(child).forEach((key) => {
            if (typeof child[key]?.value === 'boolean') {
              newChild[key] = { ...child[key], value: `{{${child[key]?.value}}}` };
            }
          });
          // Ensure child items don't have children
          delete newChild.children;
          return newChild;
        });
      } else if (!item.isGroup) {
        // Non-group items should not have children
        delete newItem.children;
      } else if (item.isGroup && !item.children) {
        // Groups should always have children array
        newItem.children = [];
      }
      return newItem;
    });
  };

  // Generate unique ID
  const generateUniqueId = (prefix = 'item') => {
    const existingIds = new Set();
    const collectIds = (items) => {
      items.forEach((item) => {
        existingIds.add(item.id);
        if (item.children) collectIds(item.children);
      });
    };
    collectIds(menuItems);

    let counter = 1;
    let newId = `${prefix}${counter}`;
    while (existingIds.has(newId)) {
      counter++;
      newId = `${prefix}${counter}`;
    }
    return newId;
  };

  // Generate new menu item
  const generateNewItem = (isGroup = false) => {
    const id = generateUniqueId(isGroup ? 'group' : 'item');
    const icons = [
      'IconHome2', 'IconLayoutDashboard', 'IconSettings', 'IconUser',
      'IconFolder', 'IconFile', 'IconStar', 'IconHeart'
    ];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const baseItem = {
      id,
      label: isGroup ? `Group ${id.replace('group', '')}` : `Item ${id.replace('item', '')}`,
      icon: { value: randomIcon },
      iconVisibility: true,
      visible: { value: '{{true}}' },
      disable: { value: '{{false}}' },
      isGroup,
    };

    if (isGroup) {
      baseItem.children = [];
    }

    return baseItem;
  };

  // Event handlers
  const handleItemChange = (propertyPath, value, itemId, parentId = null) => {
    const newItems = menuItems.map((item) => {
      if (parentId && item.id === parentId && item.children) {
        return {
          ...item,
          children: item.children.map((child) => {
            if (child.id === itemId) {
              return updateItemProperty(child, propertyPath, value);
            }
            return child;
          }),
        };
      }
      if (item.id === itemId) {
        return updateItemProperty(item, propertyPath, value);
      }
      return item;
    });
    updateMenuItems(newItems);
  };

  const updateItemProperty = (item, propertyPath, value) => {
    if (propertyPath.includes('.')) {
      const [parentKey, childKey] = propertyPath.split('.');
      return {
        ...item,
        [parentKey]: {
          ...item[parentKey],
          [childKey]: value,
        },
      };
    }
    return {
      ...item,
      [propertyPath]: value,
    };
  };

  const handleDeleteItem = (itemId, parentId = null) => {
    if (parentId) {
      const newItems = menuItems.map((item) => {
        if (item.id === parentId && item.children) {
          return {
            ...item,
            children: item.children.filter((child) => child.id !== itemId),
          };
        }
        return item;
      });
      updateMenuItems(newItems);
    } else {
      const newItems = menuItems.filter((item) => item.id !== itemId);
      updateMenuItems(newItems);
    }
  };

  const handleAddItem = () => {
    const newItem = generateNewItem(false);
    updateMenuItems([...menuItems, newItem]);
  };

  const handleAddGroup = () => {
    const newGroup = generateNewItem(true);
    updateMenuItems([...menuItems, newGroup]);
  };

  const handleAddItemToGroup = (groupId) => {
    const newItem = generateNewItem(false);
    const newItems = menuItems.map((item) => {
      if (item.id === groupId && item.isGroup) {
        return {
          ...item,
          children: [...(item.children || []), newItem],
        };
      }
      return item;
    });
    updateMenuItems(newItems);
  };

  // Handler for @dnd-kit reorder - receives the new tree structure
  const handleReorder = (newItems) => {
    // Clean up the items by removing temporary dnd properties
    const cleanItems = cleanupDndProperties(newItems);
    updateMenuItems(cleanItems);
  };

  // Remove temporary properties added by @dnd-kit
  const cleanupDndProperties = (items) => {
    return items.map((item) => {
      const { parentId, depth, index, ...cleanItem } = item;

      // Handle children array
      if (cleanItem.isGroup) {
        // Groups should keep children array (even if empty)
        if (cleanItem.children && cleanItem.children.length > 0) {
          cleanItem.children = cleanupDndProperties(cleanItem.children);
        } else {
          cleanItem.children = [];
        }
      } else {
        // Non-group items should NOT have children array
        delete cleanItem.children;
      }

      return cleanItem;
    });
  };

  const toggleGroupExpanded = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === false ? true : false,
    }));
  };

  // Side effects
  useEffect(() => {
    const items = constructMenuItems();
    setMenuItems(items);
    // Initialize expanded state for all groups
    const initialExpanded = {};
    items.forEach((item) => {
      if (item.isGroup) {
        initialExpanded[item.id] = true;
      }
    });
    setExpandedGroups(initialExpanded);
  }, [component?.id]);

  return {
    menuItems,
    hoveredItemIndex,
    setHoveredItemIndex,
    expandedGroups,
    toggleGroupExpanded,
    handleItemChange,
    handleDeleteItem,
    handleAddItem,
    handleAddGroup,
    handleAddItemToGroup,
    handleReorder,
    getResolvedValue,
  };
};
