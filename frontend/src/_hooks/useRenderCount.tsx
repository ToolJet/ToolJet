import React from 'react';

function useRenderCount(componentName: string) {
  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    console.log(`${componentName} rendered: ${renderCount} times`);
  }, [renderCount, componentName]); // now both dependencies are trackable by React's effect hook

  React.useEffect(() => {
    setRenderCount((count) => count + 1);
  }, []); // This effect runs once on mount and no more

  return renderCount;
}

export default useRenderCount;
