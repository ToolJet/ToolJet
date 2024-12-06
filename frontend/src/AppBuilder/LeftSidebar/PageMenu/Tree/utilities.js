import { arrayMove } from '@dnd-kit/sortable';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset, indentationWidth) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(items, activeId, overId, dragOffset, indentationWidth) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = Math.min(activeItem.depth + dragDepth, 1); // Ensure max depth is 1
  const maxDepth = 1; // Set max depth to 1
  const minDepth = getMinDepth({ nextItem });
  const overItem = items[overItemIndex];
  let depth = projectedDepth;

  // Prevent nesting of an element if it is a parent (isParent)
  if (activeItem.isPageGroup) {
    depth = 0; // Reset depth to 0 (root level)
  } else {
    if (projectedDepth > maxDepth) {
      depth = maxDepth;
    } else if (projectedDepth < minDepth) {
      depth = minDepth;
    }
  }
  const pageGroupId = getParentId();
  const parentItem = items.find(({ id }) => id === pageGroupId);
  if (!parentItem?.isPageGroup) return { depth: 0, maxDepth, minDepth, pageGroupId: null };
  return { depth, maxDepth, minDepth, pageGroupId };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.pageGroupId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.pageGroupId;

    return newParent ?? null;
  }
}

function getMinDepth({ nextItem }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

function flatten(items, pageGroupId = null, depth = 0) {
  return items.reduce((acc, item, index) => {
    return [...acc, { ...item, pageGroupId, depth, index }, ...flatten(item.children, item.id, depth + 1)];
  }, []);
}

export function flattenTree(items) {
  return flatten(items);
}

export function buildTree(flattenedItems) {
  const root = { id: 'root', children: [] };
  const nodes = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const pageGroupId = item.pageGroupId ?? root.id;
    const parent = nodes[pageGroupId] ?? findItem(items, pageGroupId);

    nodes[id] = { id, children };
    parent?.children?.push(item);
  }

  return root.children;
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

    if (children.length) {
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

    if (item.children.length) {
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

    if (item.children.length) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function countChildren(items, count = 0) {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(items, id) {
  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf(items, ids) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.pageGroupId && excludeParentIds.includes(item.pageGroupId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}
