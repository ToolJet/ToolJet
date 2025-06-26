import { useEffect, useState } from 'react';
import { findHighestLevelofSelection } from '../gridUtils';
import { useGridStore } from '@/_stores/gridStore';

export const useElementGudelines = (
  boxList,
  selectedComponents,
  draggingComponentId,
  resizingComponentId,
  dragParentId,
  getResolvedValue,
  virtualTarget
) => {
  const [elementGuidelines, setElementGuidelines] = useState([]);

  // Get current drag canvas ID from store instead of drag layer
  const currentDragCanvasId = useGridStore((state) => state.currentDragCanvasId);

  useEffect(() => {
    const selectedSet = new Set(selectedComponents);
    const draggingOrResizingId = draggingComponentId || resizingComponentId;
    const isGrouped = findHighestLevelofSelection().length > 1;
    const firstSelectedParent =
      selectedComponents.length > 0 ? boxList.find((b) => b.id === selectedComponents[0])?.parent : null;
    const selectedParent = dragParentId || firstSelectedParent;

    const guidelines = boxList
      .filter((box) => {
        const isVisible =
          getResolvedValue(box?.component?.definition?.properties?.visibility?.value) ||
          getResolvedValue(box?.component?.definition?.styles?.visibility?.value);

        // Early return for non-visible elements
        if (!isVisible) return false;

        // This block is for first time drop using react-dnd
        if (virtualTarget && currentDragCanvasId !== null) {
          // For main canvas (id = 'canvas'), show components with no parent or parent = 'canvas'
          if (currentDragCanvasId === 'canvas') {
            if (box.parent && box.parent !== 'canvas') return false;
          } else {
            // For sub-containers, only show components whose parent matches the canvasId
            if (box.parent !== currentDragCanvasId) return false;
          }
        }

        if (isGrouped) {
          // If component is selected, don't show its guidelines
          if (selectedSet.has(box.id)) return false;
          return selectedParent ? box.parent === selectedParent : !box.parent;
        }

        if (draggingOrResizingId) {
          if (box.id === draggingOrResizingId) return false;
          return dragParentId ? box.parent === dragParentId : !box.parent;
        }

        return true;
      })
      .map((box) => `.ele-${box.id}`);

    setElementGuidelines(guidelines);
  }, [
    boxList,
    dragParentId,
    draggingComponentId,
    resizingComponentId,
    selectedComponents,
    getResolvedValue,
    currentDragCanvasId,
    virtualTarget,
  ]);

  return { elementGuidelines };
};
