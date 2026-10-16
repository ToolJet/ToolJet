import { useLayoutEffect, useState } from 'react';

/** An element's content size, kept current with a ResizeObserver; { width: 0, height: 0 } until measured. */
export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
