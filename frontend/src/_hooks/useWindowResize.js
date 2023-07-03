import { useState, useEffect, useRef } from 'react';

export default () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isResizing, setIsResizing] = useState(false);

  const timeoutRef = useRef(null);

  function handleResize() {
    setIsResizing(true);
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsResizing(false), 250);
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return [windowSize, isResizing];
};
