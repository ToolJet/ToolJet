import { useRef, useEffect } from 'react';

function useRenderCount(componentName, options = {}) {
  const renderCountRef = useRef(0);

  renderCountRef.current++;

  useEffect(() => {
    console.log(`here--- ${componentName} rendered: ${renderCountRef.current} times `, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderCountRef.current, componentName]);

  return renderCountRef.current;
}

export default useRenderCount;
