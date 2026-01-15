import { useState, useEffect, useRef } from 'react';

// It is used to show the scrollbar of the main canvas only when the user is scrolling
export default function useEnableMainCanvasScroll({ canvasContentRef, scrollTopRef }) {
  const scrollTimeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const element = canvasContentRef.current;
    if (!element) return;

    const handleScroll = () => {
      scrollTopRef.current = element.scrollTop;
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 600);
    };

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [canvasContentRef, scrollTopRef]);

  return isScrolling;
}
