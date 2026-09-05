export const isItemVisible = (item) =>
  typeof item.visible === 'object' ? item.visible.value !== '{{true}}' : item.visible !== true;

export const isItemDisabled = (item) =>
  typeof item.disable === 'object'
    ? item.disable.value === '{{true}}' || item.disable.value === true
    : item.disable === true;

// A group is only visible if it isn't hidden itself AND at least one of its children
// is both visible and enabled (mirrors the page/navigation group logic)
export const isGroupVisible = (group) => {
  if (!isItemVisible(group)) return false;
  return (
    Array.isArray(group.children) && group.children.some((child) => isItemVisible(child) && !isItemDisabled(child))
  );
};

export const isMenuItemVisible = (item) => (item.isGroup ? isGroupVisible(item) : isItemVisible(item));

// Recursively replace an item (by id) anywhere in the tree, including inside group children
export const updateItemById = (items, targetId, updater) =>
  items.map((item) => {
    if (item.id === targetId) return updater(item);
    if (item.isGroup && item.children) {
      return { ...item, children: updateItemById(item.children, targetId, updater) };
    }
    return item;
  });

// Helper to find item by ID (including nested items)
export const findItemById = (items, targetId) => {
  for (const item of items) {
    if (item.id === targetId) return item;
    if (item.isGroup && item.children) {
      const found = findItemById(item.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

// Helper to find parent group of an item
export const findParentGroup = (items, targetId) => {
  for (const item of items) {
    if (item.isGroup && item.children) {
      if (item.children.some((child) => child.id === targetId)) {
        return item;
      }
      const found = findParentGroup(item.children, targetId);
      if (found) return found;
    }
  }
  return null;
};
