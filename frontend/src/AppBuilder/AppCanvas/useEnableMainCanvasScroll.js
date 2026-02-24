import { useState, useEffect, useRef } from 'react';

// It is used to show the scrollbar of the main canvas only when the user is scrolling
export default function useEnableMainCanvasScroll({ canvasContentRef }) {
  const scrollTimeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 600);
    };

    const element = canvasContentRef.current;

    if (!element) return;

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [canvasContentRef]);

  return isScrolling;
}
