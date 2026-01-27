import { arrayMove } from '@dnd-kit/sortable';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset, indentationWidth) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(items, activeId, overId, dragOffset, indentationWidth, intersections) {
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
    if (activeItem.isGroup) {
      return { depth: 0, maxDepth, minDepth, parentId: null };
    }

    let depth = projectedDepth;
    if (projectedDepth > maxDepth) {
      depth = maxDepth;
    } else if (projectedDepth < minDepth) {
      depth = minDepth;
    }

    if (depth < 1 && !activeItem.isGroup) {
      // Check if it is intersecting with a group item
      const highestIntersection = intersections?.[0];
      const highestIntersectionId = highestIntersection?.[0];
      const highestIntersectionItem = items.find(({ id }) => id === highestIntersectionId);
      if (highestIntersectionItem?.parentId) {
        return { depth: 1, maxDepth: 1, minDepth: 1, parentId: highestIntersectionItem.parentId };
      }
    }

    const parentId = getParentId(intersections, depth, items);
    const parentItem = items.find(({ id }) => id === parentId);
    if (!parentItem?.isGroup) return { depth: 0, maxDepth, minDepth, parentId: null };

    return { depth, maxDepth, minDepth, parentId };
  } catch (error) {
    console.log('error', error);
    return { depth: 0, maxDepth: 1, minDepth: 0, parentId: null };
  }
}

function getParentId(intersections, depth, items) {
  if (depth < 1) return null;
  // If over item is a group or a part of group and intersection with overItem is the highest, set parent as the group
  const highestIntersection = intersections?.[0];
  const highestIntersectionId = highestIntersection?.[0];

  const highestIntersectionItem = items.find(({ id }) => id === highestIntersectionId);
  if (highestIntersectionItem?.isGroup) {
    return highestIntersectionItem.id;
  }
  if (highestIntersectionItem?.parentId) {
    return highestIntersectionItem.parentId;
  }

  return null;
}

function getMinDepth({ nextItem }) {
  if (nextItem) {
    return nextItem.depth;
  }
  return 0;
}

function flatten(items, parentId = null, depth = 0, seenIds = new Set()) {
  return items.reduce((acc, item, index) => {
    // Skip if we've already seen this ID (prevents infinite loops and duplicates)
    if (seenIds.has(item.id)) {
      return acc;
    }
    seenIds.add(item.id);

    const flatItem = { ...item, parentId, depth, index };
    // Only flatten children if the item is a group
    const children = item.isGroup && item.children ? flatten(item.children, item.id, depth + 1, seenIds) : [];
    return [...acc, flatItem, ...children];
  }, []);
}

export function flattenTree(items) {
  return flatten(items, null, 0, new Set());
}

export function buildTree(flattenedItems) {
  const root = { id: 'root', children: [] };
  const nodes = { [root.id]: root };
  const addedIds = new Set(); // Track which IDs have been added to prevent duplicates

  // Initialize ALL items with children array (like Pages panel)
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

    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    // Store ALL items in nodes (like Pages panel)
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
      if (item.isGroup) {
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

export function removeChildrenOf(items, ids) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children?.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }
    return true;
  });
}
