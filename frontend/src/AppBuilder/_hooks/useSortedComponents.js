import { useMemo, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const useSortedComponents = (components, currentLayout, id, moduleId) => {
  const getCurrentPageComponents = useStore((state) => state.getCurrentPageComponents, shallow);
  // Only subscribe to reorderContainerChildren when it's relevant to this specific container
  const reorderContainerChildren = useStore((state) => {
    const { containerId, triggerUpdate } = state.reorderContainerChildren;
    // Only return an updated trigger when this specific container is being reordered
    // Return a stable value for other containers to prevent unnecessary re-renders
    if (containerId === id && moduleId === 'canvas') {
      return { triggerUpdate, containerId, shouldReorder: true };
    }
    return { triggerUpdate: 0, containerId: null, shouldReorder: false };
  }, shallow);

  const prevForceUpdateRef = useRef(0);
  const prevComponentsOrder = useRef(components);

  // Function to sort the components based on position in container for tab navigation
  const sortedComponents = useMemo(() => {
    const { triggerUpdate, shouldReorder } = reorderContainerChildren;

    // Always recalculate if components array has changed (new component added/removed)
    const componentsChanged =
      prevComponentsOrder.current.length !== components.length ||
      !components.every((comp) => prevComponentsOrder.current.includes(comp));

    // If a forced update occurred for this container, recalculate order
    const isForcedUpdate = prevForceUpdateRef.current !== triggerUpdate;
    if (isForcedUpdate) {
      prevForceUpdateRef.current = triggerUpdate;
    }

    // Skip recalculation only if:
    // 1. This container is not the target of reorder
    // 2. Components haven't changed
    // 3. No forced update occurred
    if (!shouldReorder && !componentsChanged && !isForcedUpdate) {
      return prevComponentsOrder.current;
    }

    const currentPageComponents = getCurrentPageComponents();

    const newComponentsOrder = [...components].sort((a, b) => {
      const aTop = currentPageComponents?.[a]?.layouts?.[currentLayout]?.top;
      const bTop = currentPageComponents?.[b]?.layouts?.[currentLayout]?.top;
      if (aTop !== bTop) {
        return aTop - bTop;
      } else {
        const aLeft = currentPageComponents?.[a]?.layouts?.[currentLayout]?.left;
        const bLeft = currentPageComponents?.[b]?.layouts?.[currentLayout]?.left;
        if (aLeft !== bLeft) {
          return aLeft - bLeft;
        }
        return 0;
      }
    });

    prevComponentsOrder.current = newComponentsOrder;
    return newComponentsOrder;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, currentLayout, reorderContainerChildren.triggerUpdate, reorderContainerChildren.shouldReorder]);

  return sortedComponents;
};

export default useSortedComponents;
