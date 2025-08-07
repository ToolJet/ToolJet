import { useEffect, useState } from 'react';
import { findHighestLevelofSelection } from '../gridUtils';

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

// Simple rule: Never filter extremes in any direction (top, bottom, left, right)
function getEssentialElements(boxes, selectedComponentIds = []) {
  if (boxes.length <= 2) {
    return boxes.map((box) => `.ele-${box.id}`);
  }

  const nonSelectedBoxes = boxes.filter((box) => !selectedComponentIds.includes(box.id));

  if (nonSelectedBoxes.length === 0) {
    return [];
  }

  // Find global extremes in all 4 directions
  const minLeft = Math.min(...nonSelectedBoxes.map((box) => box.left));
  const maxRight = Math.max(...nonSelectedBoxes.map((box) => box.left + box.width));
  const minTop = Math.min(...nonSelectedBoxes.map((box) => box.top));
  const maxBottom = Math.max(...nonSelectedBoxes.map((box) => box.top + box.height));

  const essentialElements = new Set();

  // Step 1: Keep global extremes
  nonSelectedBoxes.forEach((box) => {
    const isLeftExtreme = box.left === minLeft;
    const isRightExtreme = box.left + box.width === maxRight;
    const isTopExtreme = box.top === minTop;
    const isBottomExtreme = box.top + box.height === maxBottom;

    if (isLeftExtreme || isRightExtreme || isTopExtreme || isBottomExtreme) {
      essentialElements.add(box.id);
    }
  });

  // Step 2: Keep local extremes for each alignment line

  // For each unique TOP position, keep leftmost and rightmost elements
  const topGroups = new Map();
  nonSelectedBoxes.forEach((box) => {
    if (!topGroups.has(box.top)) topGroups.set(box.top, []);
    topGroups.get(box.top).push(box);
  });

  topGroups.forEach((elements, topPos) => {
    if (elements.length > 1) {
      const minLeft = Math.min(...elements.map((box) => box.left));
      const maxRight = Math.max(...elements.map((box) => box.left + box.width));

      elements.forEach((box) => {
        if (box.left === minLeft || box.left + box.width === maxRight) {
          if (!essentialElements.has(box.id)) {
            essentialElements.add(box.id);
            console.log(`Keeping ${box.component?.name || box.id.slice(-8)} as horizontal extreme for top ${topPos}`);
          }
        }
      });
    }
  });

  // For each unique BOTTOM position, keep leftmost and rightmost elements
  const bottomGroups = new Map();
  nonSelectedBoxes.forEach((box) => {
    const bottom = box.top + box.height;
    if (!bottomGroups.has(bottom)) bottomGroups.set(bottom, []);
    bottomGroups.get(bottom).push(box);
  });

  bottomGroups.forEach((elements, bottomPos) => {
    if (elements.length > 1) {
      const minLeft = Math.min(...elements.map((box) => box.left));
      const maxRight = Math.max(...elements.map((box) => box.left + box.width));

      elements.forEach((box) => {
        if (box.left === minLeft || box.left + box.width === maxRight) {
          if (!essentialElements.has(box.id)) {
            essentialElements.add(box.id);
          }
        }
      });
    }
  });

  const leftGroups = new Map();
  nonSelectedBoxes.forEach((box) => {
    if (!leftGroups.has(box.left)) leftGroups.set(box.left, []);
    leftGroups.get(box.left).push(box);
  });

  leftGroups.forEach((elements, leftPos) => {
    if (elements.length > 1) {
      const minTop = Math.min(...elements.map((box) => box.top));
      const maxBottom = Math.max(...elements.map((box) => box.top + box.height));

      elements.forEach((box) => {
        if (box.top === minTop || box.top + box.height === maxBottom) {
          if (!essentialElements.has(box.id)) {
            essentialElements.add(box.id);
            console.log(`Keeping ${box.component?.name || box.id.slice(-8)} as vertical extreme for left ${leftPos}`);
          }
        }
      });
    }
  });
  // For each unique RIGHT position, keep topmost and bottommost elements

  const rightGroups = new Map();
  nonSelectedBoxes.forEach((box) => {
    const right = box.left + box.width;
    if (!rightGroups.has(right)) rightGroups.set(right, []);
    rightGroups.get(right).push(box);
  });

  rightGroups.forEach((elements, rightPos) => {
    if (elements.length > 1) {
      const minTop = Math.min(...elements.map((box) => box.top));
      const maxBottom = Math.max(...elements.map((box) => box.top + box.height));

      elements.forEach((box) => {
        if (box.top === minTop || box.top + box.height === maxBottom) {
          if (!essentialElements.has(box.id)) {
            essentialElements.add(box.id);
            console.log(`Keeping ${box.component?.name || box.id.slice(-8)} as vertical extreme for right ${rightPos}`);
          }
        }
      });
    }
  });

  // For remaining elements, keep those that provide unique alignment opportunities
  const remainingElements = nonSelectedBoxes.filter((box) => !essentialElements.has(box.id));

  // Collect all unique edge positions from kept extremes
  const keptElements = nonSelectedBoxes.filter((box) => essentialElements.has(box.id));
  const keptLeftEdges = new Set(keptElements.map((box) => box.left));
  const keptRightEdges = new Set(keptElements.map((box) => box.left + box.width));
  const keptTopEdges = new Set(keptElements.map((box) => box.top));
  const keptBottomEdges = new Set(keptElements.map((box) => box.top + box.height));

  // Keep remaining elements that provide unique alignment opportunities
  remainingElements.forEach((box) => {
    const providesUniqueLeft = !keptLeftEdges.has(box.left);
    const providesUniqueRight = !keptRightEdges.has(box.left + box.width);
    const providesUniqueTop = !keptTopEdges.has(box.top);
    const providesUniqueBottom = !keptBottomEdges.has(box.top + box.height);

    if (providesUniqueLeft || providesUniqueRight || providesUniqueTop || providesUniqueBottom) {
      essentialElements.add(box.id);
      console.log(`Keeping ${box.component?.name || box.id.slice(-8)} for unique alignment:`, {
        uniqueLeft: providesUniqueLeft,
        uniqueRight: providesUniqueRight,
        uniqueTop: providesUniqueTop,
        uniqueBottom: providesUniqueBottom,
      });

      // Update kept edges
      keptLeftEdges.add(box.left);
      keptRightEdges.add(box.left + box.width);
      keptTopEdges.add(box.top);
      keptBottomEdges.add(box.top + box.height);
    }
  });

  const result = Array.from(essentialElements).map((id) => `.ele-${id}`);

  return result;
}

