import React, { useRef } from 'react';
import { SubContainer } from '../SubContainer';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const Listview = function Listview({
  id,
  component,
  width,
  height,
  containerProps,
  currentState,
  removeComponent,
}) {
  const backgroundColor = component.definition.styles.backgroundColor.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const heightProperty = component.definition.properties?.height?.value ?? 100;
  const showBorderProperty = component.definition.properties?.showBorder?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  const rowHeight = resolveWidgetFieldValue(heightProperty, currentState);

  const showBorder = resolveWidgetFieldValue(showBorderProperty, currentState);

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const computedStyles = {
    backgroundColor,
    height,
    display: parsedWidgetVisibility ? 'flex' : 'none',
  };

  const parentRef = useRef(null);

  let listData = [];
  if (currentState) {
    listData = resolveReferences(component.definition.properties.data.value, currentState, []);
    if (!Array.isArray(listData)) listData = [];
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      className="jet-listview"
      id={id}
      ref={parentRef}
      onClick={() => containerProps.onComponentClick(id, component)}
      style={computedStyles}
    >
      <div className="rows w-100">
        {listData.map((listItem, index) => (
          <div
            className={`list-item w-100 ${showBorder ? 'border-bottom' : ''}`}
            style={{ position: 'relative', height: `${rowHeight}px`, width: '100%' }}
            key={index}
          >
            <SubContainer
              parentComponent={component}
              readOnly={index !== 0}
              containerCanvasWidth={width}
              parent={`${id}`}
              parentName={component.name}
              {...containerProps}
              customResolvables={{ listItem }}
              parentRef={parentRef}
              removeComponent={removeComponent}
              listViewItemOptions={{ index }}
            />
            {index > 0 && <hr className="m-0"></hr>}
          </div>
        ))}
      </div>
    </div>
  );
};
