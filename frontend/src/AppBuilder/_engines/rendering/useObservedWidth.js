import { useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

/**
 * The width of the element in `ref` (its border box, as getBoundingClientRect() gives it), or 0 while there is none.
 *
 * Reading an element's size right after the page changed lays out the whole page first: one widget doing it in render
 * or an effect costs little, a page of thousands mounting a batch at a time paid a full layout per batch. A
 * ResizeObserver hands over the size once the browser has laid out anyway, and only when it changed. One observer
 * serves every element, and the widths it reports at once update in one render.
 */
const setters = new Map();
let observer = null;

const observe = (element, setWidth) => {
  observer ??= new ResizeObserver((entries) =>
    unstable_batchedUpdates(() => {
      for (const entry of entries) {
        const box = entry.borderBoxSize?.[0];
        const width = box ? box.inlineSize : entry.target.getBoundingClientRect().width;
        setters.get(entry.target)?.forEach((setWidth) => setWidth(width));
      }
    })
  );
  // Several hooks can watch one element: each keeps its setter, and it is unobserved when the last one leaves.
  if (!setters.has(element)) {
    setters.set(element, new Set());
    observer.observe(element);
  }
  setters.get(element).add(setWidth);
};

const unobserve = (element, setWidth) => {
  const watching = setters.get(element);
  watching?.delete(setWidth);
  if (watching?.size) return;
  setters.delete(element);
  observer?.unobserve(element);
};

export function useObservedWidth(ref) {
  const [width, setWidth] = useState(0);
  const observed = useRef(null);

  // The element can come and go with any render (an object ref re-renders nothing): follow it after each one.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const element = ref.current ?? null;
    if (typeof ResizeObserver === 'undefined') {
      setWidth(element ? element.getBoundingClientRect().width : 0);
      return;
    }
    if (element === observed.current) return;
    if (observed.current) unobserve(observed.current, setWidth);
    observed.current = element;
    if (element) observe(element, setWidth);
    else setWidth(0);
  });

  useEffect(() => {
    const last = observed;
    return () => {
      if (last.current) unobserve(last.current, setWidth);
      last.current = null; // a remount (StrictMode, Activity) observes it again
    };
  }, []);

  return width;
}
