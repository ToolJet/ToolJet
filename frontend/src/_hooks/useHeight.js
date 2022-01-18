import { useState, useEffect, useRef } from 'react';

export default function useHeight(useResizeEventListner) {
  const [height, setHeight] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleResize() {
      setHeight(ref.current.clientHeight);
      console.log(22342423);
    }
    useResizeEventListner && window.addEventListener('resize', handleResize);
    handleResize();

    if (useResizeEventListner) {
      return function cleanupListener() {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  return [ref, height];
}
