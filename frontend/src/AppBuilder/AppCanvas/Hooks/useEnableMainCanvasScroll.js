import { useEffect, useRef } from 'react';

// How long the scrollbar stays visible after the last scroll event.
export const SCROLLBAR_HIDE_DELAY_MS = 600;

// It is used to show the scrollbar of the main canvas only when the user is scrolling
// Uses direct DOM manipulation to avoid React re-renders which cause icon flickering
export default function useEnableMainCanvasScroll({ canvasContentRef, enabled = true }) {
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const element = canvasContentRef.current;

    if (!element || !enabled) return;

    const handleScroll = () => {
      // Remove scrollbar-hidden class to show scrollbar
      element.classList.remove('scrollbar-hidden');

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        // Add scrollbar-hidden class to hide scrollbar
        element.classList.add('scrollbar-hidden');
      }, SCROLLBAR_HIDE_DELAY_MS);
    };

    // Initially hide the scrollbar
    element.classList.add('scrollbar-hidden');

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      element.classList.remove('scrollbar-hidden');
    };
  }, [canvasContentRef, enabled]);
}
