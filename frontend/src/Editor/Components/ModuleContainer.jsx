import React, { useRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { Spinner } from './Spinner';

export const ModuleContainer = function ModuleContainer({
  containerProps,
  width,
  component,
  removeComponent,
  id,
  properties,
  styles,
  darkMode,
  height,
  dataCy,
}) {
  const { visibility, disabledState, borderRadius, borderColor, boxShadow } = styles;
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
    boxShadow,
  };

  const parentRef = useRef(null);

  const { inputItems } = properties;
  const inputResolvables = inputItems.reduce(
    (resolvables, item) => ({ ...resolvables, [item.name]: item.defaultValue }),
    {}
  );

  return (
    <div
      data-disabled={disabledState}
      className={`jet-container ${properties.loadingState && 'jet-container-loading'}`}
      id={id}
      data-cy={dataCy}
      ref={parentRef}
      style={computedStyles}
      onClick={(e) => {
        if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index when container element is clicked
    >
      {properties.loadingState ? (
        <Spinner />
      ) : (
        <>
          <SubContainer
            parentComponent={component}
            containerCanvasWidth={width}
            parent={id}
            {...containerProps}
            parentRef={parentRef}
            removeComponent={removeComponent}
            customResolvables={{ input: inputResolvables }}
          />
          <SubCustomDragLayer
            containerCanvasWidth={width}
            parent={id}
            parentRef={parentRef}
            currentLayout={containerProps.currentLayout}
          />
        </>
      )}
    </div>
  );
};
