import React, { useRef } from 'react';
import { Viewer } from '../Viewer';

export const Module = function Module({ component, width, id, removeComponent, containerProps }) {
  const parentRef = useRef(null);

  return (
    <div ref={parentRef}>
      <Viewer />
    </div>
  );
};
