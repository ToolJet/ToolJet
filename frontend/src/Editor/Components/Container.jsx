import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences } from '@/_helpers/utils';

export const Container = function Container({
  id,
  component,
  height,
  containerProps,
  width,
  currentState
}) {

  const backgroundColor = component.definition.styles.backgroundColor.value;
  const widgetVisibility = component.definition.styles.visibility.value;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  const computedStyles = {
    backgroundColor,
    width,
    height,
    display: parsedWidgetVisibility ? 'flex' : 'none'
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
              currentLayout={containerProps.currentLayout}
            />
    </div>
  );
};
