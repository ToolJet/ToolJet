/* eslint-disable import/no-named-as-default */
import React, { useCallback, useState, useEffect } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import produce from 'immer';
import _ from 'lodash';
import { componentTypes } from './WidgetManager/components';
import { addNewWidgetToTheEditor } from '@/_helpers/appUtils';

import { useMounted } from '@/_hooks/use-mount';

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
  setSelectedComponent,
  deviceWindowWidth,
  selectedComponent,
  currentLayout,
  removeComponent,
  darkMode,
  containerCanvasWidth,
  readOnly,
  dataQueries,
  customResolvables,
  parentComponent,
  onComponentHover,
  hoveredComponent,
  sideBarDebugger,
  selectedComponents,
  onOptionChange,
  exposedVariables,
  addDefaultChildren = false,
  setDraggingOrResizing = () => {},
}) => {
  //Todo add custom resolve vars for other widgets too
  const mounted = useMounted();
  const widgetResolvables = Object.freeze({
    Listview: 'listItem',
  });

  const customResolverVariable = widgetResolvables[parentComponent?.component];

  const [_containerCanvasWidth, setContainerCanvasWidth] = useState(0);
  useEffect(() => {
    if (parentRef.current) {
      const canvasWidth = getContainerCanvasWidth();
      setContainerCanvasWidth(canvasWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentRef, getContainerCanvasWidth()]);

  zoomLevel = zoomLevel || 1;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allComponents = appDefinition ? appDefinition.components : {};

  let childComponents = [];

  Object.keys(allComponents).forEach((key) => {
    if (allComponents[key].parent === parent) {
      childComponents[key] = { ...allComponents[key], component: { ...allComponents[key]['component'], parent } };
    }
  });

  const [boxes, setBoxes] = useState(allComponents);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setBoxes(allComponents);
  }, [allComponents]);

  useEffect(() => {
    if (mounted) {
      //find children with parent prop
      const children = Object.keys(allComponents).filter((key) => {
        if (key === parent) return false;
        return allComponents[key].parent === parent;
      });

      if (children.length === 0 && addDefaultChildren === true) {
        const defaultChildren = _.cloneDeep(parentComponent)['defaultChildren'];
        const childrenBoxes = {};
        const parentId =
          parentComponent.component !== 'Tabs'
            ? parentRef.current.id
            : parentRef.current.id?.substring(0, parentRef.current.id.lastIndexOf('-'));

        defaultChildren.forEach((child) => {
          const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue } = child;

          const componentMeta = componentTypes.find((component) => component.component === componentName);
          const componentData = JSON.parse(JSON.stringify(componentMeta));

          const width = layout.width ? layout.width : (componentMeta.defaultSize.width * 100) / 43;
          const height = layout.height ? layout.height : componentMeta.defaultSize.height;
          const newComponentDefinition = {
            ...componentData.definition.properties,
          };

          if (_.isArray(properties) && properties.length > 0) {
            properties.forEach((prop) => {
              const accessor = customResolverVariable
                ? `{{${customResolverVariable}.${accessorKey}}}`
                : defaultValue[prop] || '';

              _.set(newComponentDefinition, prop, {
                value: accessor,
              });
            });
            _.set(componentData, 'definition.properties', newComponentDefinition);
          }

          const newComponent = addNewWidgetToTheEditor(
            componentData,
            {},
            boxes,
            {},
            currentLayout,
            snapToGrid,
            zoomLevel,
            true,
            true
          );

          _.set(childrenBoxes, newComponent.id, {
            component: newComponent.component,
            parent: parentComponent.component === 'Tabs' ? parentId + '-' + tab : parentId,
            layouts: {
              [currentLayout]: {
                ...layout,
                width: incrementWidth ? width * incrementWidth : width,
                height: height,
              },
            },
          });
        });

        const _allComponents = JSON.parse(JSON.stringify(allComponents));

        _allComponents[parentId] = {
          ...allComponents[parentId],
          withDefaultChildren: false,
        };
        setBoxes({
          ..._allComponents,
          ...childrenBoxes,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const moveBox = useCallback(
    (id, left, top) => {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { left, top },
          },
        })
      );
    },
    [boxes]
  );

  useEffect(() => {
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
      if (monitor.getItem().parent === parent) {
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

  function convertXToPercentage(x, canvasWidth) {
    return (x * 100) / canvasWidth;
  }

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop(item, monitor) {
        const componentMeta = componentTypes.find((component) => component.component === item.component.component);

        const canvasBoundingRect = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

        const newComponent = addNewWidgetToTheEditor(
          componentMeta,
          monitor,
          boxes,
          canvasBoundingRect,
          item.currentLayout,
          snapToGrid,
          zoomLevel,
          true
        );

        setBoxes({
          ...boxes,
          [newComponent.id]: {
            component: newComponent.component,
            parent: parentRef.current.id,
            layouts: {
              ...newComponent.layout,
            },
            withDefaultChildren: newComponent.withDefaultChildren,
          },
        });

        return undefined;
      },
    }),
    [moveBox]
  );

  function getContainerCanvasWidth() {
    if (containerCanvasWidth !== undefined) {
      return containerCanvasWidth - 2;
    }
    let width = 0;
    if (parentRef.current) {
      const realCanvas = parentRef.current.getElementsByClassName('real-canvas')[0];
      if (realCanvas) {
        const canvasBoundingRect = realCanvas.getBoundingClientRect();
        width = canvasBoundingRect.width;
      }
    }

    return width;
  }

  function onDragStop(e, componentId, direction, currentLayout) {
    const canvasWidth = getContainerCanvasWidth();
    const nodeBounds = direction.node.getBoundingClientRect();

    const canvasBounds = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

    // Computing the left offset
    const leftOffset = nodeBounds.x - canvasBounds.x;
    const currentLeftOffset = boxes[componentId].layouts[currentLayout].left;
    const leftDiff = currentLeftOffset - convertXToPercentage(leftOffset, canvasWidth);

    const topDiff = boxes[componentId].layouts[currentLayout].top - (nodeBounds.y - canvasBounds.y);

    let newBoxes = { ...boxes };

    if (selectedComponents) {
      for (const selectedComponent of selectedComponents) {
        newBoxes = produce(newBoxes, (draft) => {
          const topOffset = draft[selectedComponent.id].layouts[currentLayout].top;
          const leftOffset = draft[selectedComponent.id].layouts[currentLayout].left;

          draft[selectedComponent.id].layouts[currentLayout].top = topOffset - topDiff;
          draft[selectedComponent.id].layouts[currentLayout].left = leftOffset - leftDiff;
        });
      }
    }

    setBoxes(newBoxes);
  }

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

    const canvasBoundingRect = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();
    const subContainerWidth = canvasBoundingRect.width;

    top = y;
    if (deltaWidth !== 0) {
      // onResizeStop is triggered for a single click on the border, therefore this conditional logic
      // should not be removed.
      left = (x * 100) / subContainerWidth;
    }

    width = width + (deltaWidth * 43) / subContainerWidth;
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

  const styles = {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundSize: `${getContainerCanvasWidth() / 43}px 10px`,
  };

  function onComponentOptionChangedForSubcontainer(component, optionName, value) {
    if (typeof value === 'function' && _.findKey(exposedVariables, optionName)) {
      return Promise.resolve();
    }
    onOptionChange && onOptionChange({ component, optionName, value });
    return onComponentOptionChanged(component, optionName, value);
  }

  function customRemoveComponent(component) {
    // const componentName = appDefinition.components[component.id]['component'].name;
    removeComponent(component);
    // if (parentComponent.component === 'Listview') {
    //   const currentData = currentState.components[parentComponent.name]?.data || [];
    //   const newData = currentData.map((widget) => {
    //     delete widget[componentName];
    //     return widget;
    //   });
    //   onComponentOptionChanged(parentComponent, 'data', newData);
    // }
  }

  return (
    <div
      ref={drop}
      style={styles}
      id={`canvas-${parent}`}
      className={`real-canvas ${(isDragging || isResizing) && !readOnly ? ' show-grid' : ''}`}
    >
      {Object.keys(childComponents).map((key) => {
        const addDefaultChildren = childComponents[key]['withDefaultChildren'] || false;

        return (
          <DraggableBox
            onComponentClick={onComponentClick}
            onEvent={onEvent}
            onComponentOptionChanged={onComponentOptionChangedForSubcontainer}
            onComponentOptionsChanged={onComponentOptionsChanged}
            key={key}
            dataQueries={dataQueries}
            currentState={currentState}
            onResizeStop={onResizeStop}
            onDragStop={onDragStop}
            paramUpdated={paramUpdated}
            id={key}
            allComponents={allComponents}
            {...childComponents[key]}
            mode={mode}
            resizingStatusChanged={(status) => setIsResizing(status)}
            draggingStatusChanged={(status) => setIsDragging(status)}
            inCanvas={true}
            zoomLevel={zoomLevel}
            setSelectedComponent={setSelectedComponent}
            currentLayout={currentLayout}
            selectedComponent={selectedComponent}
            deviceWindowWidth={deviceWindowWidth}
            isSelectedComponent={mode === 'edit' ? selectedComponents.find((component) => component.id === key) : false}
            removeComponent={customRemoveComponent}
            canvasWidth={_containerCanvasWidth}
            readOnly={readOnly}
            darkMode={darkMode}
            customResolvables={customResolvables}
            onComponentHover={onComponentHover}
            hoveredComponent={hoveredComponent}
            parentId={parentComponent?.name}
            sideBarDebugger={sideBarDebugger}
            isMultipleComponentsSelected={selectedComponents?.length > 1 ? true : false}
            exposedVariables={exposedVariables ?? {}}
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
              setSelectedComponent,
              removeComponent,
              currentLayout,
              deviceWindowWidth,
              selectedComponents,
              darkMode,
              readOnly,
              onComponentHover,
              hoveredComponent,
              sideBarDebugger,
              setDraggingOrResizing,
              addDefaultChildren,
            }}
            setDraggingOrResizing={setDraggingOrResizing}
          />
        );
      })}

      {Object.keys(boxes).length === 0 && !appLoading && !isDragging && (
        <div className="mx-auto mt-5 w-50 p-5 bg-light no-components-box" data-cy="----Test----">
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
