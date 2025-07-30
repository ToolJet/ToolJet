import { useEffect, useState } from 'react';
import { findHighestLevelofSelection } from '../gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

function isInViewport(el, root = window) {
  if (!el) return false;

  const elementRect = el.getBoundingClientRect();

  // For scrollable container, check if element is within container's visible area
  const containerRect = root.getBoundingClientRect();

  return (
    elementRect.bottom > containerRect.top && // element bottom below container's visible top
    elementRect.top < containerRect.bottom && // element top above container's visible bottom
    elementRect.right > containerRect.left && // element right right-of container's visible left
    elementRect.left < containerRect.right // element left left-of container's visible right
  );
}
export const useElementGuidelines = (boxList, selectedComponents, getResolvedValue, virtualTarget) => {
  const [elementGuidelines, setElementGuidelines] = useState([]);
  // const draggingComponentId = useStore((state) => state.draggingComponentId, shallow);

  useEffect(() => {
    const selectedSet = new Set(selectedComponents);
    const isGrouped = findHighestLevelofSelection().length > 1;
    const firstSelectedParent =
      selectedComponents.length > 0 ? boxList.find((b) => b.id === selectedComponents[0])?.parent : null;
    const selectedParent = firstSelectedParent;
    const isAnyModalOpen = document.querySelector('#modal-container') ? true : false;

    const guidelines = boxList
      .filter((box) => {
        const isVisible =
          getResolvedValue(box?.component?.definition?.properties?.visibility?.value) ||
          getResolvedValue(box?.component?.definition?.styles?.visibility?.value);

        // Early return for non-visible elements
        if (!isVisible) return false;

        // // If component is selected, don't show its guidelines
        if (!virtualTarget && selectedSet.has(box.id)) return false;

        // If component is a child of the dragging component, don't show its guidelines
        // if (box.parent?.slice(0, 36) === draggingComponentId?.slice(0, 36)) return false;

        // Don't show guidelines for components which are outside the modal specially on main canvas
        if (isAnyModalOpen) {
          if (box.parent === 'canvas' || !box.parent) return false;
        }

        if (isGrouped) {
          // If component is selected, don't show its guidelines
          if (selectedSet.has(box.id)) return false;
          return selectedParent ? box.parent === selectedParent : !box.parent;
        }

        const element = document.querySelector(`.ele-${box.id}`);
        const container = document.getElementsByClassName('canvas-content')?.[0];
        if (!element) return false;
        return isInViewport(element, container);
      })
      .map((box) => `.ele-${box.id}`);
    setElementGuidelines(guidelines);
  }, [boxList, selectedComponents, getResolvedValue, virtualTarget]);

  return elementGuidelines;
};
