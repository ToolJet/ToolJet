import React, { useRef } from 'react';
import { SubContainer } from '../SubContainer';
import _ from 'lodash';

export const Listview = function Listview({
  id,
  component,
  width,
  height,
  containerProps,
  removeComponent,
  properties,
  styles,
  currentState,
  fireEvent,
}) {
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const fallbackStyles = { visibility: true, disabledState: false };

  const { data, rowHeight, showBorder } = { ...fallbackProperties, ...properties };
  const { backgroundColor, visibility, disabledState } = { ...fallbackStyles, ...styles };

  let childComponents = [];

  const allComponents = containerProps.appDefinition ? containerProps.appDefinition.components : {};
  Object.keys(allComponents).forEach((key) => {
    if (allComponents[key].parent === id) {
      const dataObj = {
        id: key,
        name: allComponents[key]['component'].name,
        data: allComponents[key]['component']['exposedVariables'],
      };
      childComponents[key] = dataObj;
    }
  });

  const computedStyles = {
    backgroundColor,
    height,
    display: visibility ? 'flex' : 'none',
  };

  const onRowClicked = (index) => {
    fireEvent('onRowClicked', { data: currentState.components['listview1'].data[index], rowId: index });
  };

  const parentRef = useRef(null);

  return (
    <div
      data-disabled={disabledState}
      className="jet-listview"
      id={id}
      ref={parentRef}
      onClick={() => containerProps.onComponentClick(id, component)}
      style={computedStyles}
    >
      <div className="rows w-100">
        {(_.isArray(data) ? data : []).map((listItem, index) => (
          <div
            className={`list-item w-100 ${showBorder ? 'border-bottom' : ''}`}
            style={{ position: 'relative', height: `${rowHeight}px`, width: '100%' }}
            key={index}
            onClick={(event) => {
              event.stopPropagation();
              onRowClicked(index);
            }}
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
          </div>
        ))}
      </div>
    </div>
  );
};
