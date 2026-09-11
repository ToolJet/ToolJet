import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { validateStaticId, trimStaticId } from '../../../Utils';

export const useMenuItemsManager = (component, paramUpdated) => {
  const [menuItems, setMenuItems] = useState([]);
  const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const lastLocalUpdateRef = useRef(null);
  // Mirrors `menuItems` synchronously (unlike the state variable, which only reflects
  // the latest value after React re-renders). Two edits dispatched in the same tick —
  // e.g. the Id field committing on blur right as a toggle's click-driven onChange
  // fires — must each build on the other's result instead of both reading the same
  // stale `menuItems` closure and the second one clobbering the first. Every mutator
  // below reads/writes this ref instead of `menuItems` directly.
  const menuItemsRef = useRef(menuItems);

  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  // `_key` is render-only identity; strip before persisting.
  const stripInternalKeys = (items) =>
    items.map(({ _key, ...item }) => {
      if (item.children) {
        return { ...item, children: stripInternalKeys(item.children) };
      }
      return item;
    });

  // Helper function to update menu items
  const updateMenuItems = (newItems) => {
    const itemsToPersist = stripInternalKeys(newItems);
    // Track that this update originated locally so the sync effect can skip it
    lastLocalUpdateRef.current = JSON.stringify(itemsToPersist);
    menuItemsRef.current = newItems;
    setMenuItems(newItems);
    paramUpdated({ name: 'menuItems' }, 'value', itemsToPersist, 'properties', false);
  };

  // Helper function to construct menu items from component definition
  const constructMenuItems = () => {
    let itemsValue = component?.component?.definition?.properties?.menuItems?.value;
    if (!Array.isArray(itemsValue)) {
      itemsValue = itemsValue ? Object.values(itemsValue) : [];
    }
    return itemsValue.map((item) => {
      const newItem = { ...item };
      // Stable row identity, independent of the editable `id`; backfilled for legacy items.
      newItem._key = item._key || uuidv4();
      Object.keys(item).forEach((key) => {
        if (typeof item[key]?.value === 'boolean') {
          newItem[key] = { ...item[key], value: `{{${item[key]?.value}}}` };
        }
      });
      // Only process children for group items
      if (item.isGroup && item.children) {
        newItem.children = item.children.map((child) => {
          const newChild = { ...child };
          newChild._key = child._key || uuidv4();
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
    collectIds(menuItemsRef.current);

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
      'IconHome2',
      'IconLayoutDashboard',
      'IconSettings',
      'IconUser',
      'IconFolder',
      'IconFile',
      'IconStar',
      'IconHeart',
    ];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const baseItem = {
      id,
      _key: uuidv4(),
      label: isGroup ? `Group ${id.replace('group', '')}` : `Item ${id.replace('item', '')}`,
      icon: { value: randomIcon },
      iconVisibility: true,
      visible: { value: '{{false}}' },
      disable: { value: '{{false}}' },
      isGroup,
    };

    if (isGroup) {
      baseItem.children = [];
    }

    return baseItem;
  };

  // Validate a candidate item id against every other id in the tree (top-level + children).
  // Stable identity (reads menuItemsRef, needs no deps): the Id field's `validationFn` is a
  // dependency of SingleLineCodeEditor's value-reset effect, so a fresh function reference
  // here on every render would wipe an in-progress edit on any unrelated re-render.
  const validateItemId = useCallback((value, currentItemId) => {
    const existingIds = [];
    const collectIds = (items) => {
      items.forEach((item) => {
        existingIds.push(item.id);
        if (item.children) collectIds(item.children);
      });
    };
    collectIds(menuItemsRef.current);

    return validateStaticId(value, existingIds, currentItemId);
  }, []);

  // Rename the `ref` on any events bound to this item so they follow the item's new id
  const renameItemEventRefs = (oldId, newId) => {
    const { getModuleEvents, updateAppVersionEventHandlers } = useStore.getState().eventsSlice;
    const events = getModuleEvents('canvas').filter((e) => e.sourceId === component?.id && e.event?.ref === oldId);
    if (events.length === 0) return;

    const updatedEvents = events.map((e) => ({ ...e, event: { ...e.event, ref: newId } }));
    updateAppVersionEventHandlers(
      updatedEvents.map((e) => ({ event_id: e.id, diff: e })),
      'update'
    );
  };

  // Find the item a field's onChange is targeting, by its stable `_key` rather than
  // its `id` — `id` is itself an editable field here, and every field in the popover
  // shares the same closure's `item`, so a same-tick sibling call (e.g. a toggle firing
  // right after the Id field's blur commit) must still resolve to the right item even
  // after an earlier call in the same tick has already renamed it.
  const findItemByKey = (items, itemKey, parentId) => {
    if (parentId) {
      const parent = items.find((item) => item.id === parentId);
      return parent?.children?.find((child) => child._key === itemKey);
    }
    return items.find((item) => item._key === itemKey);
  };

  // Event handlers
  const handleItemChange = (propertyPath, rawValue, itemKey, parentId = null) => {
    const currentItems = menuItemsRef.current;
    const oldId = findItemByKey(currentItems, itemKey, parentId)?.id;

    // Store id trimmed, matching what was validated.
    const value = propertyPath === 'id' ? trimStaticId(rawValue) : rawValue;

    // Reject a colliding id outright, even locally — NavItemPopover already blocks
    // this, but keep the hook itself safe against any other caller too.
    if (propertyPath === 'id') {
      const [isValid] = validateItemId(value, oldId);
      if (!isValid) return;
    }

    const newItems = currentItems.map((item) => {
      if (parentId && item.id === parentId && item.children) {
        return {
          ...item,
          children: item.children.map((child) => {
            if (child._key === itemKey) {
              return updateItemProperty(child, propertyPath, value);
            }
            return child;
          }),
        };
      }
      if (item._key === itemKey) {
        return updateItemProperty(item, propertyPath, value);
      }
      return item;
    });

    if (propertyPath === 'id') {
      renameItemEventRefs(oldId, value);
    }

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

  // Delete orphaned handlers.
  const cleanupItemEvents = (itemIds) => {
    const { getModuleEvents, deleteAppVersionEventHandler } = useStore.getState().eventsSlice;
    const events = getModuleEvents('canvas').filter(
      (e) => e.sourceId === component?.id && e.event?.ref && itemIds.includes(e.event.ref)
    );
    if (events.length === 0) return;
    Promise.all(events.map((e) => deleteAppVersionEventHandler(e.id))).catch((err) => {
      console.error('[useMenuItemsManager] Failed to delete event handlers for item(s)', itemIds, err);
    });
  };

  const handleDeleteItem = (itemKey, parentId = null) => {
    const currentItems = menuItemsRef.current;
    const deleted = findItemByKey(currentItems, itemKey, parentId);

    if (parentId) {
      // Child item: only its own events (children can't have their own children).
      if (deleted) cleanupItemEvents([deleted.id]);
      const newItems = currentItems.map((item) => {
        if (item.id === parentId && item.children) {
          return {
            ...item,
            children: item.children.filter((child) => child._key !== itemKey),
          };
        }
        return item;
      });
      updateMenuItems(newItems);
    } else {
      // Top-level: the item plus (if it's a group) every child that gets removed with it.
      const affectedIds = deleted
        ? [deleted.id, ...(deleted.isGroup ? (deleted.children || []).map((c) => c.id) : [])]
        : [];
      cleanupItemEvents(affectedIds);
      const newItems = currentItems.filter((item) => item._key !== itemKey);
      updateMenuItems(newItems);
    }
  };

  const handleAddItem = () => {
    const newItem = generateNewItem(false);
    updateMenuItems([...menuItemsRef.current, newItem]);
  };

  const handleAddGroup = () => {
    const newGroup = generateNewItem(true);
    updateMenuItems([...menuItemsRef.current, newGroup]);
  };

  const handleAddItemToGroup = (groupId) => {
    const newItem = generateNewItem(false);
    const newItems = menuItemsRef.current.map((item) => {
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

  // Re-sync from the store definition when it changes externally (e.g., undo/redo)
  const menuItemsDefinition = component?.component?.definition?.properties?.menuItems?.value;

  useEffect(() => {
    const definitionJson = JSON.stringify(menuItemsDefinition);

    // Skip if this change originated from our own local update
    if (lastLocalUpdateRef.current === definitionJson) return;

    const items = constructMenuItems();
    menuItemsRef.current = items;
    setMenuItems(items);
    // Preserve existing expanded states, only add newly discovered groups
    setExpandedGroups((prev) => {
      const merged = { ...prev };
      items.forEach((item) => {
        if (item.isGroup && !(item.id in merged)) {
          merged[item.id] = true;
        }
      });
      return merged;
    });
  }, [component?.id, menuItemsDefinition]);

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
    validateItemId,
  };
};