export const useElementGuidelines = (boxList, selectedComponents, getResolvedValue, virtualTarget) => {
  const [elementGuidelines, setElementGuidelines] = useState([]);

  useEffect(() => {
    const selectedSet = new Set(selectedComponents);
    const isGrouped = findHighestLevelofSelection().length > 1;
    const firstSelectedParent =
      selectedComponents.length > 0 ? boxList.find((b) => b.id === selectedComponents[0])?.parent : null;
    const selectedParent = firstSelectedParent;
    const isAnyModalOpen = document.querySelector('#modal-container') ? true : false;

    const filteredBoxes = boxList.filter((box) => {
      const isVisible =
        getResolvedValue(box?.component?.definition?.properties?.visibility?.value) ||
        getResolvedValue(box?.component?.definition?.styles?.visibility?.value);

      if (!isVisible) return false;
      if (!virtualTarget && selectedSet.has(box.id)) return false;

      if (isAnyModalOpen) {
        if (box.parent === 'canvas' || !box.parent) return false;
      }

      if (isGrouped) {
        if (selectedSet.has(box.id)) return false;
        return selectedParent ? box.parent === selectedParent : !box.parent;
      }

      const element = document.querySelector(`.ele-${box.id}`);
      const container = document.getElementsByClassName('canvas-content')?.[0];
      if (!element) return false;
      return isInViewport(element, container);
    });

    // OPTIMIZATION: Only keep essential elements for guidelines
    const guidelines = getEssentialElements(filteredBoxes, selectedComponents);
    setElementGuidelines(guidelines);
  }, [boxList, selectedComponents, getResolvedValue, virtualTarget]);

  return elementGuidelines;
};
