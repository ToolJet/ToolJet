/* eslint-disable import/no-named-as-default */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './editorConstants';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import _, { isEmpty } from 'lodash';
import { componentTypes } from './WidgetManager/components';
import {
  addNewWidgetToTheEditor,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  isPDFSupported,
} from '@/_helpers/appUtils';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import { restrictedWidgetsObj } from '@/Editor/WidgetManager/restrictedWidgetsConfig';
import { getCurrentState } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';

import { useEditorStore } from '@/_stores/editorStore';

// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { useGridStore, useResizingComponentId } from '@/_stores/gridStore';
import GhostWidget from './GhostWidget';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import Moveable from 'react-moveable';

export const SubContainer = ({
  mode,
  snapToGrid,
  onComponentClick,
  onEvent,
  appDefinitionChanged,
  appLoading,
  zoomLevel,
  parent,
  parentRef,
  setSelectedComponent,
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
  height = '100%',
  currentPageId,
  childComponents = null,
  listmode = null,
  columns = 1,
  parentWidgetId,
  onDragInSubContainer,
  onResizeStopInSubContainer,
}) => {
  const appDefinition = useEditorStore((state) => state.appDefinition, shallow);

  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state.selectedComponents,
    }),
    shallow
  );

  const resizingComponentId = useResizingComponentId();

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
  }, [parentRef, getContainerCanvasWidth(), listmode, parentComponent?.definition?.properties?.size?.value]); // Listen for changes to the modal size and update the subcontainer state with the new grid width.

  zoomLevel = zoomLevel || 1;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allComponents = appDefinition.pages[currentPageId]?.components ?? {};

  const allChildComponents = useMemo(() => {
    const _childWidgets = {};
    Object.entries(allComponents).forEach(([componentId, componentData]) => {
      if (componentData?.component?.parent === parent) {
        _childWidgets[componentId] = componentData;
      }
    });

    return _childWidgets;
  }, [allComponents, parent]);

  const [childWidgets, setChildWidgets] = useState(() => allChildComponents);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const subContainerHeightRef = useRef(height ?? '100%');

  useEffect(() => {
    if (parent) {
      const _childWidgets = {};

      Object.entries(allComponents).forEach(([componentId, componentData]) => {
        if (componentData?.component?.parent === parent) {
          _childWidgets[componentId] = componentData;
        }
      });

      const shouldUpdate = !_.isEqual(childWidgets, _childWidgets);

      if (shouldUpdate) {
        setChildWidgets(_childWidgets);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allChildComponents), parent]);

  const containerWidth = getContainerCanvasWidth();

  const placeComponentInsideParent = (newComponent, canvasBoundingRect) => {
    const layout = newComponent?.layout?.desktop;
    let newWidth = layout.width,
      newHeight = layout.top + layout.height;
    if (layout) {
      if (newWidth + layout.left >= 43) {
        newWidth = 43 - layout.left;
      }
      if (newHeight > canvasBoundingRect.height) {
        newHeight = canvasBoundingRect.height - layout.top;
      }
      return {
        ...newComponent,
        layout: {
          desktop: {
            ...layout,
            height: newHeight,
            width: newWidth,
          },
          mobile: {
            ...layout,
            height: newHeight,
            width: newWidth,
          },
        },
      };
    }
    return newComponent;
  };

  const placeComponentInsideListView = (newComponent, canvasBoundingRect) => {
    const layout = newComponent?.layout?.desktop;
    if (layout && canvasBoundingRect.height <= layout.top) {
      let newTop = canvasBoundingRect.height - layout.height,
        newHeight = layout.height;
      if (newTop < 0) {
        newTop = 0;
        newHeight = canvasBoundingRect.height;
      }
      return {
        ...newComponent,
        layout: {
          desktop: {
            ...layout,
            top: newTop,
            height: newHeight,
          },
          mobile: {
            ...layout,
            top: newTop,
            height: newHeight,
          },
        },
      };
    }
    return newComponent;
  };

  useEffect(() => {
    useGridStore.getState().actions.setSubContainerWidths(parent, containerWidth / noOfGrids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);

  useEffect(() => {
    const definition = useEditorStore.getState().appDefinition;

    if (definition) {
      const newDefinition = {
        ...definition,
        pages: {
          ...definition.pages,
          [currentPageId]: {
            ...definition.pages[currentPageId],
            components: {
              ...definition.pages[currentPageId].components,
              ...childWidgets,
            },
          },
        },
      };

      const oldComponents = definition.pages[currentPageId]?.components ?? {};
      const newComponents = newDefinition.pages[currentPageId]?.components ?? {};

      const componendAdded = Object.keys(newComponents).length > Object.keys(oldComponents).length;

      const opts = { containerChanges: true };

      if (componendAdded) {
        opts.componentAdded = true;
      }

      const shouldUpdate = !_.isEmpty(diff(definition, newDefinition));

      if (shouldUpdate) {
        appDefinitionChanged(newDefinition, opts);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childWidgets]);

  const [{ isOver, isOverCurrent }, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop(item, monitor) {
        const didDrop = monitor.didDrop();
        if (didDrop && !parent) {
          return;
        }

        if (item.component.component === 'PDF' && !isPDFSupported()) {
          toast.error(
            'PDF is not supported in this version of browser. We recommend upgrading to the latest version for full support.'
          );
          return;
        }

        const componentMeta = deepClone(
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
          const currentActiveLayout = useEditorStore.getState().currentLayout;
          let newComponent = addNewWidgetToTheEditor(
            componentMeta,
            monitor,
            { ...allComponents, ...childWidgets },
            canvasBoundingRect,
            currentActiveLayout,
            snapToGrid,
            zoomLevel,
            true
          );

          if (parentComp === 'Listview') {
            newComponent = placeComponentInsideListView(newComponent, canvasBoundingRect);
          }
          if (componentMeta.component === 'Form') {
            newComponent = placeComponentInsideParent(newComponent, canvasBoundingRect);
          }

          // Logic to add default child components
          const childrenBoxes = {};
          if (componentMeta.defaultChildren) {
            const parentMeta = componentMeta;
            const widgetResolvables = Object.freeze({
              Listview: 'listItem',
            });
            const customResolverVariable = widgetResolvables[parentMeta?.component];
            const defaultChildren = deepClone(parentMeta)['defaultChildren'];
            const parentId = newComponent.id;

            defaultChildren.forEach((child) => {
              const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue, styles } =
                child;

              const componentMeta = deepClone(
                componentTypes.find((component) => component.component === componentName)
              );
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

              const newChildComponent = addNewWidgetToTheEditor(
                componentData,
                {},
                { ...allComponents, ...childrenBoxes },
                {},
                currentActiveLayout,
                snapToGrid,
                zoomLevel,
                true,
                true
              );

              _.set(childrenBoxes, newChildComponent.id, {
                component: {
                  ...newChildComponent.component,
                  parent: parentMeta.component === 'Tabs' ? parentId + '-' + tab : parentId,
                },

                layouts: {
                  [currentActiveLayout]: {
                    ...layout,
                    width: incrementWidth ? width * incrementWidth : width,
                    height: height,
                  },
                },
              });
            });
          }

          if (newComponent.withDefaultChildren) {
            if (appDefinitionChanged) {
              const newDefinition = {
                ...appDefinition,
                pages: {
                  ...appDefinition.pages,
                  [currentPageId]: {
                    ...appDefinition.pages[currentPageId],
                    components: {
                      ...appDefinition.pages[currentPageId].components,
                      [newComponent.id]: {
                        component: {
                          ...newComponent.component,
                          parent: parentRef.current.id,
                        },
                        layouts: {
                          ...newComponent.layout,
                        },
                        withDefaultChildren: false,
                      },
                      ...childrenBoxes,
                    },
                  },
                },
              };

              const oldComponents = appDefinition.pages[currentPageId]?.components ?? {};
              const newComponents = newDefinition.pages[currentPageId]?.components ?? {};

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
          } else {
            setChildWidgets((prev) => {
              return {
                ...prev,
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
              };
            });
          }

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
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    }),
    [parent, appDefinition]
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
        return width;
      }
    }

    return useEditorStore.getState().editorCanvasWidth;
  }

  function paramUpdated(id, param, value) {
    if (id === 'resizingComponentId') {
      return;
    }
    if (Object.keys(value).length > 0) {
      setChildWidgets((boxes) => {
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

  const getContainerProps = (componentId) => {
    const currentState = getCurrentState();
    return {
      mode,
      snapToGrid,
      onComponentClick,
      onEvent,
      appDefinition,
      appDefinitionChanged,
      currentState,
      appLoading,
      zoomLevel,
      setSelectedComponent,
      removeComponent,
      currentLayout,
      selectedComponents,
      darkMode,
      readOnly,
      onComponentHover,
      hoveredComponent,
      sideBarDebugger,
      currentPageId,
      childComponents,
    };
  };

  return (
    <SubContianerWrapper
      drop={drop}
      styles={styles}
      parent={parent}
      isDragging={isDragging || isOver}
      isResizing={isResizing}
      isGridActive={isGridActive}
      readOnly={readOnly}
      parentWidgetId={parentWidgetId}
    >
      <div className="root h-100">
        <div
          className={`container-fluid p-0 h-100 drag-container-parent`}
          component-id={parent}
          data-parent-type={parentComponent?.component}
        >
          {checkParentVisibility() &&
            Object.entries({
              ...childWidgets,
            }).map(([key, box]) => {
              const activeLayout = useEditorStore.getState().currentLayout;
              const canShowInCurrentLayout =
                box.component.definition.others[activeLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;

              if (box.component.parent && resolveWidgetFieldValue(canShowInCurrentLayout)) {
                return (
                  <SubWidgetWrapper
                    isResizing={resizingComponentId === key}
                    key={key}
                    id={key}
                    parent={parent}
                    widget={box}
                    readOnly={readOnly}
                    currentLayout={activeLayout}
                    canvasWidth={_containerCanvasWidth}
                    gridWidth={gridWidth}
                    isGhostComponent={key === 'resizingComponentId'}
                    mode={mode}
                    widgets={childWidgets}
                    onDragInSubContainer={onDragInSubContainer}
                    onResizeStopInSubContainer={onResizeStopInSubContainer}
                  >
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
                      // key={key}
                      paramUpdated={paramUpdated}
                      id={key}
                      allComponents={allComponents}
                      {...box}
                      mode={mode}
                      inCanvas={true}
                      zoomLevel={zoomLevel}
                      selectedComponent={selectedComponent}
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
                      parentId={parent}
                      isMultipleComponentsSelected={selectedComponents?.length > 1 ? true : false}
                      exposedVariables={exposedVariables ?? {}}
                      getContainerProps={getContainerProps}
                      isFromSubContainer={true}
                      childComponents={childComponents[key]}
                    />
                  </SubWidgetWrapper>
                );
              }
            })}
          <ResizeGhostWidget
            resizingComponentId={resizingComponentId}
            widgets={childWidgets}
            currentLayout={currentLayout}
            canvasWidth={_containerCanvasWidth}
            gridWidth={gridWidth}
          />
        </div>
      </div>
      {appLoading && (
        <div className="mx-auto mt-5 w-50 p-5">
          <center>
            <div className="progress progress-sm w-50">
              <div className="progress-bar progress-bar-indeterminate"></div>
            </div>
          </center>
        </div>
      )}
    </SubContianerWrapper>
  );
};

const ResizeGhostWidget = ({ resizingComponentId, widgets, currentLayout, canvasWidth, gridWidth }) => {
  if (!resizingComponentId) {
    return '';
  }

  return (
    <GhostWidget
      layouts={widgets?.[resizingComponentId]?.layouts}
      currentLayout={currentLayout}
      canvasWidth={canvasWidth}
      gridWidth={gridWidth}
    />
  );
};

const SubWidgetWrapper = ({
  parent,
  readOnly,
  id,
  widget,
  currentLayout,
  canvasWidth,
  gridWidth,
  children,
  isResizing,
  isGhostComponent,
  mode,
  widgets,
  draggedSubContainer,
  onDragInSubContainer,
  onResizeStopInSubContainer,
}) => {
  const { layouts } = widget;

  const widgetRef = useRef(null);

  const isOnScreen = useOnScreen(widgetRef);

  const layoutData = layouts[currentLayout] || layouts['desktop'] || {};
  const isSelected = useEditorStore((state) => {
    const isSelected = (state.selectedComponents || []).length === 1 && state?.selectedComponents?.[0]?.id === id;
    return state?.hoveredComponent == id || isSelected;
  }, shallow);

  const isDragging = useGridStore((state) => state?.draggingComponentId === id);

  // const targetRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedOverElemRef = useRef(null);

  const hoveredComponent = useEditorStore((state) => state?.hoveredComponent, shallow);

  const isComponentVisible = () => {
    const visibility =
      widget.component.definition?.properties?.visibility?.value ??
      widget.component.definition?.styles?.visibility?.value ??
      null;
    return resolveWidgetFieldValue(visibility);
  };

  let width = (canvasWidth * layoutData.width) / 43;
  width = width > canvasWidth ? canvasWidth : width; //this handles scenarios where the width is set more than canvas for older components
  const styles = {
    width: width + 'px',
    height: isComponentVisible() ? layoutData.height + 'px' : '10px',
    transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    ...(isGhostComponent ? { opacity: 0.5 } : {}),
  };

  const isWidgetActive = (isSelected || isDragging) && mode !== 'view';

  useEffect(() => {
    const controlBox = document.querySelector(`[target-id="${id}"]`);
    // console.log('controlBox', { hide: !isOnScreen && isSelected && !isDragging && !isResizing, isOnScreen });
    //adding attribute instead of class since react-moveable seems to replace classes internally on scroll stop
    if (!isOnScreen && isSelected && !isDragging && !isResizing) {
      controlBox?.classList.add('hide-control');
      controlBox?.setAttribute('data-off-screen', 'true');
    } else {
      // controlBox?.classList.remove('hide-control');
      controlBox?.removeAttribute('data-off-screen');
    }
  }, [isOnScreen]);

  if (isEmpty(layoutData)) {
    return '';
  }

  function getOffset(childElement, grandparentElement) {
    if (!childElement || !grandparentElement) return null;

    // Get bounding rectangles for both elements
    const childRect = childElement.getBoundingClientRect();
    const grandparentRect = grandparentElement.getBoundingClientRect();

    // Calculate offset by subtracting grandparent's position from child's position
    const offsetX = childRect.left - grandparentRect.left;
    const offsetY = childRect.top - grandparentRect.top;

    return { x: offsetX, y: offsetY };
  }

  const boxList = Object.entries(widgets)
    .filter(([id, box]) =>
      ['{{true}}', true].includes(
        box?.component?.definition?.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop']?.value
      )
    )
    .map(([id, box]) => ({
      id: id,
      height: box?.layouts?.[currentLayout]?.height,
      left: box?.layouts?.[currentLayout]?.left,
      top: box?.layouts?.[currentLayout]?.top,
      width: box?.layouts?.[currentLayout]?.width,
      parent: box?.component?.parent,
    }));

  const getWidgetType = (id) => {
    const allWidgets =
      useEditorStore.getState().appDefinition.pages[useEditorStore.getState().currentPageId].components;

    return allWidgets[id]?.component?.component;
  };

  const DimensionViewable = {
    name: 'dimensionViewable',
    props: [],
    events: [],
    // render() {
    //   return configHandleForMultiple('multiple-components-config-handle');
    // },
  };

  const MouseCustomAble = {
    name: 'mouseTest',
    props: {},
    events: {},
    mouseEnter(e) {
      const controlBoxes = document.getElementsByClassName('moveable-control-box');
      for (const element of controlBoxes) {
        element.classList.remove('moveable-control-box-d-block');
      }
      e.props.target.classList.add('hovered');
      e.controlBox.classList.add('moveable-control-box-d-block');
    },
    mouseLeave(e) {
      e.props.target.classList.remove('hovered');
      e.controlBox.classList.remove('moveable-control-box-d-block');
    },
  };

  const RESIZABLE_CONFIG = {
    edge: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
    renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
  };

  return (
    <div
      className={
        isGhostComponent
          ? ''
          : readOnly
          ? `moveable-box position-absolute`
          : `target-${parent} target1-${parent} ele-${id} nested-target moveable-box target  ${
              isResizing ? 'resizing-target' : ''
            } ${isWidgetActive ? 'hovered-target' : ''} ${isDragging ? 'opacity-0' : ''}`
      }
      key={id}
      id={id}
      style={{ transform: `translate(332px, -134px)`, ...styles }}
      widget-id={id}
      widgetid={id}
      ref={widgetRef}
    >
      {children}
      <Moveable
        target={widgetRef}
        draggable={true}
        resizable={true}
        renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
        throttleDrag={1}
        edgeDraggable={false}
        startDragRotate={0}
        throttleDragRotate={0}
        ables={[MouseCustomAble, DimensionViewable]}
        // resizable={RESIZABLE_CONFIG}
        onDrag={(e) => {
          if (!isDraggingRef.current) {
            useGridStore.getState().actions.setDraggingComponentId(e.target.id);
            isDraggingRef.current = true;
          }
          if (draggedSubContainer) {
            return;
          }

          if (!draggedSubContainer) {
            const parentComponent = widgets[widgets[e.target.id]?.component?.parent];
            let top = e.translate[1];
            let left = e.translate[0];

            if (parentComponent?.component?.component === 'Modal') {
              const elemContainer = e.target.closest('.real-canvas');
              const containerHeight = elemContainer.clientHeight;
              const containerWidth = elemContainer.clientWidth;
              const maxY = containerHeight - e.target.clientHeight;
              const maxLeft = containerWidth - e.target.clientWidth;
              top = top < 0 ? 0 : top > maxY ? maxY : top;
              left = left < 0 ? 0 : left > maxLeft ? maxLeft : left;
            }

            e.target.style.transform = `translate(${left}px, ${top}px)`;
            e.target.setAttribute(
              'widget-pos2',
              `translate: ${e.translate[0]} | Round: ${
                Math.round(e.translate[0] / gridWidth) * gridWidth
              } | ${gridWidth}`
            );
          }

          if (document.elementFromPoint(e.clientX, e.clientY)) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const draggedOverElements = targetElems.filter(
              (ele) =>
                ele.id !== e.target.id && (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
            );
            const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
            const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));

            var canvasElms = document.getElementsByClassName('sub-canvas');
            var elementsArray = Array.from(canvasElms);
            elementsArray.forEach(function (element) {
              element.classList.remove('show-grid');
              element.classList.add('hide-grid');
            });
            const parentWidgetId = draggedOverContainer.getAttribute('data-parent') || draggedOverElem?.id;
            document.getElementById('canvas-' + parentWidgetId)?.classList.add('show-grid');

            useGridStore.getState().actions.setDragTarget(parentWidgetId);

            if (
              draggedOverElemRef.current?.id !== draggedOverContainer?.id &&
              !draggedOverContainer.classList.contains('hide-grid')
            ) {
              draggedOverContainer.classList.add('show-grid');
              draggedOverElemRef.current && draggedOverElemRef.current.classList.remove('show-grid');
              draggedOverElemRef.current = draggedOverContainer;
            }
          }

          const offset = getOffset(e.target, document.querySelector('#real-canvas'));
          if (document.getElementById('moveable-drag-ghost')) {
            document.getElementById('moveable-drag-ghost').style.transform = `translate(${offset.x}px, ${offset.y}px)`;
            document.getElementById('moveable-drag-ghost').style.width = `${e.target.clientWidth}px`;
            document.getElementById('moveable-drag-ghost').style.height = `${e.target.clientHeight}px`;
          }
        }}
        onDragStart={(e) => {
          e?.moveable?.controlBox?.removeAttribute('data-off-screen');
          const box = widget;
          let isDragOnTable = false;

          /* If the drag or click is on a calender popup draggable interactions are not executed so that popups and other components inside calender popup works. 
            Also user dont need to drag an calender from using popup */
          if (hasParentWithClass(e.inputEvent.target, 'react-datepicker-popper')) {
            return false;
          }

          /* Checking if the dragged elemenent is a table. If its a table drag is disabled since it will affect column resizing and reordering */
          if (box?.component?.component === 'Table') {
            const tableElem = e.target.querySelector('.jet-data-table');
            isDragOnTable = tableElem.contains(e.inputEvent.target);
          }

          if (
            ['RangeSlider', 'Container', 'BoundedBox', 'Kanban'].includes(box?.component?.component) ||
            isDragOnTable
          ) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const isHandle = targetElems.find((ele) => ele.classList.contains('handle-content'));
            if (!isHandle) {
              return false;
            }
          }
          if (hoveredComponent !== e.target.id) {
            return false;
          }
        }}
        onDragEnd={(e) => {
          try {
            if (isDraggingRef.current) {
              useGridStore.getState().actions.setDraggingComponentId(null);
              isDraggingRef.current = false;
            }

            if (draggedSubContainer) {
              return;
            }

            let draggedOverElemId = widgets[e.target.id]?.component?.parent;

            let draggedOverElemIdType;
            const parentComponent = widgets[widgets[e.target.id]?.component?.parent];

            let draggedOverElem;
            if (document.elementFromPoint(e.clientX, e.clientY) && parentComponent?.component?.component !== 'Modal') {
              const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
              draggedOverElem = targetElems.find((ele) => {
                const isOwnChild = e.target.contains(ele); // if the hovered element is a child of actual draged element its not considered
                if (isOwnChild) return false;

                let isDroppable = ele.id !== e.target.id && ele.classList.contains('drag-container-parent');

                if (isDroppable) {
                  // debugger;
                  let widgetId = ele?.getAttribute('component-id') || ele.id;
                  let widgetType = getWidgetType(widgetId);

                  if (!widgetType) {
                    widgetId = widgetId.split('-').slice(0, -1).join('-');

                    widgetType = widgets[widgetId]?.component?.component;
                  }
                  if (
                    !['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container', 'Table'].includes(
                      widgetType
                    )
                  ) {
                    isDroppable = false;
                  }
                }

                return isDroppable;
              });

              draggedOverElemId = draggedOverElem?.getAttribute('component-id') || draggedOverElem?.id;
              draggedOverElemIdType = draggedOverElem?.getAttribute('data-parent-type');
            }

            const _gridWidth = useGridStore.getState().subContainerWidths[draggedOverElemId] || gridWidth;

            const currentParentId = widgets[id]?.component?.parent;
            let left = e.lastEvent.translate[0];
            let top = e.lastEvent.translate[1];

            if (['Listview', 'Kanban'].includes(widgets[draggedOverElemId]?.component?.component)) {
              const elemContainer = e.target.closest('.real-canvas');
              const containerHeight = elemContainer.clientHeight;
              const maxY = containerHeight - e.target.clientHeight;
              top = top > maxY ? maxY : top;
            }

            const currentWidget = widget?.component?.component;
            const parentWidget = draggedOverElemIdType === 'Kanban' ? 'Kanban_card' : draggedOverElemIdType;
            const restrictedWidgets = restrictedWidgetsObj?.[parentWidget] || [];
            const isParentChangeAllowed = !restrictedWidgets.includes(currentWidget);

            if (draggedOverElemId !== currentParentId) {
              // debugger;
              if (isParentChangeAllowed) {
                const draggedOverWidget = widgets[draggedOverElemId];
                let { left: _left, top: _top } = getMouseDistanceFromParentDiv(
                  e,
                  draggedOverWidget?.component?.component === 'Kanban' ? draggedOverElem : draggedOverElemId,
                  widgets[draggedOverElemId]?.component?.component
                );
                left = _left;
                top = _top;
              } else {
                const currBox = widgets[e.target.id];

                left = currBox.left * gridWidth;
                top = currBox.top;
                toast.error(`${currentWidget} is not compatible as a child component of ${parentWidget}`);
                e.target.style.transform = `translate(${left}px, ${top}px)`;
              }
            }

            e.target.style.transform = `translate(${Math.round(left / _gridWidth) * _gridWidth}px, ${
              Math.round(top / 10) * 10
            }px)`;

            if (draggedOverElemId === currentParentId || isParentChangeAllowed) {
              onDragInSubContainer([
                {
                  id: e.target.id,
                  x: left,
                  y: Math.round(top / 10) * 10,
                  parent: isParentChangeAllowed ? draggedOverElemId : undefined,
                },
              ]);
            }
            const box = widgets[e.target.id];
            setTimeout(() => useEditorStore.getState().actions.setSelectedComponents([{ ...box }]));
          } catch (error) {
            console.log('draggedOverElemId->error', error);
          }
          var canvasElms = document.getElementsByClassName('sub-canvas');
          var elementsArray = Array.from(canvasElms);
          elementsArray.forEach(function (element) {
            element.classList.remove('show-grid');
            element.classList.add('hide-grid');
          });
        }}
        onResize={(e) => {
          const currentLayout = boxList.find(({ id }) => id === e.target.id);
          const currentWidget = widgets[e.target.id];
          let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
          document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.add('show-grid');
          useGridStore.getState().actions.setDragTarget(currentWidget.component?.parent);
          const currentWidth = currentLayout.width * _gridWidth;
          const diffWidth = e.width - currentWidth;
          const diffHeight = e.height - currentLayout.height;
          const isLeftChanged = e.direction[0] === -1;
          const isTopChanged = e.direction[1] === -1;

          let transformX = currentLayout.left * _gridWidth;
          let transformY = currentLayout.top;
          if (isLeftChanged) {
            transformX = currentLayout.left * _gridWidth - diffWidth;
          }
          if (isTopChanged) {
            transformY = currentLayout.top - diffHeight;
          }

          const elemContainer = e.target.closest('.real-canvas');
          const containerHeight = elemContainer.clientHeight;
          const containerWidth = elemContainer.clientWidth;
          const maxY = containerHeight - e.target.clientHeight;
          const maxLeft = containerWidth - e.target.clientWidth;
          const maxWidthHit = transformX < 0 || transformX >= maxLeft;
          const maxHeightHit = transformY < 0 || transformY >= maxY;
          transformY = transformY < 0 ? 0 : transformY > maxY ? maxY : transformY;
          transformX = transformX < 0 ? 0 : transformX > maxLeft ? maxLeft : transformX;

          if (!maxWidthHit || e.width < e.target.clientWidth) {
            e.target.style.width = `${e.width}px`;
          }
          if (!maxHeightHit || e.height < e.target.clientHeight) {
            e.target.style.height = `${e.height}px`;
          }
          e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
        }}
        onResizeEnd={(e) => {
          try {
            useGridStore.getState().actions.setResizingComponentId(null);
            // setIsResizing(false);
            const currentWidget = widgets[e.target.id];
            document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.remove('show-grid');
            let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
            let width = Math.round(e.lastEvent.width / _gridWidth) * _gridWidth;
            const height = Math.round(e.lastEvent.height / 10) * 10;

            const currentLayout = boxList.find(({ id }) => id === e.target.id);
            const currentWidth = currentLayout.width * _gridWidth;
            const diffWidth = e.lastEvent.width - currentWidth;
            const diffHeight = e.lastEvent.height - currentLayout.height;
            const isLeftChanged = e.lastEvent.direction[0] === -1;
            const isTopChanged = e.lastEvent.direction[1] === -1;

            let transformX = currentLayout.left * _gridWidth;
            let transformY = currentLayout.top;
            if (isLeftChanged) {
              transformX = currentLayout.left * _gridWidth - diffWidth;
            }
            if (isTopChanged) {
              transformY = currentLayout.top - diffHeight;
            }

            width = adjustWidth(width, transformX, _gridWidth);
            const elemContainer = e.target.closest('.real-canvas');
            const containerHeight = elemContainer.clientHeight;
            const containerWidth = elemContainer.clientWidth;
            const maxY = containerHeight - e.target.clientHeight;
            const maxLeft = containerWidth - e.target.clientWidth;
            const maxWidthHit = transformX < 0 || transformX >= maxLeft;
            const maxHeightHit = transformY < 0 || transformY >= maxY;
            transformY = transformY < 0 ? 0 : transformY > maxY ? maxY : transformY;
            transformX = transformX < 0 ? 0 : transformX > maxLeft ? maxLeft : transformX;

            const roundedTransformY = Math.round(transformY / 10) * 10;
            transformY = transformY % 10 === 5 ? roundedTransformY - 10 : roundedTransformY;
            e.target.style.transform = `translate(${Math.round(transformX / _gridWidth) * _gridWidth}px, ${
              Math.round(transformY / 10) * 10
            }px)`;
            if (!maxWidthHit || e.width < e.target.clientWidth) {
              e.target.style.width = `${Math.round(e.lastEvent.width / _gridWidth) * _gridWidth}px`;
            }
            if (!maxHeightHit || e.height < e.target.clientHeight) {
              e.target.style.height = `${Math.round(e.lastEvent.height / 10) * 10}px`;
            }
            const resizeData = {
              id: e.target.id,
              height: height,
              width: width,
              x: transformX,
              y: transformY,
            };
            if (currentWidget.component?.parent) {
              resizeData.gw = _gridWidth;
            }
            // Adding the new updates to the macro task queue to unblock UI
            // setTimeout(() => {
            // });
            onResizeStopInSubContainer([resizeData]);
          } catch (error) {
            console.error('ResizeEnd error ->', error);
          }
          useGridStore.getState().actions.setDragTarget();
        }}
        onResizeStart={(e) => {
          performance.mark('onResizeStart');
          useGridStore.getState().actions.setResizingComponentId(e.target.id);
          e.setMin([gridWidth, 10]);
        }}
      />
    </div>
  );
};

const SubContianerWrapper = ({ children, isDragging, isResizing, isGridActive, readOnly, drop, styles, parent }) => {
  return (
    <div
      ref={drop}
      style={styles}
      id={`canvas-${parent}`}
      data-parent={parent}
      className={`sub-canvas real-canvas ${
        (isDragging || isResizing || isGridActive) && !readOnly ? 'show-grid' : 'hide-grid'
      }`}
    >
      {children}
    </div>
  );
};

export default function useOnScreen(ref) {
  const [isIntersecting, setIntersecting] = useState(false);
  const currentLayout = useEditorStore((state) => state.currentLayout);

  const observer = useMemo(() => {
    if (ref?.current) {
      new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), {
        root: ref.current?.closest('.real-canvas'),
        threshold: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current, currentLayout]);

  useEffect(() => {
    if (observer) {
      observer.observe(ref.current);
    }
    return () => observer && observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isIntersecting;
}

function hasParentWithClass(child, className) {
  let currentElement = child;

  while (currentElement !== null && currentElement !== document.documentElement) {
    if (currentElement.classList.contains(className)) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }

  return false;
}

function getMouseDistanceFromParentDiv(event, id, parentWidgetType) {
  let parentDiv = id
    ? typeof id === 'string'
      ? document.getElementById(id)
      : id
    : document.getElementsByClassName('real-canvas')[0];
  if (parentWidgetType === 'Container') {
    parentDiv = document.getElementById('canvas-' + id);
  }

  // Get the bounding rectangle of the parent div.
  const parentDivRect = parentDiv.getBoundingClientRect();
  const targetDivRect = event.target.getBoundingClientRect();

  const mouseX = targetDivRect.left - parentDivRect.left;
  const mouseY = targetDivRect.top - parentDivRect.top;

  // Calculate the distance from the mouse pointer to the top and left edges of the parent div.
  const top = mouseY;
  const left = mouseX;

  return { top, left };
}

function adjustWidth(width, posX, gridWidth) {
  posX = Math.round(posX / gridWidth);
  width = Math.round(width / gridWidth);
  if (posX + width > 43) {
    width = 43 - posX;
  }
  return width * gridWidth;
}
