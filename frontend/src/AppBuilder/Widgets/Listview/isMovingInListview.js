// True while a dragged or resized component (or a group selection) sits in the list's records, not its header.
export const isMovingInListview = (state, listviewId, moduleId) => {
  const moving = [state.draggingComponentId, state.resizingComponentId];
  if (state.isGroupDragging || state.isGroupResizing) moving.push(...state.selectedComponents);
  const headerId = `${listviewId}-header`;
  return moving.some((componentId) => {
    let parent = state.getComponentDefinition?.(componentId, moduleId)?.component?.parent;
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
