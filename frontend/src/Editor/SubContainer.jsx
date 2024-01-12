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
import { toast } from 'react-hot-toast';
import { restrictedWidgetsObj } from '@/Editor/WidgetManager/restrictedWidgetsConfig';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { useMounted } from '@/_hooks/use-mount';
import { useEditorStore } from '@/_stores/editorStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import DragContainerNested from './DragContainerNested';
import { useGridStore, useDragTarget } from '@/_stores/gridStore';
import { SUBCONTAINER_WITH_SCROLL } from './constants';

// const NO_OF_GRIDS = 43;

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
  onOptionChange,
  exposedVariables,
  addDefaultChildren = false,
  height = '100%',
  currentPageId,
  childComponents = null,
  listmode = null,
  columns = 1,
  setIsChildDragged,
  setSubContainerWidths,
  parentGridWidth,
  subContainerWidths,
  turnOffAutoLayout,
}) => {
  //Todo add custom resolve vars for other widgets too
  const mounted = useMounted();
  const widgetResolvables = Object.freeze({
    Listview: 'listItem',
  });

  const customResolverVariable = widgetResolvables[parentComponent?.component];
  const currentState = useCurrentState();
  const [dragTarget] = useDragTarget();
  const { enableReleasedVersionPopupState, isVersionReleased } = useAppVersionStore(
    (state) => ({
      enableReleasedVersionPopupState: state.actions.enableReleasedVersionPopupState,
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state.selectedComponents,
    }),
    shallow
  );

  // const [noOfGrids] = useNoOfGrid();
  const noOfGrids = 43;
  const { isGridActive } = useGridStore((state) => ({ isGridActive: state.activeGrid === parent }), shallow);

  const gridWidth = getContainerCanvasWidth() / noOfGrids;

  const [_containerCanvasWidth, setContainerCanvasWidth] = useState(0);
  useEffect(() => {
    if (parentRef.current) {
      const canvasWidth = getContainerCanvasWidth();
      setContainerCanvasWidth(canvasWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentRef, getContainerCanvasWidth(), listmode]);

  zoomLevel = zoomLevel || 1;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allComponents = appDefinition ? appDefinition.pages[currentPageId].components : {};
  const isParentModal =
    (allComponents[parent]?.component?.component === 'Modal' ||
      allComponents[parent]?.component?.component === 'Form' ||
      allComponents[parent]?.component?.component === 'Container') ??
    false;

  const getChildWidgets = (components) => {
    let childWidgets = {};
    Object.keys(components).forEach((key) => {
      const componentParent = components[key].component.parent;
      if (componentParent === parent) {
        childWidgets[key] = { ...components[key], component: { ...components[key]['component'], parent } };
      }
    });

    return childWidgets;
  };

  const [boxes, setBoxes] = useState(allComponents);
  const [childWidgets, setChildWidgets] = useState([]);
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
    try {
      const isParentScrollable = SUBCONTAINER_WITH_SCROLL.has(allComponents[parent]?.component?.component);
      const canvasBounds = parentRef.current.getBoundingClientRect();
      const subContainerHeight = canvasBounds.height - 30;
      const componentBottom = Object.values(childWidgets).reduce(function (max, currentElement) {
        let currentSum = currentElement.layouts[currentLayout].top + currentElement.layouts[currentLayout].height;
        return Math.max(max, currentSum);
      }, 0);

      if (isParentScrollable && subContainerHeight <= componentBottom) {
        subContainerHeightRef.current = componentBottom + 100;
      }
    } catch (error) {
      console.error('console.error', error);
    }
  }, [childWidgets]);

  const containerWidth = getContainerCanvasWidth();

  useEffect(() => {
    setSubContainerWidths(parent, containerWidth / noOfGrids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);

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

          const componentMeta = _.cloneDeep(componentTypes.find((component) => component.component === componentName));
          const componentData = JSON.parse(JSON.stringify(componentMeta));

          const width = layout.width ? layout.width : (componentMeta.defaultSize.width * 100) / noOfGrids;
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
            component: {
              ...newComponent.component,
              parent: parentComponent.component === 'Tabs' ? parentId + '-' + tab : parentId,
            },

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

      const oldComponents = appDefinition.pages[currentPageId]?.components ?? {};
      const newComponents = boxes;

      const componendAdded = Object.keys(newComponents).length > Object.keys(oldComponents).length;

      const opts = { containerChanges: true };

      if (componendAdded) {
        opts.componentAdded = true;
      }

      const shouldUpdate = !_.isEmpty(diff(appDefinition, newDefinition));

      if (shouldUpdate) {
        appDefinitionChanged(newDefinition, opts);
      }
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

  //!Todo: need to check: this never gets called as draggingState is always false
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
        if (item.currentLayout === 'mobile' && item.autoComputeLayout) {
          turnOffAutoLayout();
          return false;
        }
        const componentMeta = _.cloneDeep(
          componentTypes.find((component) => component.component === item.component.component)
        );
        const canvasBoundingRect = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();
        const parentComp =
          parentComponent?.component === 'Kanban'
            ? parent.includes('modal')
              ? 'Kanban_popout'
              : 'Kanban_card'
            : parentComponent.component;
        if (!restrictedWidgetsObj[parentComp].includes(componentMeta?.component)) {
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
              component: {
                ...newComponent.component,
                parent: parentRef.current.id,
              },
              layouts: {
                ...newComponent.layout,
              },
              withDefaultChildren: newComponent.withDefaultChildren,
            },
          });

          setSelectedComponent(newComponent.id, newComponent.component);

          return undefined;
        } else {
          toast.error(
            ` ${componentMeta?.component} is not compatible as a child component of ${parentComp
              .replace(/_/g, ' ')
              .toLowerCase()}`,
            {
              style: {
                wordBreak: 'break-word',
              },
            }
          );
        }
      },
    }),
    [moveBox]
  );

  function getContainerCanvasWidth() {
    if (containerCanvasWidth !== undefined) {
      if (listmode == 'grid') return containerCanvasWidth / columns - 2;
      else return containerCanvasWidth - 2;
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

  const onResizeStop = (id, height, width, x, y) => {
    const newWidth = (width * noOfGrids) / _containerCanvasWidth;
    let newBoxes = {
      ...boxes,
      [id]: {
        ...boxes[id],
        layouts: {
          ...boxes[id]['layouts'],
          [currentLayout]: {
            ...boxes[id]['layouts'][currentLayout],
            width: newWidth,
            height,
            top: y,
            left: Math.round(x / gridWidth),
          },
        },
      },
    };

    setBoxes(newBoxes);
    // updateCanvasHeight(newBoxes);
  };

  function onDragStop(id, x, y, parent) {
    // const parentGridWidth = parentGridWidth;
    const subContainerGridWidth = parent ? subContainerWidths[parent] || gridWidth : parentGridWidth;
    let newBoxes = {
      ...boxes,
      [id]: {
        ...boxes[id],
        layouts: {
          ...boxes[id]['layouts'],
          [currentLayout]: {
            ...boxes[id]['layouts'][currentLayout],
            // ...{ top: layout.y, left: layout.x, height: layout.h, width: layout.w },
            width: parent
              ? boxes[id]['layouts'][currentLayout].width
              : Math.round((boxes[id]['layouts'][currentLayout].width * gridWidth) / parentGridWidth),
            top: y,
            left: Math.round(x / (parent ? subContainerGridWidth : parentGridWidth)),
          },
        },
        component: {
          ...boxes[id]['component'],
          parent: parent ? parent : undefined,
        },
      },
    };

    setChildWidgets(() => getChildWidgets(newBoxes));
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
    backgroundSize: `${gridWidth}px 10px`,
  };

  //check if parent is listview or form return false is so
  const checkParent = (box) => {
    let isListView = false,
      isForm = false;
    try {
      isListView =
        appDefinition.pages[currentPageId].components[box?.component?.parent]?.component?.component === 'Listview';
      isForm = appDefinition.pages[currentPageId].components[box?.component?.parent]?.component?.component === 'Form';
    } catch {
      console.log('error');
    }
    if (!isListView && !isForm) {
      return true;
    } else {
      return false;
    }
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

  const renderWidget = (key, height) => {
    if (!childWidgets[key]) {
      return;
    }
    const addDefaultChildren = childWidgets[key]['withDefaultChildren'] || false;

    const box = childWidgets[key];
    const canShowInCurrentLayout =
      box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;
    if (box.component.parent && resolveReferences(canShowInCurrentLayout, currentState)) {
      return (
        <DraggableBox
          onComponentClick={onComponentClick}
          onEvent={onEvent}
          height={height}
          onComponentOptionChanged={
            checkParent(box)
              ? onComponentOptionChangedForSubcontainer
              : (component, optionName, value, componentId = '') => {
                  if (typeof value === 'function' && _.findKey(exposedVariables, optionName)) {
                    return Promise.resolve();
                  }
                  onOptionChange && onOptionChange({ component, optionName, value, componentId });
                }
          }
          onComponentOptionsChanged={(component, variableSet, id) => {
            checkParent(box)
              ? onComponentOptionsChanged(component, variableSet)
              : variableSet.map((item) => {
                  onOptionChange &&
                    onOptionChange({
                      component,
                      optionName: item[0],
                      value: item[1],
                      componentId: id,
                    });
                });
          }}
          key={key}
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
          parentId={parent}
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
            setSubContainerWidths,
          }}
        />
      );
    }
  };

  return (
    <div
      ref={drop}
      style={styles}
      id={`canvas-${parent}`}
      className={`real-canvas ${
        (isDragging || isResizing || dragTarget === parent || isGridActive) && !readOnly ? 'show-grid' : 'hide-grid'
      }`}
    >
      <DragContainerNested
        boxes={Object.keys(childWidgets).map((key) => ({ ...boxes[key], id: key }))}
        renderWidget={renderWidget}
        canvasWidth={_containerCanvasWidth}
        gridWidth={gridWidth}
        parent={parent}
        currentLayout={currentLayout}
        readOnly={readOnly}
      />
      {/* {checkParentVisibility() &&
        Object.keys(childWidgets).map((key) => {
          const addDefaultChildren = childWidgets[key]['withDefaultChildren'] || false;
          const box = childWidgets[key];

          const canShowInCurrentLayout =
            box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;

          if (box.component.parent && resolveReferences(canShowInCurrentLayout, currentState)) {
            return (
              <DraggableBox
                onComponentClick={onComponentClick}
                onEvent={onEvent}
                onComponentOptionChanged={
                  checkParent(box)
                    ? onComponentOptionChangedForSubcontainer
                    : (component, optionName, value, componentId = '') => {
                        if (typeof value === 'function' && _.findKey(exposedVariables, optionName)) {
                          return Promise.resolve();
                        }
                        onOptionChange && onOptionChange({ component, optionName, value, componentId });
                      }
                }
                onComponentOptionsChanged={(component, variableSet, id) => {
                  checkParent(box)
                    ? onComponentOptionsChanged(component, variableSet)
                    : variableSet.map((item) => {
                        onOptionChange &&
                          onOptionChange({
                            component,
                            optionName: item[0],
                            value: item[1],
                            componentId: id,
                          });
                      });
                }}
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
                selectedComponent={selectedComponent}
                deviceWindowWidth={deviceWindowWidth}
                removeComponent={customRemoveComponent}
                canvasWidth={_containerCanvasWidth}
                readOnly={readOnly}
                darkMode={darkMode}
                customResolvables={customResolvables}
                onComponentHover={onComponentHover}
                hoveredComponent={hoveredComponent}
                parentId={parentComponent?.name}
                parent={parent}
                sideBarDebugger={sideBarDebugger}
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
        })} */}
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
