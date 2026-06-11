import { useEffect, useRef } from 'react';

function usePopoverObserver(containerRef, triggerRef, popoverRef, show, onShow, onHide, threshold = 0.5) {
  const prevShow = useRef(false);

  // Refs so the effect never re-runs due to caller passing new function references each render.
  const onShowRef = useRef(onShow);
  const onHideRef = useRef(onHide);
  onShowRef.current = onShow;
  onHideRef.current = onHide;

  useEffect(() => {
    // Check if it is a ref or a DOM element
    const container = containerRef?.current !== undefined ? containerRef.current : containerRef;
    const trigger = triggerRef?.current !== undefined ? triggerRef.current : triggerRef;
    const popover = popoverRef?.current !== undefined ? popoverRef.current : popoverRef;

    if (!container || !trigger) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (prevShow.current) {
            onShowRef.current();
            prevShow.current = false;
          }
        } else if (show) {
          onHideRef.current();
          prevShow.current = true;
        }
      },
      { root: container, threshold: [threshold] }
    );

    observer.observe(trigger);

    const handleOutsideClick = (event) => {
      if (popover && !popover.contains(event.target) && prevShow.current) {
        prevShow.current = false;
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      observer.unobserve(trigger);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [containerRef, triggerRef, popoverRef, show, threshold]); // onShow/onHide removed from deps
}

export default usePopoverObserver;
