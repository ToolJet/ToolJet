import React, { useCallback, useState, useEffect } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import { snapToGrid as doSnapToGrid } from './snapToGrid';
import update from 'immutability-helper';
import { componentTypes } from './Components/components';
import { computeComponentName } from '@/_helpers/utils';

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

export const Container = ({
  mode,
  snapToGrid,
  onComponentClick,
  onEvent,
  appDefinition,
  appDefinitionChanged,
  currentState,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  appLoading,
  configHandleClicked,
  zoomLevel,
  currentLayout,
  removeComponent,
  deviceWindowWidth,
  scaleValue,
  selectedComponent,
  darkMode,
}) => {
  const styles = {
    width: currentLayout === 'mobile' ? deviceWindowWidth : 1292,
    height: 2400,
    position: 'absolute',
  };

  const components = appDefinition.components;

  const [boxes, setBoxes] = useState(components);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setBoxes(components);
  }, [components]);

  const moveBox = useCallback(
    (id, layouts) => {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { layouts },
          },
        })
      );
      console.log('new boxes - 1', boxes);
    },
    [boxes]
  );

  useEffect(() => {
    console.log('new boxes - 2', boxes);
    appDefinitionChanged({ ...appDefinition, components: boxes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes]);

  const { draggingState } = useDragLayer((monitor) => {
    if (monitor.isDragging()) {
      if (!monitor.getItem().parent) {
        return { draggingState: true };
      } else {
        return { draggingState: false };
      }
    } else {
      return { draggingState: false };
    }
  });

  useEffect(() => {
    setIsDragging(draggingState);
  }, [draggingState]);

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop(item, monitor) {
        if (item.parent) {
          return;
        }

        let layouts = item['layouts'];
        const currentLayoutOptions = layouts ? layouts[item.currentLayout] : {};

        let componentData = {};
        let componentMeta = {};
        let id = item.id;

        let left = 0;
        let top = 0;

        const canvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

        // Component already exists and this is just a reposition event
        if (id) {
          const delta = monitor.getDifferenceFromInitialOffset();
          let deltaX = 0;
          let deltaY = 0;

          if (delta) {
            deltaX = delta.x;
            deltaY = delta.y;
          }

          left = Math.round(currentLayoutOptions.left + deltaX);
          top = Math.round(currentLayoutOptions.top + deltaY);

          if (snapToGrid) {
            [left, top] = doSnapToGrid(left, top);
          }

          let newBoxes = {
            ...boxes,
            [id]: {
              ...boxes[id],
              layouts: {
                ...boxes[id]['layouts'],
                [item.currentLayout]: {
                  ...boxes[id]['layouts'][item.currentLayout],
                  top: top,
                  left: left,
                },
              },
            },
          };

          setBoxes(newBoxes);
        } else {
          //  This is a new component
          componentMeta = componentTypes.find((component) => component.component === item.component.component);
          console.log('adding new component');
          componentData = JSON.parse(JSON.stringify(componentMeta));
          componentData.name = computeComponentName(componentData.component, boxes);

          const offsetFromTopOfWindow = canvasBoundingRect.top;
          const offsetFromLeftOfWindow = canvasBoundingRect.left;
          const currentOffset = monitor.getSourceClientOffset();

          left = Math.round(currentOffset.x + currentOffset.x * (1 - zoomLevel) - offsetFromLeftOfWindow);
          top = Math.round(currentOffset.y + currentOffset.y * (1 - zoomLevel) - offsetFromTopOfWindow);

          id = uuidv4();

          if (snapToGrid) {
            [left, top] = doSnapToGrid(left, top);
          }

          if (item.currentLayout === 'mobile') {
            componentData.definition.others.showOnDesktop.value = false;
            componentData.definition.others.showOnMobile.value = true;
          }

          setBoxes({
            ...boxes,
            [id]: {
              component: componentData,
              layouts: {
                [item.currentLayout]: {
                  top: top,
                  left: left,
                  width: componentMeta.defaultSize.width,
                  height: componentMeta.defaultSize.height,
                },
              },
            },
          });
        }

        return undefined;
      },
    }),
    [moveBox]
  );

  function onResizeStop(id, e, direction, ref, d, position) {
    const deltaWidth = d.width;
    const deltaHeight = d.height;

    let { x, y } = position;

    const defaultData = {
      top: 100,
      left: 0,
      width: 445,
      height: 500,
    };

    let { left, top, width, height } = boxes[id]['layouts'][currentLayout] || defaultData;

    top = y;
    left = x;

    width = width + deltaWidth;
    height = height + deltaHeight;

    // [width, height] = doSnapToGrid(width, height)

    let newBoxes = {
      ...boxes,
      [id]: {
        ...boxes[id],
        layouts: {
          ...boxes[id]['layouts'],
          [currentLayout]: {
            ...boxes[id]['layouts'][currentLayout],
            width,
            height,
            top,
            left,
          },
        },
      },
    };

    setBoxes(newBoxes);
  }

  function paramUpdated(id, param, value) {
    if (Object.keys(value).length > 0) {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: {
              component: {
                ...boxes[id].component,
                definition: {
                  ...boxes[id].component.definition,
                  properties: {
                    ...boxes[id].component.definition.properties,
                    [param]: value,
                  },
                },
              },
            },
          },
        })
      );
    }
  }

  return (
    <div ref={drop} style={styles} className={`real-canvas ${isDragging || isResizing ? 'show-grid' : ''}`}>
      {Object.keys(boxes).map((key) => {
        const box = boxes[key];
        const canShowInCurrentLayout =
          box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;

        if (!box.parent && canShowInCurrentLayout) {
          return (
            <DraggableBox
              onComponentClick={onComponentClick}
              onEvent={onEvent}
              onComponentOptionChanged={onComponentOptionChanged}
              onComponentOptionsChanged={onComponentOptionsChanged}
              key={key}
              currentState={currentState}
              onResizeStop={onResizeStop}
              paramUpdated={paramUpdated}
              id={key}
              {...boxes[key]}
              mode={mode}
              resizingStatusChanged={(status) => setIsResizing(status)}
              inCanvas={true}
              zoomLevel={zoomLevel}
              configHandleClicked={configHandleClicked}
              removeComponent={removeComponent}
              currentLayout={currentLayout}
              scaleValue={scaleValue}
              deviceWindowWidth={deviceWindowWidth}
              isSelectedComponent={selectedComponent ? selectedComponent.id === key : false}
              darkMode={darkMode}
              containerProps={{
                mode,
                snapToGrid,
                onComponentClick,
                onEvent,
                appDefinition,
                appDefinitionChanged,
                currentState,
                onComponentOptionChanged,
                onComponentOptionsChanged,
                appLoading,
                zoomLevel,
                configHandleClicked,
                removeComponent,
                currentLayout,
                scaleValue,
                deviceWindowWidth,
                selectedComponent,
                darkMode,
              }}
            />
          );
        }
      })}
      {Object.keys(boxes).length === 0 && !appLoading && !isDragging && (
        <div className="mx-auto w-50 p-5 bg-light no-components-box" style={{ marginTop: '10%' }}>
          <center className="text-muted">
            You haven&apos;t added any components yet. Drag components from the right sidebar and drop here. Check out
            our{' '}
            <a href="https://docs.tooljet.io/docs/tutorial/adding-widget" target="_blank" rel="noreferrer">
              guide
            </a>{' '}
            on adding widgets.
          </center>
        </div>
      )}
      {appLoading && (
        <div className="mx-auto mt-5 w-50 p-5">
          <center>
            <div className="spinner-border text-azure" role="status"></div>
          </center>
        </div>
      )}
    </div>
  );
};
