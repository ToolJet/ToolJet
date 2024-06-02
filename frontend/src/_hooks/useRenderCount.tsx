import { useRef, useEffect } from 'react';

function useRenderCount(componentName: string) {
  const renderCountRef = useRef(0);

  renderCountRef.current++;

  useEffect(() => {
    console.log(`${componentName} rendered: ${renderCountRef.current} times`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderCountRef.current, componentName]);

  return renderCountRef.current;
}

export default useRenderCount;
