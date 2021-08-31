import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences, getParsedValue } from '@/_helpers/utils';

export const Container = function Container({
  id,
  component,
  height,
  containerProps,
  width,
  currentState,
  removeComponent
}) {

  const backgroundColor = component.definition.styles.backgroundColor.value;
  const widgetVisibility = component.definition.styles?.visibility?.value || true;
  const disableState = component.definition.styles?.disableState?.value || false;

  const parsedDisableState = typeof disableState !== 'boolean' ? getParsedValue(resolveReferences, disableState, currentState) : disableState;

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
    <div disabled={parsedDisableState} className="jet-container" ref={parentRef} onClick={() => containerProps.onComponentClick(id, component)} style={computedStyles}>
            <SubContainer
              parent={id}
              {...containerProps}
              parentRef={parentRef}
              removeComponent={removeComponent}
            />
            <SubCustomDragLayer 
              parent={id}
              parentRef={parentRef}
              currentLayout={containerProps.currentLayout}
            />
    </div>
  );
};
