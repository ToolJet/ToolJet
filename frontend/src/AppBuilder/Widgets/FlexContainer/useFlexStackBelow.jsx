import { useState, useEffect } from 'react';
import { computeShouldStackFlex } from './flexContainer.utils';
import { subscribeMainCanvasWidth } from './realCanvasWidthSubscribe';

/**
 * React hook: stacking flag when main canvas (`#real-canvas`) width is at or below stackBelow threshold.
 */
export function useShouldStackFlexRealCanvas(stackBelow) {
  const [shouldStack, setShouldStack] = useState(() => computeShouldStackFlex(stackBelow));

  useEffect(() => {
    setShouldStack(computeShouldStackFlex(stackBelow));
    return subscribeMainCanvasWidth(() => {
      setShouldStack(computeShouldStackFlex(stackBelow));
    });
  }, [stackBelow]);

  return shouldStack;
}
