import { arrayMove } from '@dnd-kit/sortable';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

// Default property names - can be overridden
const DEFAULT_PROPERTY_NAMES = {
  isGroup: 'isGroup',
  parentId: 'parentId',
};

function getDragDepth(offset, indentationWidth) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items,
  activeId,
  overId,
  dragOffset,
  indentationWidth,
  intersections,
  propertyNames = DEFAULT_PROPERTY_NAMES
) {
  const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;

  try {
    const overItemIndex = items.findIndex(({ id }) => id === overId);
    const activeItemIndex = items.findIndex(({ id }) => id === activeId);
    const activeItem = items[activeItemIndex];
    const newItems = arrayMove(items, activeItemIndex, overItemIndex);
    const nextItem = newItems[overItemIndex + 1];
    const dragDepth = getDragDepth(dragOffset, indentationWidth);
    const projectedDepth = Math.min(activeItem.depth + dragDepth, 1); // Ensure max depth is 1
    const maxDepth = 1; // Set max depth to 1
    const minDepth = getMinDepth({ nextItem });

    // Groups always stay at depth 0
    if (activeItem[isGroupKey]) {
      return { depth: 0, maxDepth, minDepth, [parentIdKey]: null };
    }

    let depth = projectedDepth;
    if (projectedDepth > maxDepth) {
      depth = maxDepth;
    } else if (projectedDepth < minDepth) {
      depth = minDepth;
    }

    if (depth < 1 && !activeItem[isGroupKey]) {
      // Check if it is intersecting with a group item
      const highestIntersection = intersections?.[0];
      const highestIntersectionId = highestIntersection?.[0];
      const highestIntersectionItem = items.find(({ id }) => id === highestIntersectionId);
      if (highestIntersectionItem?.[parentIdKey]) {
        return { depth: 1, maxDepth: 1, minDepth: 1, [parentIdKey]: highestIntersectionItem[parentIdKey] };
      }
    }

    const parentId = getParentId(intersections, depth, items, propertyNames);
    const parentItem = items.find(({ id }) => id === parentId);
    if (!parentItem?.[isGroupKey]) return { depth: 0, maxDepth, minDepth, [parentIdKey]: null };

    return { depth, maxDepth, minDepth, [parentIdKey]: parentId };
  } catch (error) {
    console.log('SortableTree projection error:', error);
    return { depth: 0, maxDepth: 1, minDepth: 0, [parentIdKey]: null };
  }
}

function getParentId(intersections, depth, items, propertyNames) {
  const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;

  if (depth < 1) return null;
  // If over item is a group or a part of group and intersection with overItem is the highest, set parent as the group
  const highestIntersection = intersections?.[0];
  const highestIntersectionId = highestIntersection?.[0];

  const highestIntersectionItem = items.find(({ id }) => id === highestIntersectionId);
  if (highestIntersectionItem?.[isGroupKey]) {
    return highestIntersectionItem.id;
  }
  if (highestIntersectionItem?.[parentIdKey]) {
    return highestIntersectionItem[parentIdKey];
  }

  return null;
}

function getMinDepth({ nextItem }) {
  if (nextItem) {
    return nextItem.depth;
  }
  return 0;
}

function flatten(items, parentId = null, depth = 0, seenIds = new Set(), propertyNames = DEFAULT_PROPERTY_NAMES) {
  const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;

  return items.reduce((acc, item, index) => {
    // Skip if we've already seen this ID (prevents infinite loops and duplicates)
    if (seenIds.has(item.id)) {
      return acc;
    }
    seenIds.add(item.id);

    const flatItem = { ...item, [parentIdKey]: parentId, depth, index };
    // Only flatten children if the item is a group
    const children =
      item[isGroupKey] && item.children ? flatten(item.children, item.id, depth + 1, seenIds, propertyNames) : [];
    return [...acc, flatItem, ...children];
  }, []);
}

export function flattenTree(items, propertyNames = DEFAULT_PROPERTY_NAMES) {
  return flatten(items, null, 0, new Set(), propertyNames);
}

export function buildTree(flattenedItems, propertyNames = DEFAULT_PROPERTY_NAMES) {
  const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;

  const root = { id: 'root', children: [] };
  const nodes = { [root.id]: root };
  const addedIds = new Set(); // Track which IDs have been added to prevent duplicates

  // Initialize ALL items with children array
  const items = flattenedItems.map((item) => ({
    ...item,
    children: [],
  }));

  for (const item of items) {
    const { id } = item;

    // Skip if this ID was already processed (prevents duplicates)
    if (addedIds.has(id)) {
      continue;
    }
    addedIds.add(id);

    const parentId = item[parentIdKey] ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    // Store ALL items in nodes
    nodes[id] = { id, children: item.children };

    // Add to parent's children, or to root if parent doesn't exist/have children
    if (parent?.children) {
      parent.children.push(item);
    } else {
      // Fallback: add to root if parent is invalid
      root.children.push(item);
    }
  }

  // Clean up: remove children array from non-group items
  const cleanupChildren = (items) => {
    return items.map((item) => {
      if (item[isGroupKey]) {
        item.children = cleanupChildren(item.children || []);
      } else {
        delete item.children;
      }
      return item;
    });
  };

  return cleanupChildren(root.children);
}

export function findItem(items, itemId) {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(items, itemId, propertyNames = DEFAULT_PROPERTY_NAMES) {
  const { isGroup: isGroupKey } = propertyNames;

  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children?.length) {
      const child = findItemDeep(children, itemId, propertyNames);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

export function removeItem(items, id, propertyNames = DEFAULT_PROPERTY_NAMES) {
  const newItems = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children?.length) {
      item.children = removeItem(item.children, id, propertyNames);
    }

    newItems.push(item);
  }

  return newItems;
}

export function setProperty(items, id, property, setter) {
  for (const item of items) {
    if (item.id === id) {
      item[property] = setter(item[property]);
      continue;
    }

    if (item.children?.length) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function countChildren(items, count = 0) {
  return items.reduce((acc, { children }) => {
    if (children?.length) {
      return countChildren(children, acc + 1);
    }
    return acc + 1;
  }, count);
}

export function getChildCount(items, id, propertyNames = DEFAULT_PROPERTY_NAMES) {
  const item = findItemDeep(items, id, propertyNames);
  return item ? countChildren(item.children || []) : 0;
}

export function removeChildrenOf(items, ids, propertyNames = DEFAULT_PROPERTY_NAMES) {
  const { parentId: parentIdKey } = propertyNames;
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item[parentIdKey] && excludeParentIds.includes(item[parentIdKey])) {
      if (item.children?.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }
    return true;
  });
}
