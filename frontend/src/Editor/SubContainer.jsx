/* eslint-disable import/no-named-as-default */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './editorConstants';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import _, { isEmpty } from 'lodash';
import {
  addNewWidgetToTheEditor,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  isPDFSupported,
  calculateMoveableBoxHeight,
} from '@/_helpers/appUtils';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import { restrictedWidgetsObj } from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig.js';
import { getCurrentState } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { componentTypes } from '@/AppBuilder/WidgetManager';

import { useEditorStore } from '@/_stores/editorStore';

// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { useGridStore, useResizingComponentId } from '@/_stores/gridStore';
import GhostWidget from './GhostWidget';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

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
                    propertiesDefinition={box?.component?.definition?.properties}
                    stylesDefinition={box?.component?.definition?.styles}
                    componentType={box?.component?.component}
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
  stylesDefinition,
  propertiesDefinition,
  componentType,
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

  const isComponentVisible = () => {
    const visibility =
      widget.component.definition?.properties?.visibility?.value ??
      widget.component.definition?.styles?.visibility?.value ??
      null;
    return resolveWidgetFieldValue(visibility);
  };

  let width = (canvasWidth * layoutData.width) / 43;
  width = width > canvasWidth ? canvasWidth : width; //this handles scenarios where the width is set more than canvas for older components

  const { label = { value: null } } = propertiesDefinition ?? {};

  const styles = {
    width: width + 'px',
    height: isComponentVisible()
      ? calculateMoveableBoxHeight(componentType, layoutData, stylesDefinition, label) + 'px'
      : '10px',
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

  return (
    <div
      className={
        isGhostComponent
          ? ''
          : readOnly
          ? `moveable-box position-absolute`
          : `target-${parent} target1-${parent} ele-${id} nested-target moveable-box target  ${
              isResizing ? 'resizing-target' : ''
            } ${isWidgetActive ? 'active-target' : ''} ${isDragging ? 'opacity-0' : ''}`
      }
      key={id}
      id={id}
      style={{ transform: `translate(332px, -134px)`, ...styles }}
      widget-id={id}
      widgetid={id}
      ref={widgetRef}
    >
      {children}
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
