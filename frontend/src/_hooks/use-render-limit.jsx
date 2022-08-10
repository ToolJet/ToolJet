import React from 'react';

export const useRenderLimit = (limit, dep = undefined) => {
  const [renderCount, setRenderCount] = React.useState(0);
  React.useEffect(() => {
    if (renderCount < limit) {
      setRenderCount(renderCount + 1);
    }
  }, [dep]);
  return renderCount;
};
