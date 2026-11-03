import { RefObject, useLayoutEffect, useState } from 'react';

// The width a pack gives an element it lays out (a slot, a list row in a grid cell, a kanban card): the ToolJet
// canvas inside divides this into its columns, so it is measured, not derived from the widget's width. A hidden
// element (closed section, inactive tab) measures 0: the last real width is kept, so its components are not laid
// out at zero width, and they are laid out again when it is shown.
export const useMeasuredWidth = (ref: RefObject<HTMLElement>): number | undefined => {
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};
