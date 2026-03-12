import { arrayMove } from '@dnd-kit/sortable';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

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
  propertyNames = DEFAULT_PROPERTY_NAMES,
  maxDepthLimit = 1
) {
  const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;

  try {
    const overItemIndex = items.findIndex(({ id }) => id === overId);
    const activeItemIndex = items.findIndex(({ id }) => id === activeId);
    const activeItem = items[activeItemIndex];
    const newItems = arrayMove(items, activeItemIndex, overItemIndex);
    const previousItem = newItems[overItemIndex - 1];
    const nextItem = newItems[overItemIndex + 1];
    const dragDepth = getDragDepth(dragOffset, indentationWidth);
    const projectedDepth = activeItem.depth + dragDepth;
    // Max depth: one level deeper than the item above, but capped at limit
    const maxDepth = Math.min(previousItem ? previousItem.depth + 1 : 0, maxDepthLimit);
    const minDepth = getMinDepth({ nextItem });

    // In single-level mode (Navigation), groups always stay at depth 0
    if (maxDepthLimit <= 1 && activeItem[isGroupKey]) {
      return { depth: 0, maxDepth, minDepth, [parentIdKey]: null };
    }

    let depth = projectedDepth;
    if (projectedDepth > maxDepth) {
      depth = maxDepth;
    } else if (projectedDepth < minDepth) {
      depth = minDepth;
    }

    // Ensure depth is never negative
    depth = Math.max(depth, 0);

    if (maxDepthLimit <= 1) {
      // Legacy single-level logic for Navigation
      if (depth < 1 && !activeItem[isGroupKey]) {
        const highestIntersection = intersections?.[0];
        const highestIntersectionId = highestIntersection?.[0];
        const highestIntersectionItem = items.find(({ id }) => id === highestIntersectionId);
        if (highestIntersectionItem?.[parentIdKey]) {
          return { depth: 1, maxDepth: 1, minDepth: 1, [parentIdKey]: highestIntersectionItem[parentIdKey] };
        }
      }

      const parentId = getParentId(intersections, depth, items, isGroupKey, parentIdKey, maxDepthLimit);
      const parentItem = items.find(({ id }) => id === parentId);
      if (!parentItem?.[isGroupKey]) return { depth: 0, maxDepth, minDepth, [parentIdKey]: null };

      return { depth, maxDepth, minDepth, [parentIdKey]: parentId };
    }

    // Multi-level mode: find parentId by walking backwards from the drop position
    const parentId = getParentIdForMultiLevel(newItems, overItemIndex, depth, parentIdKey);
    return { depth, maxDepth, minDepth, [parentIdKey]: parentId };
  } catch (error) {
    console.log('error', error);
    return { depth: 0, maxDepth: maxDepthLimit, minDepth: 0, [parentIdKey]: null };
  }
}

function getParentId(intersections, depth, items, isGroupKey, parentIdKey, _maxDepthLimit = 1) {
  if (depth < 1) return null;
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

// For multi-level nesting: walk backwards from the drop position to find
// the item at (depth - 1) which becomes the parent
function getParentIdForMultiLevel(flatItems, overIndex, depth, _parentIdKey) {
  if (depth <= 0) return null;

  // Walk backwards from the drop position to find the nearest item at depth - 1
  for (let i = overIndex - 1; i >= 0; i--) {
    const item = flatItems[i];
    if (item.depth === depth - 1) {
      return item.id;
    }
    // If we encounter an item at a shallower depth, stop — there's no valid parent
    if (item.depth < depth - 1) {
      return null;
    }
  }

  return null;
}

function getMinDepth({ nextItem }) {
  if (nextItem) {
    return nextItem.depth;
  }
  return 0;
}

function flatten(items, parentIdValue = null, depth = 0, seenIds = new Set(), propertyNames = DEFAULT_PROPERTY_NAMES) {
  const { parentId: parentIdKey } = propertyNames;

  return items.reduce((acc, item) => {
    if (seenIds.has(item.id)) {
      return acc;
    }
    seenIds.add(item.id);

    const flatItem = { ...item, [parentIdKey]: parentIdValue, depth };
    const children = item.children ? flatten(item.children, item.id, depth + 1, seenIds, propertyNames) : [];
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
  const addedIds = new Set();

  const items = flattenedItems.map((item) => ({
    ...item,
    children: [],
  }));

  for (const item of items) {
    const { id } = item;

    if (addedIds.has(id)) {
      continue;
    }
    addedIds.add(id);

    const itemParentId = item[parentIdKey] ?? root.id;
    const parent = nodes[itemParentId] ?? findItem(items, itemParentId);

    nodes[id] = { id, children: item.children };

    if (parent?.children) {
      parent.children.push(item);
    } else {
      root.children.push(item);
    }
  }

  const cleanupChildren = (items) => {
    return items.map((item) => {
      if (item[isGroupKey] || (item.children && item.children.length > 0)) {
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

export function findItemDeep(items, itemId) {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children?.length) {
      const child = findItemDeep(children, itemId);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

export function removeItem(items, id) {
  const newItems = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children?.length) {
      item.children = removeItem(item.children, id);
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

export function getChildCount(items, id) {
  const item = findItemDeep(items, id);
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
