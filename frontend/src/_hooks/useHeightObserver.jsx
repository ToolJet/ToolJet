import { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';

export const useHeightObserver = (ref, dynamicHeight = false, id) => {
  const [offsetHeight, setOffsetHeight] = useState(0);
  const isResizing = useStore((state) => state.resizingComponentId === id);

  useEffect(() => {
    if (!ref?.current || !dynamicHeight || isResizing) return;

    const element = ref.current;

    // Set initial height
    setOffsetHeight(element.offsetHeight);

    // Create ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      setOffsetHeight(element.offsetHeight);
    });

    // Observe the element
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, dynamicHeight, isResizing]);

  return offsetHeight;
};
