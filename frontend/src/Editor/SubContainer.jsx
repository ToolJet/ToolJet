/* eslint-disable import/no-named-as-default */
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { EditorConstants, ItemTypes } from './editorConstants';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import _, { isEmpty } from 'lodash';
import { componentTypes } from './WidgetManager/components';
import { addNewWidgetToTheEditor, onComponentOptionChanged, onComponentOptionsChanged } from '@/_helpers/appUtils';
import { resolveReferences } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import { restrictedWidgetsObj } from '@/Editor/WidgetManager/restrictedWidgetsConfig';
import { useCurrentState } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { useMounted } from '@/_hooks/use-mount';
import { useEditorStore } from '@/_stores/editorStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
// eslint-disable-next-line import/namespace
import { useGridStore, useResizingComponentId } from '@/_stores/gridStore';
import { isPDFSupported } from '@/_stores/utils';
import GhostWidget from './GhostWidget';

const deviceWindowWidth = EditorConstants.deviceWindowWidth;

export const SubContainer = ({
  mode,
  snapToGrid,
  onComponentClick,
  onEvent,
  // appDefinition,
  appDefinitionChanged,
  // onComponentOptionChanged,
  // onComponentOptionsChanged,
  appLoading,
  zoomLevel,
  parent,
  parentRef,
  setSelectedComponent,
  // deviceWindowWidth,
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
  // setSubContainerWidths,
  parentWidgetId,
  // turnOffAutoLayout,
}) => {
  //Todo add custom resolve vars for other widgets too
  const mounted = useMounted();
  const widgetResolvables = Object.freeze({
    Listview: 'listItem',
  });

  const appDefinition = useEditorStore((state) => state.appDefinition, shallow);

  const customResolverVariable = widgetResolvables[parentComponent?.component];
  const currentState = useCurrentState();
  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state.selectedComponents,
    }),
    shallow
  );

  const resizingComponentId = useResizingComponentId();

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

  // const [boxes, setBoxes] = useState(allComponents);
  const [childWidgets, setChildWidgets] = useState(() => allChildComponents);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  // const [subContainerHeight, setSubContainerHeight] = useState('100%'); //used to determine the height of the sub container for modal
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

  // useEffect(() => {
  //   try {
  //     const isParentScrollable = SUBCONTAINER_WITH_SCROLL.has(allComponents[parent]?.component?.component);
  //     const canvasBounds = parentRef.current.getBoundingClientRect();
  //     const subContainerHeight = canvasBounds.height - 30;
  //     const componentBottom = Object.values(childWidgets).reduce(function (max, currentElement) {
  //       let currentSum = currentElement.layouts[currentLayout].top + currentElement.layouts[currentLayout].height;
  //       return Math.max(max, currentSum);
  //     }, 0);

  //     if (isParentScrollable && subContainerHeight <= componentBottom) {
  //       subContainerHeightRef.current = componentBottom + 100;
  //     }
  //   } catch (error) {
  //     console.error('console.error', error);
  //   }
  // }, [childWidgets]);

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

  // useEffect(() => {
  //   if (mounted) {
  //     //find children with parent prop
  //     const children = Object.keys(allComponents).filter((key) => {
  //       if (key === parent) return false;
  //       return allComponents[key].parent === parent;
  //     });

  //     if (children.length === 0 && addDefaultChildren === true) {
  //       const defaultChildren = _.cloneDeep(parentComponent)['defaultChildren'];
  //       const childrenBoxes = {};
  //       const parentId =
  //         parentComponent.component !== 'Tabs'
  //           ? parentRef.current.id
  //           : parentRef.current.id?.substring(0, parentRef.current.id.lastIndexOf('-'));

  //       const _allComponents = JSON.parse(JSON.stringify(allComponents));

  //       defaultChildren.forEach((child) => {
  //         const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue, styles } = child;

  //         const componentMeta = _.cloneDeep(componentTypes.find((component) => component.component === componentName));
  //         const componentData = JSON.parse(JSON.stringify(componentMeta));

  //         const width = layout.width ? layout.width : (componentMeta.defaultSize.width * 100) / noOfGrids;
  //         const height = layout.height ? layout.height : componentMeta.defaultSize.height;
  //         const newComponentDefinition = {
  //           ...componentData.definition.properties,
  //         };

  //         if (_.isArray(properties) && properties.length > 0) {
  //           properties.forEach((prop) => {
  //             const accessor = customResolverVariable
  //               ? `{{${customResolverVariable}.${accessorKey}}}`
  //               : defaultValue[prop] || '';

  //             _.set(newComponentDefinition, prop, {
  //               value: accessor,
  //             });
  //           });
  //           _.set(componentData, 'definition.properties', newComponentDefinition);
  //         }

  //         if (_.isArray(styles) && styles.length > 0) {
  //           styles.forEach((prop) => {
  //             const accessor = customResolverVariable
  //               ? `{{${customResolverVariable}.${accessorKey}}}`
  //               : defaultValue[prop] || '';

  //             _.set(newComponentDefinition, prop, {
  //               value: accessor,
  //             });
  //           });
  //           _.set(componentData, 'definition.styles', newComponentDefinition);
  //         }

  //         const newComponent = addNewWidgetToTheEditor(
  //           componentData,
  //           {},
  //           { ..._allComponents, ...childrenBoxes },
  //           {},
  //           currentLayout,
  //           snapToGrid,
  //           zoomLevel,
  //           true,
  //           true
  //         );

  //         _.set(childrenBoxes, newComponent.id, {
  //           component: {
  //             ...newComponent.component,
  //             parent: parentComponent.component === 'Tabs' ? parentId + '-' + tab : parentId,
  //           },

  //           layouts: {
  //             [currentLayout]: {
  //               ...layout,
  //               width: incrementWidth ? width * incrementWidth : width,
  //               height: height,
  //             },
  //           },
  //         });
  //       });

  //       // _allComponents[parentId] = {
  //       //   ...allComponents[parentId],
  //       //   withDefaultChildren: false,
  //       // };
  //       const allChildren = getChildWidgets(allComponents);

  //       setChildWidgets(allChildren);
  //       // setBoxes({
  //       //   ..._allComponents,
  //       //   ...childrenBoxes,
  //       // });
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [mounted]);

  const moveBox = useCallback(
    (id, left, top) => {
      setChildWidgets(
        update(childWidgets, {
          [id]: {
            $merge: { left, top },
          },
        })
      );
    },
    [childWidgets]
  );

  useEffect(() => {
    if (appDefinitionChanged) {
      const newDefinition = {
        ...appDefinition,
        pages: {
          ...appDefinition.pages,
          [currentPageId]: {
            ...appDefinition.pages[currentPageId],
            components: {
              ...appDefinition.pages[currentPageId].components,
              ...childWidgets,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childWidgets]);

  // const { draggingState } = useDragLayer((monitor) => {
  //   // TODO: Need to move to a performant version of the block below
  //   if (monitor.getItem()) {
  //     if (monitor.getItem().id === undefined) {
  //       if (parentRef.current) {
  //         const currentOffset = monitor.getSourceClientOffset();
  //         if (currentOffset) {
  //           const canvasBoundingRect = parentRef?.current
  //             ?.getElementsByClassName('real-canvas')[0]
  //             ?.getBoundingClientRect();
  //           if (!canvasBoundingRect) return { draggingState: false };
  //           if (
  //             currentOffset.x > canvasBoundingRect.x &&
  //             currentOffset.x < canvasBoundingRect.x + canvasBoundingRect.width
  //           ) {
  //             return { draggingState: true };
  //           }
  //         }
  //       }
  //     }
  //   }

  //   if (monitor.isDragging() && monitor.getItem().parent) {
  //     if (monitor.getItem().parent === parent) {
  //       return { draggingState: true };
  //     } else {
  //       return { draggingState: false };
  //     }
  //   } else {
  //     return { draggingState: false };
  //   }
  // });

  //!Todo: need to check: this never gets called as draggingState is always false
  // useEffect(() => {
  //   setIsDragging(draggingState);
  // }, [draggingState]);

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
          let newComponent = addNewWidgetToTheEditor(
            componentMeta,
            monitor,
            { ...allComponents, ...childWidgets },
            canvasBoundingRect,
            item.currentLayout,
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
    [parent]
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
    return {
      mode,
      snapToGrid,
      onComponentClick,
      onEvent,
      appDefinition,
      appDefinitionChanged,
      currentState,
      // onComponentOptionChanged,
      // onComponentOptionsChanged,
      appLoading,
      zoomLevel,
      setSelectedComponent,
      removeComponent,
      currentLayout,
      // deviceWindowWidth,
      selectedComponents,
      darkMode,
      readOnly,
      onComponentHover,
      hoveredComponent,
      sideBarDebugger,
      addDefaultChildren,
      currentPageId,
      childComponents,
    };
  };

  return (
    <SubContianerWrapper
      drop={drop}
      styles={styles}
      parent={parent}
      isDragging={isDragging}
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
              // ...(resizingComponentId &&
              //   childWidgets[resizingComponentId] && { resizingComponentId: childWidgets[resizingComponentId] }),
            }).map(([key, box]) => {
              const canShowInCurrentLayout =
                box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;

              if (box.component.parent && resolveReferences(canShowInCurrentLayout, currentState)) {
                return (
                  <SubWidgetWrapper
                    isResizing={resizingComponentId === key}
                    key={key}
                    id={key}
                    parent={parent}
                    widget={box}
                    readOnly={readOnly}
                    currentLayout={currentLayout}
                    canvasWidth={_containerCanvasWidth}
                    gridWidth={gridWidth}
                    isGhostComponent={key === 'resizingComponentId'}
                    mode={mode}
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
                      // resizingStatusChanged={(status) => setIsResizing(status)}
                      // draggingStatusChanged={(status) => setIsDragging(status)}
                      inCanvas={true}
                      zoomLevel={zoomLevel}
                      // setSelectedComponent={setSelectedComponent}
                      selectedComponent={selectedComponent}
                      // deviceWindowWidth={deviceWindowWidth}
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
                      // sideBarDebugger={sideBarDebugger}
                      isMultipleComponentsSelected={selectedComponents?.length > 1 ? true : false}
                      exposedVariables={exposedVariables ?? {}}
                      // childComponents={childComponents[key]}
                      // containerProps={{
                      //   mode,
                      //   snapToGrid,
                      //   onComponentClick,
                      //   onEvent,
                      //   appDefinition,
                      //   appDefinitionChanged,
                      //   currentState,
                      //   onComponentOptionChanged,
                      //   onComponentOptionsChanged,
                      //   appLoading,
                      //   zoomLevel,
                      //   setSelectedComponent,
                      //   removeComponent,
                      //   currentLayout,
                      //   deviceWindowWidth,
                      //   selectedComponents,
                      //   darkMode,
                      //   readOnly,
                      //   onComponentHover,
                      //   hoveredComponent,
                      //   sideBarDebugger,
                      //   addDefaultChildren,
                      //   currentPageId,
                      //   childComponents,
                      //   setSubContainerWidths,
                      // }}
                      getContainerProps={getContainerProps}
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
      {/* <GhostWidget layout={childWidgets[]} */}
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
}) => {
  const { layouts } = widget;
  const widgetRef = useRef();
  const isOnScreen = useOnScreen(widgetRef);

  const layoutData = layouts?.[currentLayout] || layouts?.['desktop'];
  const isSelected = useEditorStore((state) => {
    const isSelected = (state.selectedComponents || []).length === 1 && state?.selectedComponents?.[0]?.id === id;
    return state?.hoveredComponent == id || isSelected;
  }, shallow);

  const isDragging = useGridStore((state) => state?.draggingComponentId === id);

  let width = (canvasWidth * layoutData.width) / 43;
  width = width > canvasWidth ? canvasWidth : width; //this handles scenarios where the width is set more than canvas for older components
  const styles = {
    width: width + 'px',
    height: layoutData.height + 'px',
    transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    ...(isGhostComponent ? { opacity: 0.5 } : {}),
  };

  const isWidgetActive = (isSelected || isDragging) && mode !== 'view';

  useEffect(() => {
    const controlBox = document.querySelector(`[target-id="${id}"]`);
    console.log('controlBox', { hide: !isOnScreen && isSelected && !isDragging && !isResizing, isOnScreen });
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
  // const [dragTarget] = useDragTarget();
  return (
    <div
      ref={drop}
      style={styles}
      id={`canvas-${parent}`}
      data-parent={parent}
      className={`sub-canvas real-canvas ${
        // (isDragging || isResizing || dragTarget === parent || isGridActive) && !readOnly ? 'show-grid' : 'hide-grid'
        (isDragging || isResizing || isGridActive) && !readOnly ? 'show-grid' : 'hide-grid'
      }`}
    >
      {children}
    </div>
  );
};

export default function useOnScreen(ref) {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), {
        root: ref.current?.closest('.real-canvas'),
        threshold: 0,
      }),
    [ref]
  );

  useEffect(() => {
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return isIntersecting;
}
