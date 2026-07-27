export const isItemVisible = (item) =>
  typeof item.visible === 'object' ? item.visible.value !== '{{true}}' : item.visible !== true;

export const isItemDisabled = (item) =>
  typeof item.disable === 'object'
    ? item.disable.value === '{{true}}' || item.disable.value === true
    : item.disable === true;

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
