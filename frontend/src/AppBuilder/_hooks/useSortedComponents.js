import { useMemo, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const useSortedComponents = (components, currentLayout, id) => {
  const getCurrentPageComponents = useStore((state) => state.getCurrentPageComponents, shallow);
  const reorderContainerChildren = useStore((state) => state.reorderContainerChildren, shallow);
  const prevForceUpdateRef = useRef(0);
  const prevComponentsOrder = useRef(components);

  // Function to sort the components based on position in container for tab navigation
  const sortedComponents = useMemo(() => {
    const { triggerUpdate, containerId } = reorderContainerChildren;

    // If a forced update occurred for a different container, return the previous order
    const isForcedUpdate = prevForceUpdateRef.current !== triggerUpdate;
    if (isForcedUpdate) {
      prevForceUpdateRef.current = triggerUpdate;
      if (containerId !== id) {
        return prevComponentsOrder.current;
      }
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
  }, [components, currentLayout, reorderContainerChildren.triggerUpdate, id]);

  return sortedComponents;
};

export default useSortedComponents;
