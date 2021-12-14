import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';

export const Container = function Container({ id, width, height, containerProps, removeComponent, styles }) {
  const { backgroundColor, visibility, disabledState } = styles;

  const computedStyles = {
    backgroundColor,
    height,
    display: visibility ? 'flex' : 'none',
  };

  const parentRef = useRef(null);

  return (
    <div data-disabled={disabledState} className="jet-container" id={id} ref={parentRef} style={computedStyles}>
      <SubContainer
        parentComponent={component}
        containerCanvasWidth={width}
        parent={id}
        {...containerProps}
        parentRef={parentRef}
        removeComponent={removeComponent}
      />
      <SubCustomDragLayer
        containerCanvasWidth={width}
        parent={id}
        parentRef={parentRef}
        currentLayout={containerProps.currentLayout}
      />
    </div>
  );
};
