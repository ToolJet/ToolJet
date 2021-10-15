import React, { useCallback, useState, useEffect } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import { snapToGrid as doSnapToGrid } from './snapToGrid';
import update from 'immutability-helper';
import { componentTypes } from './Components/components';
import { computeComponentName } from '@/_helpers/utils';

const styles = {
  width: '100%',
  height: '100%',
  position: 'absolute',
};

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

export const SubContainer = ({
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
  parent,
  parentRef,
  configHandleClicked,
  deviceWindowWidth,
  scaleValue,
  selectedComponent,
  currentLayout,
  removeComponent,
}) => {
  zoomLevel = zoomLevel || 1;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allComponents = appDefinition ? appDefinition.components : {};

  let childComponents = [];

  Object.keys(allComponents).forEach((key) => {
    if (allComponents[key].parent === parent) {
      childComponents[key] = allComponents[key];
    }
  });

  const [boxes, setBoxes] = useState(allComponents);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setBoxes(allComponents);
  }, [allComponents]);

  const moveBox = useCallback(
    (id, left, top) => {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { left, top },
          },
        })
      );
      console.log('new boxes - 1', boxes);
    },
    [boxes]
  );

  useEffect(() => {
    console.log('new boxes - 2', boxes);
    if (appDefinitionChanged) {
      appDefinitionChanged({ ...appDefinition, components: boxes });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes]);

  const { draggingState } = useDragLayer((monitor) => {
    // TODO: Need to move to a performant version of the block below
    if (monitor.getItem()) {
      if (monitor.getItem().id === undefined) {
        if (parentRef.current) {
          const currentOffset = monitor.getSourceClientOffset();
          if (currentOffset) {
            const canvasBoundingRect = parentRef.current
              .getElementsByClassName('real-canvas')[0]
              .getBoundingClientRect();
            if (
              currentOffset.x > canvasBoundingRect.x &&
              currentOffset.x < canvasBoundingRect.x + canvasBoundingRect.width
            ) {
              return { draggingState: true };
            }
          }
        }
      }
    }

    if (monitor.isDragging() && monitor.getItem().parent) {
       (monitor.getItem().parent === parent) ?
       ( return { draggingState: true } )
       : (return { draggingState: false })
      
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
        let componentData = {};
        let componentMeta = {};
        let id = item.id;

        let left = 0;
        let top = 0;

        let layouts = item['layouts'];
        const currentLayoutOptions = layouts ? layouts[item.currentLayout] : {};

        const canvasBoundingRect = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

        // Component already exists and this is just a reposition event
        if (id) {
          const delta = monitor.getDifferenceFromInitialOffset();
          componentData = item.component;
          left = Math.round(currentLayoutOptions.left + delta.x);
          top = Math.round(currentLayoutOptions.top + delta.y);

          if (snapToGrid) {
            [left, top] = doSnapToGrid(left, top);
          }

          let newBoxes = {
            ...boxes,
            [id]: {
              ...boxes[id],
              parent: parent,
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
        }

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
            parent: parent,
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
    <div ref={drop} style={styles} className={`real-canvas ${isDragging || isResizing ? ' show-grid' : ''}`}>
      {Object.keys(childComponents).map((key) => (
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
          currentLayout={currentLayout}
          scaleValue={scaleValue}
          selectedComponent={selectedComponent}
          deviceWindowWidth={deviceWindowWidth}
          isSelectedComponent={selectedComponent ? selectedComponent.id === key : false}
          removeComponent={removeComponent}
        />
      ))}

      {Object.keys(boxes).length === 0 && !appLoading && !isDragging && (
        <div className="mx-auto mt-5 w-50 p-5 bg-light no-components-box">
          <center className="text-muted">
            Drag components from the right sidebar and drop here. Check out our{' '}
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
            <div className="progress progress-sm w-50">
              <div className="progress-bar progress-bar-indeterminate"></div>
            </div>
          </center>
        </div>
      )}
    </div>
  );
};
