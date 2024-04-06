import { useRef, useEffect } from 'react';

function useRenderCount(componentName) {
  const renderCountRef = useRef(0);

  renderCountRef.current++;

  return renderCountRef.current;
}

export default useRenderCount;
