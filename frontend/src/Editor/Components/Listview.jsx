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
  exposedVariables,
  setExposedVariable,
}) {
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const fallbackStyles = { visibility: true, disabledState: false };

  const { data, rowHeight, showBorder } = { ...fallbackProperties, ...properties };
  const { backgroundColor, visibility, disabledState, borderRadius } = { ...fallbackStyles, ...styles };

  //memoized value of the data
  const memoizedData = React.useMemo(() => {
    return data;
  }, [data]);

  const computedStyles = {
    backgroundColor,
    height,
    display: visibility ? 'flex' : 'none',
    borderRadius: borderRadius ?? 0,
  };

  const onRowClicked = (index) => {
    const currentRowData = currentState.components[`${component.name}`]?.data[index] ?? undefined;
    if (currentRowData) {
      fireEvent('onRowClicked', { data: data[index], rowId: index });
    }
  };

  const parentRef = useRef(null);

  React.useEffect(() => {
    const { data } = exposedVariables;
    if (component?.parent && data?.length !== memoizedData?.length) {
      setExposedVariable(`data`, memoizedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedData]);

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
        {(_.isArray(memoizedData) ? memoizedData : []).map((listItem, index) => (
          <div
            className={`list-item w-100 ${showBorder ? 'border-bottom' : ''}`}
            style={{ position: 'relative', height: `${rowHeight}px`, width: '100%' }}
            key={index}
            onClick={(event) => {
              event.preventDefault();
              onRowClicked(index);
            }}
          >
            <SubContainer
              parentComponent={component}
              containerCanvasWidth={width}
              parent={`${id}`}
              parentName={component.name}
              {...containerProps}
              readOnly={index !== 0}
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
