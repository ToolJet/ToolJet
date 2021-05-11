import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';

export const Container = function Container({
  id,
  component,
  height,
  containerProps,
  width
}) {

  const backgroundColor = component.definition.styles.backgroundColor.value;

  const computedStyles = {
    backgroundColor,
    width,
    height
  };

  const parentRef = useRef(null);

  return (
    <div className="jet-container" ref={parentRef} onClick={() => containerProps.onComponentClick(id, component)} style={computedStyles}>
            <SubContainer
              parent={id}
              {...containerProps}
              parentRef={parentRef}
            />
            <SubCustomDragLayer 
              parent={id}
              parentRef={parentRef}
            />
    </div>
  );
};
