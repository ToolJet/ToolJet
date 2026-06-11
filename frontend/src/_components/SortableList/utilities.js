import { arrayMove } from '@dnd-kit/sortable';

function getDragDepth(offset, indentationWidth) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(items, activeId, overId, dragOffset, indentationWidth) {
  let overItemIndex = -1,
    activeItemIndex = -1;

  for (let i = 0; i < items.length; i++) {
    if (items[i].id === overId) {
      overItemIndex = i;
    }
    if (items[i].id === activeId) {
      activeItemIndex = i;
    }
  }

  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const overItem = newItems[overItemIndex];
  if (!overItem.isPageGroup) {
    return { depth: 0, maxDepth: 0, minDepth: 0, pageGroupId: null };
  }
  let maxDepth = getMaxDepth({ previousItem });
  let minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  if (activeItem.isPageGroup) {
    depth = 0;
  } else if (activeItem.children.length > 0) {
    depth = 0;
  }

  if (depth > 1) {
    depth = 1;
  }

  const pageGroupId = getParentId();
  const parentItem = findItem(items, pageGroupId);

  // Ensure the parent item is a valid pageGroup
  if (parentItem && parentItem.isPageGroup) {
    return { depth, maxDepth, minDepth, pageGroupId };
  } else {
    return { depth: 0, maxDepth, minDepth, pageGroupId: null };
  }

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth && previousItem.isPageGroup) {
      return previousItem.pageGroupId;
    }

    if (depth > previousItem.depth && previousItem.isPageGroup) {
      return previousItem.id;
    }

    let newParent = null;
    for (let i = overItemIndex - 1; i >= 0; i--) {
      if (newItems[i].depth === depth && newItems[i].isPageGroup) {
        newParent = newItems[i].pageGroupId;
        break;
      }
    }
    return newParent ?? null;
  }
}

function getMaxDepth({ previousItem }) {
  if (previousItem) {
    return previousItem.depth + 1;
  }

  return 0;
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
  console.log(flattenedItems, 'flattenedItems');
  const root = { id: 'root', children: [] };
  const nodes = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const pageGroupId = item.pageGroupId ?? root.id;
    let parent = nodes[pageGroupId];

    if (!parent) {
      // If parent is not found, add the item as a standalone under root
      parent = root;
    }

    nodes[id] = { id, children };
    parent.children.push(item);
  }

  // Add placeholder to page groups with no children
  for (const item of items) {
    if (item.isPageGroup && item.children.length === 0) {
      item.children.push({ id: `${item.id}-placeholder`, name: 'placeholder' });
    }
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
