import { useEffect, useRef } from 'react';

function usePopoverObserver(containerRef, triggerRef, popoverRef, show, onShow, onHide, threshold = 0.5) {
  const prevShow = useRef(false);

  // Check if it is a ref or a DOM element
  const container = containerRef?.current ? containerRef.current : containerRef;
  const trigger = triggerRef?.current ? triggerRef.current : triggerRef;
  const popover = popoverRef?.current ? popoverRef.current : popoverRef;

  useEffect(() => {
    if (!container || !trigger) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (prevShow.current) {
            onShow();
            prevShow.current = false;
          }
        } else if (show) {
          onHide();
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
  }, [containerRef, triggerRef, popoverRef, show, onShow, onHide, threshold]);
}

export default usePopoverObserver;
