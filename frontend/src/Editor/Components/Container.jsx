import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';

export const Container = function Container({
  id,
  component,
  width,
  height,
  containerProps,
  removeComponent,
  styles,
  darkMode,
  dataCy,
}) {
  const { visibility, disabledState, borderRadius, borderColor } = styles;
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: visibility ? 'flex' : 'none',
    overflow: 'hidden auto',
    position: 'relative',
  };

  const parentRef = useRef(null);

  return (
    <div
      data-disabled={disabledState}
      className="jet-container"
      id={id}
      data-cy={dataCy}
      ref={parentRef}
      style={computedStyles}
      onClick={(e) => {
        if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index when container element is clicked
    >
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
