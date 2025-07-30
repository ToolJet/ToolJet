import { useEffect, useState } from 'react';
import { findHighestLevelofSelection } from '../gridUtils';
// Smart guideline optimization function
const optimizeGuidelines = (guidelines, boxList) => {
  if (guidelines.length <= 30) return guidelines; // No optimization needed for small sets
  const TOLERANCE = 2; // pixels tolerance for considering positions "same"
  const guidlineData = [];
  // Get position data for each guideline
  guidelines.forEach((selector) => {
    const element = document.querySelector(selector);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const boxId = selector.replace('.ele-', '');
    const box = boxList.find((b) => b.id === boxId);
    guidlineData.push({
      selector,
      id: boxId,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      area: rect.width * rect.height,
      componentType: box?.component?.component || 'unknown',
    });
  });
  // Group guidelines by similar positions
  const positionGroups = {
    left: new Map(),
    right: new Map(),
    top: new Map(),
    bottom: new Map(),
    centerX: new Map(),
    centerY: new Map(),
  };
  // Group by similar position values
  guidlineData.forEach((item) => {
    ['left', 'right', 'top', 'bottom', 'centerX', 'centerY'].forEach((pos) => {
      const value = Math.round(item[pos] / TOLERANCE) * TOLERANCE;
      if (!positionGroups[pos].has(value)) {
        positionGroups[pos].set(value, []);
      }
      positionGroups[pos].get(value).push(item);
    });
  });
  // Select best representative from each group
  const selectedGuidelines = new Set();
  Object.values(positionGroups).forEach((positionMap) => {
    positionMap.forEach((group) => {
      if (group.length === 1) {
        selectedGuidelines.add(group[0].selector);
      } else {
        // For groups with multiple items, select the best representative
        const best = group.reduce((prev, current) => {
          // Priority: larger components, certain component types, then by area
          const prevPriority = getComponentPriority(prev);
          const currentPriority = getComponentPriority(current);
          if (prevPriority !== currentPriority) {
            return prevPriority > currentPriority ? prev : current;
          }
          // If same priority, prefer larger area
          return prev.area > current.area ? prev : current;
        });
        selectedGuidelines.add(best.selector);
      }
    });
  });
  // Convert back to array and ensure we have key guidelines
  let optimized = Array.from(selectedGuidelines);
  // If still too many, apply spatial distribution
  if (optimized.length > 50) {
    optimized = applyspatialDistribution(optimized, guidlineData, 50);
  }
  return optimized;
};
// Priority function for component types and characteristics
const getComponentPriority = (item) => {
  // Higher priority for certain component types
  const highPriorityTypes = [];
  const mediumPriorityTypes = [];
  if (highPriorityTypes.includes(item.componentType)) return 3;
  if (mediumPriorityTypes.includes(item.componentType)) return 2;
  // Prefer larger components
  if (item.area > 10000) return 2;
  if (item.area > 5000) return 1;
  return 0;
};
// Spatial distribution to ensure guidelines are spread across the canvas
const applyspatialDistribution = (selectors, guidlineData, maxCount) => {
  const dataMap = new Map(guidlineData.map((item) => [item.selector, item]));
  const items = selectors.map((selector) => dataMap.get(selector)).filter(Boolean);
  // Sort by area (prefer larger components)
  items.sort((a, b) => b.area - a.area);
  const selected = [];
  const SPATIAL_TOLERANCE = 50; // minimum distance between guidelines
  items.forEach((item) => {
    if (selected.length >= maxCount) return;
    // Check if this item is too close to already selected items
    const tooClose = selected.some((selectedItem) => {
      const distance = Math.sqrt(
        Math.pow(item.centerX - selectedItem.centerX, 2) + Math.pow(item.centerY - selectedItem.centerY, 2)
      );
      return distance < SPATIAL_TOLERANCE;
    });
    if (!tooClose) {
      selected.push(item);
    }
  });
  return selected.map((item) => item.selector);
};
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
        return true;
      })
      .map((box) => `.ele-${box.id}`)
      .filter((selector) => {
        // Check if element is visible in viewport
        const element = document.querySelector(selector);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        // Check if element is within viewport bounds
        return rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
      });
    // Smart guideline optimization - deduplicate and prioritize
    const optimizedGuidelines = optimizeGuidelines(guidelines, boxList);
    setElementGuidelines(optimizedGuidelines);
  }, [boxList, selectedComponents, getResolvedValue, virtualTarget]);
  return elementGuidelines;
};
