import { useRef, useEffect } from 'react';

function useRenderCount(componentName) {
  const renderCountRef = useRef(0);

  useEffect(() => {
    return () => {
      console.log(`--Component ${componentName} rendered unmounting ${renderCountRef.current} times.`);
    };
  }, []);

  renderCountRef.current++;

  console.log(`CountingRender- Component ${componentName} rendered ${renderCountRef.current} times.`);
  //   return renderCountRef.current;
}

export default useRenderCount;
