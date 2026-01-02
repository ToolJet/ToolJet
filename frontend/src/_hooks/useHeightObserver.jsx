import { useEffect, useRef, useState } from 'react';

export const useHeightObserver = (ref, dynamicHeight = false) => {
  const [heightChangeValue, setHeightChangeValue] = useState(Math.random());
  const prevHeight = useRef(null);
  const prevScrollTop = useRef(null);
  const prevScrollHeight = useRef(null);
  const prevClientHeight = useRef(null);

  useEffect(() => {
    if (!ref?.current || !dynamicHeight) return;

    const element = ref.current;

    const checkHeightChange = () => {
      const currentHeight = element.offsetHeight;
      const currentScrollTop = element.scrollTop;
      const currentScrollHeight = element.scrollHeight;
      const currentClientHeight = element.clientHeight;

      // Check if height actually changed (not just scroll)
      const heightChanged = prevHeight.current !== null && prevHeight.current !== currentHeight;

      // Check if scroll position changed but height remained the same
      const scrollChanged = prevScrollTop.current !== null && prevScrollTop.current !== currentScrollTop;

      // Check if scrollable content height changed
      const scrollHeightChanged = prevScrollHeight.current !== null && prevScrollHeight.current !== currentScrollHeight;

      // Check if client height changed
      const clientHeightChanged = prevClientHeight.current !== null && prevClientHeight.current !== currentClientHeight;

      // Only update the random value if actual height changed, not just scroll
      if (heightChanged || (scrollHeightChanged && !scrollChanged)) {
        setHeightChangeValue(Math.random());
      }

      // Update previous values
      prevHeight.current = currentHeight;
      prevScrollTop.current = currentScrollTop;
      prevScrollHeight.current = currentScrollHeight;
      prevClientHeight.current = currentClientHeight;
    };

    // Initial check
    checkHeightChange();

    // Create ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      checkHeightChange();
    });

    // Create MutationObserver to watch for content changes
    const mutationObserver = new MutationObserver(() => {
      checkHeightChange();
    });

    // Observe the element
    resizeObserver.observe(element);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Also listen for scroll events to distinguish between scroll and height changes
    const handleScroll = () => {
      checkHeightChange();
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener('scroll', handleScroll);
    };
  }, [ref, dynamicHeight]);

  return heightChangeValue;
};