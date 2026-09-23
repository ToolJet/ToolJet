import { useEffect, useState } from 'react';

export function useContainerWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    setWidth(element.clientWidth);

    const resizeObserver = new ResizeObserver(() => {
      setWidth(element.clientWidth);
    });
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [ref]);

  return width;
}
