import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const LINE_HEIGHT = 16;

/**
 * The Table's header sits outside the scrolling body, so the body's scrollbar spans only the rows. This keeps the two
 * lined up: the header follows the body's horizontal scroll, leaves room on its right for the body's vertical
 * scrollbar (`gutter`, 0 with overlay scrollbars or when the rows fit), and passes wheel/trackpad scrolling over it on
 * to the body.
 */
export function useSplitHeader(headRef, bodyRef) {
  const [gutter, setGutter] = useState(0);
  const attached = useRef({ head: null, body: null, cleanup: null });

  useLayoutEffect(() => {
    const head = headRef.current ?? null;
    const body = bodyRef.current ?? null;
    const current = attached.current;
    if (head === current.head && body === current.body) return;
    current.cleanup?.();
    current.head = head;
    current.body = body;
    current.cleanup = null;
    if (!head || !body) return;

    const measure = () => setGutter(Math.max(0, body.offsetWidth - body.clientWidth));
    const follow = () => {
      if (head.scrollLeft !== body.scrollLeft) head.scrollLeft = body.scrollLeft;
    };
    const forwardWheel = (event) => {
      const scale = event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? body.clientHeight : 1;
      const dx = event.deltaX * scale;
      const dy = event.deltaY * scale;
      const canX = dx !== 0 && body.scrollWidth > body.clientWidth;
      const canY = dy !== 0 && body.scrollHeight > body.clientHeight;
      if (!canX && !canY) return;
      event.preventDefault();
      body.scrollBy({ left: canX ? dx : 0, top: canY ? dy : 0 });
    };

    // The scrollbar comes and goes with the body's size and the rows' total height (the body's table).
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    // Capture: runs before the row window's own scroll listener renders rows, so reading scrollLeft doesn't force a
    // layout of the page.
    body.addEventListener('scroll', follow, { passive: true, capture: true });
    head.addEventListener('wheel', forwardWheel, { passive: false });
    measure();
    follow();
    current.cleanup = () => {
      observer.disconnect();
      body.removeEventListener('scroll', follow, { capture: true });
      head.removeEventListener('wheel', forwardWheel);
    };
  });

  useEffect(() => () => attached.current.cleanup?.(), []);

  return gutter;
}
