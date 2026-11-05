// Does one of these components sit in the list's records (nested included, header excluded)?
export const hasComponentInRecords = (state, componentIds, listviewId, moduleId) => {
  const headerId = `${listviewId}-header`;
  return componentIds.some((componentId) => {
    let parent = componentId && state.getComponentDefinition?.(componentId, moduleId)?.component?.parent;
    for (let depth = 0; parent && depth < 20; depth += 1) {
      if (parent === headerId) return false;
      if (parent === listviewId || parent.startsWith(`${listviewId}-`)) return true;
      // A slot or tab canvas id is its owner's id plus a suffix.
      const owner = state.getComponentDefinition?.(parent, moduleId)
        ? parent
        : parent.slice(0, Math.max(0, parent.lastIndexOf('-')));
      parent = state.getComponentDefinition?.(owner, moduleId)?.component?.parent;
    }
    return false;
  });
};

export const isMovingInListview = (state, listviewId, moduleId) => {
  const moving = [state.draggingComponentId, state.resizingComponentId];
  if (state.isGroupDragging || state.isGroupResizing) moving.push(...state.selectedComponents);
  return hasComponentInRecords(state, moving, listviewId, moduleId);
};

export const isSelectedInListview = (state, listviewId, moduleId) =>
  hasComponentInRecords(state, state.selectedComponents, listviewId, moduleId);

// A disabled record 1 locks the shared template: a locked child may be looked at and selected, not changed.
export const isInLockedRecord = (state, componentIds) =>
  Object.entries(state.lockedListviews ?? {}).some(([listviewId, moduleId]) =>
    hasComponentInRecords(state, componentIds, listviewId, moduleId)
  );

export const isLockedCanvas = (state, canvasId) =>
  !!canvasId && (!!state.lockedListviews?.[canvasId] || isInLockedRecord(state, [canvasId]));
