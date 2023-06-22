/* eslint-disable import/no-named-as-default */
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
const produce = require('immer').default;
import _ from 'lodash';
import { componentTypes } from './WidgetManager/components';
import { addNewWidgetToTheEditor } from '@/_helpers/appUtils';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentStateStore } from '../_stores/currentStateStore';
import { useMounted } from '@/_hooks/use-mount';

export const SubContainer = ({
  mode,
  snapToGrid,
  onComponentClick,
  onEvent,
  appDefinition,
  appDefinitionChanged,
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
  customResolvables,
  parentComponent,
  onComponentHover,
  hoveredComponent,
  sideBarDebugger,
  selectedComponents,
  onOptionChange,
  exposedVariables,
  addDefaultChildren = false,
  height = '100%',
  currentPageId,
  childComponents = null,
  isVersionReleased,
  setReleasedVersionPopupState,
}) => {
  //Todo add custom resolve vars for other widgets too
  const mounted = useMounted();
  const widgetResolvables = Object.freeze({
    Listview: 'listItem',
  });

  const customResolverVariable = widgetResolvables[parentComponent?.component];
  const currentState = useCurrentStateStore();

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
  const allComponents = appDefinition ? appDefinition.pages[currentPageId].components : {};
  const isParentModal =
    (allComponents[parent]?.component?.component === 'Modal' ||
      allComponents[parent]?.component?.component === 'Form' ||
      allComponents[parent]?.component?.component === 'Container') ??
    false;

  const getChildWidgets = (components) => {
    let childWidgets = [];
    Object.keys(components).forEach((key) => {
      if (components[key].parent === parent) {
        childWidgets[key] = { ...components[key], component: { ...components[key]['component'], parent } };
      }
    });
    return childWidgets;
  };

  const [boxes, setBoxes] = useState(allComponents);
  const [childWidgets, setChildWidgets] = useState(() => getChildWidgets(allComponents));
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  // const [subContainerHeight, setSubContainerHeight] = useState('100%'); //used to determine the height of the sub container for modal
  const subContainerHeightRef = useRef(height ?? '100%');

  useEffect(() => {
    setBoxes(allComponents);
    setChildWidgets(() => getChildWidgets(allComponents));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComponents, parent]);

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

        const _allComponents = JSON.parse(JSON.stringify(allComponents));

        defaultChildren.forEach((child) => {
          const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue, styles } = child;

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

          if (_.isArray(styles) && styles.length > 0) {
            styles.forEach((prop) => {
              const accessor = customResolverVariable
                ? `{{${customResolverVariable}.${accessorKey}}}`
                : defaultValue[prop] || '';

              _.set(newComponentDefinition, prop, {
                value: accessor,
              });
            });
            _.set(componentData, 'definition.styles', newComponentDefinition);
          }

          const newComponent = addNewWidgetToTheEditor(
            componentData,
            {},
            { ..._allComponents, ...childrenBoxes },
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
      const newDefinition = {
        ...appDefinition,
        pages: {
          ...appDefinition.pages,
          [currentPageId]: {
            ...appDefinition.pages[currentPageId],
            components: boxes,
          },
        },
      };
      appDefinitionChanged(newDefinition);
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
            const canvasBoundingRect = parentRef?.current
              ?.getElementsByClassName('real-canvas')[0]
              ?.getBoundingClientRect();
            if (!canvasBoundingRect) return { draggingState: false };
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

        setSelectedComponent(newComponent.id, newComponent.component);

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
    if (isVersionReleased) {
      setReleasedVersionPopupState();
      return;
    }
    const canvasWidth = getContainerCanvasWidth();
    const nodeBounds = direction.node.getBoundingClientRect();

    const canvasBounds = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

    // Computing the left offset
    const leftOffset = nodeBounds.x - canvasBounds.x;
    const currentLeftOffset = boxes[componentId].layouts[currentLayout].left;
    const leftDiff = currentLeftOffset - convertXToPercentage(leftOffset, canvasWidth);

    const topDiff = boxes[componentId].layouts[currentLayout].top - (nodeBounds.y - canvasBounds.y);

    let newBoxes = { ...boxes };

    const subContainerHeight = canvasBounds.height - 30;

    if (selectedComponents) {
      for (const selectedComponent of selectedComponents) {
        newBoxes = produce(newBoxes, (draft) => {
          const topOffset = draft[selectedComponent.id].layouts[currentLayout].top;
          const leftOffset = draft[selectedComponent.id].layouts[currentLayout].left;

          draft[selectedComponent.id].layouts[currentLayout].top = topOffset - topDiff;
          draft[selectedComponent.id].layouts[currentLayout].left = leftOffset - leftDiff;
        });

        const componentBottom =
          newBoxes[selectedComponent.id].layouts[currentLayout].top +
          newBoxes[selectedComponent.id].layouts[currentLayout].height;

        if (isParentModal && subContainerHeight <= componentBottom) {
          subContainerHeightRef.current = subContainerHeight + 100;
        }
      }
    }

    setChildWidgets(() => getChildWidgets(newBoxes));
    setBoxes(newBoxes);
  }

  function onResizeStop(id, e, direction, ref, d, position) {
    if (isVersionReleased) {
      setReleasedVersionPopupState();
      return;
    }
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
      setBoxes((boxes) => {
        return update(boxes, {
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
        });
      });
    }
  }

  const styles = {
    width: '100%',
    height: subContainerHeightRef.current,
    position: 'absolute',
    backgroundSize: `${getContainerCanvasWidth() / 43}px 10px`,
  };

  function onComponentOptionChangedForSubcontainer(component, optionName, value, componentId = '') {
    if (typeof value === 'function' && _.findKey(exposedVariables, optionName)) {
      return Promise.resolve();
    }
    onOptionChange && onOptionChange({ component, optionName, value, componentId });
    return onComponentOptionChanged(component, optionName, value);
  }

  function customRemoveComponent(component) {
    removeComponent(component);
  }

  function checkParentVisibility() {
    let elem = parentRef.current;
    if (elem?.className === 'tab-content') {
      elem = parentRef.current?.parentElement;
    }
    if (elem?.style?.display !== 'none') return true;
    return false;
  }

  return (
    <div
      ref={drop}
      style={styles}
      id={`canvas-${parent}`}
      className={`real-canvas ${(isDragging || isResizing) && !readOnly ? 'show-grid' : ''}`}
    >
      {checkParentVisibility() &&
        Object.keys(childWidgets).map((key) => {
          const addDefaultChildren = childWidgets[key]['withDefaultChildren'] || false;

          const box = childWidgets[key];
          const canShowInCurrentLayout =
            box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;
          if (box.parent && resolveReferences(canShowInCurrentLayout, currentState)) {
            return (
              <DraggableBox
                onComponentClick={onComponentClick}
                onEvent={onEvent}
                onComponentOptionChanged={onComponentOptionChangedForSubcontainer}
                onComponentOptionsChanged={onComponentOptionsChanged}
                key={key}
                onResizeStop={onResizeStop}
                onDragStop={onDragStop}
                paramUpdated={paramUpdated}
                id={key}
                allComponents={allComponents}
                {...childWidgets[key]}
                mode={mode}
                resizingStatusChanged={(status) => setIsResizing(status)}
                draggingStatusChanged={(status) => setIsDragging(status)}
                inCanvas={true}
                zoomLevel={zoomLevel}
                setSelectedComponent={setSelectedComponent}
                currentLayout={currentLayout}
                selectedComponent={selectedComponent}
                deviceWindowWidth={deviceWindowWidth}
                isSelectedComponent={
                  mode === 'edit' ? selectedComponents.find((component) => component.id === key) : false
                }
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
                childComponents={childComponents[key]}
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
                  addDefaultChildren,
                  currentPageId,
                  childComponents,
                }}
              />
            );
          }
        })}
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
