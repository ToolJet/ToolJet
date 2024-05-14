import { useEffect, useState } from 'react';

const useMountTransition = (isMounted, unmountDelay) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isMounted && !isTransitioning) {
      setIsTransitioning(true);
    } else if (!isMounted && isTransitioning) {
      timeoutId = setTimeout(() => setIsTransitioning(false), unmountDelay);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [unmountDelay, isMounted, isTransitioning]);

  return isTransitioning;
};

export default useMountTransition;
