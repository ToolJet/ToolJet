import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

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
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState = typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

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
    <div data-disabled={parsedDisabledState} className="jet-container" ref={parentRef} onClick={() => containerProps.onComponentClick(id, component)} style={computedStyles}>
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
