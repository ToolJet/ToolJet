import { useRef, useState, useLayoutEffect } from 'react';

function useHeight(on = true) {
  const ref = useRef();
  const [height, set] = useState(0);
  const heightRef = useRef(height);
  const [ro] = useState(
    () =>
      new ResizeObserver(() => {
        if (ref.current && heightRef.current !== ref.current.offsetHeight) {
          heightRef.current = ref.current.offsetHeight;
          set(ref.current.offsetHeight);
        }
      })
  );
  useLayoutEffect(() => {
    if (on && ref.current) {
      set(ref.current.offsetHeight);
      ro.observe(ref.current, {});
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, ref.current]);

  return [ref, height];
}

export { useHeight };

import React, { useState } from 'react';
import useHeight from './use-height-transition';

function ExampleHeightComponent() {
  const [isVisible, setIsVisible] = useState(true);
  const [ref, height] = useHeight(isVisible);

  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible)}>
        Toggle Height
      </button>
      <div
        ref={ref}
        style={{
          height: isVisible ? `${height}px` : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        <p>This is some content that will expand and collapse.</p>
      </div>
    </div>
  );
}

export default ExampleHeightComponent;
