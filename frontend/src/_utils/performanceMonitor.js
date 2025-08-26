import { useEffect, useRef } from 'react';

export const measureRenderPerformance = (componentName, testDuration = 5000) => {
  const startTime = Date.now();
  let renderCount = 0;

  const Component = () => {
    renderCount++;
    useEffect(() => {
      if (Date.now() - startTime > testDuration) {
        console.log(`${componentName} Performance:`, {
          totalRenders: renderCount,
          rendersPerSecond: (renderCount / (testDuration / 1000)).toFixed(2),
        });
      }
    });

    return null;
  };

  return Component;
};

export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
};
