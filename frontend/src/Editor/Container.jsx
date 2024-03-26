/* eslint-disable import/no-named-as-default */
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import cx from 'classnames';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import { componentTypes } from './WidgetManager/components';
import { resolveReferences, isPDFSupported } from '@/_helpers/utils';
import Comments from './Comments';
import { commentsService } from '@/_services';
import config from 'config';
import Spinner from '@/_ui/Spinner';
import { useHotkeys } from 'react-hotkeys-hook';
import { addComponents, addNewWidgetToTheEditor } from '@/_helpers/appUtils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { useAppInfo } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';
import _, { cloneDeep, isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import DragContainer from './DragContainer';
import { compact, correctBounds } from './gridUtils';
import { useDraggedSubContainer, useGridStore } from '@/_stores/gridStore';
import toast from 'react-hot-toast';

// const noOfGrids = 24;

export const Container = ({
  canvasWidth,
  mode,
  snapToGrid,
  onComponentClick,
  onEvent,
  appDefinition,
  appDefinitionChanged,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  appLoading,
  setSelectedComponent,
  zoomLevel,
  removeComponent,
  deviceWindowWidth,
  darkMode,
  socket,
  handleUndo,
  handleRedo,
  sideBarDebugger,
  currentPageId,
}) => {
  // Dont update first time to skip
  // redundant save on app definition load
  const firstUpdate = useRef(true);
  // const [noOfGrids, setNoOfGrids] = useNoOfGrid();
  const noOfGrids = 43;
  const [subContainerWidths, setSubContainerWidths] = useState({});
  const draggedSubContainer = useDraggedSubContainer(false);
  const { resizingComponentId } = useGridStore(
    (state) => ({
      resizingComponentId: state?.resizingComponentId,
      draggingComponentId: state?.draggingComponentId,
    }),
    shallow
  );
  // const [dragTarget] = useDragTarget();

  const { showComments, currentLayout, selectedComponents } = useEditorStore(
    (state) => ({
      showComments: state?.showComments,
      currentLayout: state?.currentLayout,
      selectedComponents: state?.selectedComponents,
    }),
    shallow
  );

  const gridWidth = canvasWidth / noOfGrids;
  const { appId } = useAppInfo();

  const currentState = useCurrentState();
  const { appVersionsId, enableReleasedVersionPopupState, isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      appVersionsId: state?.editingVersion?.id,
      enableReleasedVersionPopupState: state.actions.enableReleasedVersionPopupState,
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  const styles = {
    width: currentLayout === 'mobile' ? deviceWindowWidth : '100%',
    maxWidth: currentLayout === 'mobile' ? deviceWindowWidth : `${canvasWidth}px`,
    backgroundSize: `${gridWidth}px 10px`,
  };

  const components = useMemo(
    () => appDefinition.pages[currentPageId]?.components ?? {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(appDefinition), currentPageId]
  );

  const [boxes, setBoxes] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [commentsPreviewList, setCommentsPreviewList] = useState([]);
  const [newThread, addNewThread] = useState({});
  const [isContainerFocused, setContainerFocus] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(null);

  useEffect(() => {
    if (currentLayout === 'mobile' && appDefinition.pages[currentPageId]?.autoComputeLayout) {
      const mobLayouts = Object.keys(boxes)
        .filter((key) => !boxes[key]?.component?.parent)
        .map((key) => {
          return { ...cloneDeep(boxes[key]?.layouts?.desktop), i: key };
        });
      const updatedBoxes = cloneDeep(boxes);
      let newmMobLayouts = correctBounds(mobLayouts, { cols: 43 });
      newmMobLayouts = compact(newmMobLayouts, 'vertical', 43);
      Object.keys(boxes).forEach((id) => {
        const mobLayout = newmMobLayouts.find((layout) => layout.i === id);
        updatedBoxes[id].layouts.mobile = mobLayout
          ? {
              left: mobLayout.left,
              height: mobLayout.height,
              top: mobLayout.top,
              width: mobLayout.width,
            }
          : updatedBoxes[id].layouts.desktop;
      });
      setBoxes({ ...updatedBoxes });
      // console.log('currentLayout', data);
    }
    // setNoOfGrids(currentLayout === 'mobile' ? 12 : 43);
  }, [currentLayout]);

  const paramUpdatesOptsRef = useRef({});
  const canvasRef = useRef(null);
  const focusedParentIdRef = useRef(undefined);
  useHotkeys('meta+z, control+z', () => handleUndo(), { scopes: 'editor' });
  useHotkeys('meta+shift+z, control+shift+z', () => handleRedo(), { scopes: 'editor' });
  useHotkeys(
    'meta+v, control+v',
    async () => {
      if (isContainerFocused && !(isVersionReleased || isEditorFreezed)) {
        // Check if the clipboard API is available
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
          try {
            const cliptext = await navigator.clipboard.readText();
            addComponents(
              currentPageId,
              appDefinition,
              appDefinitionChanged,
              focusedParentIdRef.current,
              JSON.parse(cliptext),
              true
            );
          } catch (err) {
            console.log(err);
          }
        } else {
          console.log('Clipboard API is not available in this browser.');
        }
      }
      enableReleasedVersionPopupState();
    },
    [isContainerFocused, appDefinition, focusedParentIdRef.current],
    { scopes: 'editor' }
  );

  useEffect(() => {
    if (mode === 'view' && currentLayout === 'mobile') {
      const mobLayouts = Object.keys(components)
        .filter((key) => !components[key]?.component?.parent)
        .map((key) => {
          return { ...cloneDeep(components[key]?.layouts?.desktop), i: key };
        });
      const updatedBoxes = cloneDeep(components);
      let newmMobLayouts = correctBounds(mobLayouts, { cols: 43 });
      newmMobLayouts = compact(newmMobLayouts, 'vertical', 43);
      Object.keys(components).forEach((id) => {
        const mobLayout = newmMobLayouts.find((layout) => layout.i === id);
        updatedBoxes[id].layouts.mobile = mobLayout
          ? {
              left: mobLayout.left,
              height: mobLayout.height,
              top: mobLayout.top,
              width: mobLayout.width,
            }
          : updatedBoxes[id].layouts.desktop;
      });
      console.log(updatedBoxes);
      setBoxes({ ...updatedBoxes });
    } else {
      setBoxes(components);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(components)]);

  useEffect(() => {
    const handleClick = (e) => {
      if (canvasRef.current.contains(e.target) || document.getElementById('modal-container')?.contains(e.target)) {
        const elem = e.target.closest('.real-canvas').getAttribute('id');
        if (elem === 'real-canvas') {
          focusedParentIdRef.current = undefined;
        } else {
          const parentId = elem.split('canvas-')[1];
          focusedParentIdRef.current = parentId;
        }
        if (!isContainerFocused) {
          setContainerFocus(true);
        }
      } else if (isContainerFocused) {
        setContainerFocus(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isContainerFocused, canvasRef]);

  //listening to no of component change to handle addition/deletion of widgets
  const noOfBoxs = Object.values(boxes || []).length;
  useEffect(() => {
    updateCanvasHeight(boxes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noOfBoxs]);

  const moveBox = useCallback(
    (id, layouts) => {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { layouts },
          },
        })
      );
    },
    [boxes]
  );

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

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

    const opts = _.isEmpty(paramUpdatesOptsRef.current) ? { containerChanges: true } : paramUpdatesOptsRef.current;

    paramUpdatesOptsRef.current = {};

    if (componendAdded) {
      opts.componentAdded = true;
    }

    const shouldUpdate = !_.isEmpty(diff(appDefinition, newDefinition));
    if (shouldUpdate) {
      appDefinitionChanged(newDefinition, opts);
    }

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

  const updateCanvasHeight = useCallback(
    (components) => {
      const maxHeight = Object.values(components).reduce((max, component) => {
        const layout = component?.layouts?.[currentLayout];
        if (!layout) {
          return max;
        }
        const sum = layout.top + layout.height;
        return Math.max(max, sum);
      }, 0);

      const bottomPadding = mode === 'view' ? 100 : 300;
      const frameHeight = mode === 'view' ? 45 : 85;
      setCanvasHeight(`max(100vh - ${frameHeight}px, ${maxHeight + bottomPadding}px)`);
    },
    [setCanvasHeight, currentLayout, mode]
  );

  useEffect(() => {
    setIsDragging(draggingState);
  }, [draggingState]);

  const [, drop] = useDrop(
    () => ({
      accept: [ItemTypes.BOX, ItemTypes.COMMENT],
      async drop(item, monitor) {
        // if (item.currentLayout === 'mobile' && item.autoComputeLayout) {
        //   turnOffAutoLayout();
        //   return false;
        // }

        if (item.parent) {
          return;
        }

        if (item.component.component === 'PDF' && !isPDFSupported()) {
          toast.error(
            'PDF is not supported in this version of browser. We recommend upgrading to the latest version for full support.'
          );
          return;
        }

        if (item.name === 'comment') {
          const canvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();
          const offsetFromTopOfWindow = canvasBoundingRect.top;
          const offsetFromLeftOfWindow = canvasBoundingRect.left;
          const currentOffset = monitor.getSourceClientOffset();

          const xOffset = Math.round(currentOffset.x + currentOffset.x * (1 - zoomLevel) - offsetFromLeftOfWindow);
          const y = Math.round(currentOffset.y + currentOffset.y * (1 - zoomLevel) - offsetFromTopOfWindow);

          const x = (xOffset * 100) / canvasWidth;

          const element = document.getElementById(`thread-${item.threadId}`);
          element.style.transform = `translate(${xOffset}px, ${y}px)`;
          commentsService.updateThread(item.threadId, { x, y });
          return undefined;
        }

        const canvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();
        const componentMeta = _.cloneDeep(
          componentTypes.find((component) => component.component === item.component.component)
        );
        const newComponent = addNewWidgetToTheEditor(
          componentMeta,
          monitor,
          boxes,
          canvasBoundingRect,
          item.currentLayout,
          snapToGrid,
          zoomLevel
        );

        const newBoxes = {
          ...boxes,
          [newComponent.id]: {
            component: newComponent.component,
            layouts: {
              ...newComponent.layout,
            },
            withDefaultChildren: newComponent.withDefaultChildren,
          },
        };

        setBoxes(newBoxes);

        setSelectedComponent(newComponent.id, newComponent.component);

        return undefined;
      },
    }),
    [moveBox]
  );

  const onResizeStop = (boxList) => {
    const newBoxes = boxList.reduce((newBoxList, { id, height, width, x, y, gw }) => {
      const _canvasWidth = gw ? gw * noOfGrids : canvasWidth;
      let newWidth = Math.round((width * noOfGrids) / _canvasWidth);
      gw = gw ? gw : gridWidth;
      const parent = boxes[id]?.component?.parent;
      if (y < 0) {
        y = 0;
      }
      if (parent) {
        const parentElem = document.getElementById(`canvas-${parent}`);
        const parentId = parent.includes('-') ? parent?.split('-').slice(0, -1).join('-') : parent;
        const compoenentType = boxes[parentId]?.component.component;
        var parentHeight = parentElem?.clientHeight || height;
        if (height > parentHeight && ['Tabs', 'Listview'].includes(compoenentType)) {
          height = parentHeight;
          y = 0;
        }
        let posX = Math.round(x / gw);
        if (posX + newWidth > 43) {
          newWidth = 43 - posX;
        }
      }
      return {
        ...newBoxList,
        [id]: {
          ...boxes[id],
          layouts: {
            ...boxes[id]['layouts'],
            [currentLayout]: {
              ...boxes[id]['layouts'][currentLayout],
              width: newWidth ? newWidth : 1,
              height: height ? height : 10,
              top: y,
              left: Math.round(x / gw),
            },
          },
        },
      };
    }, {});
    let updatedBoxes = {
      ...boxes,
      ...newBoxes,
    };

    setBoxes(updatedBoxes);
    updateCanvasHeight(updatedBoxes);
  };

  function onDragStop(boxPositions) {
    const updatedBoxes = boxPositions.reduce((boxesObj, { id, x, y, parent }) => {
      let _width = boxes[id]['layouts'][currentLayout].width;
      let _height = boxes[id]['layouts'][currentLayout].height;
      const containerWidth = parent ? subContainerWidths[parent] : gridWidth;
      if (parent !== boxes[id]['component']?.parent) {
        if (boxes[id]['component']?.parent) {
          _width = Math.round(
            (boxes[id]['layouts'][currentLayout].width * subContainerWidths[boxes[id]['component']?.parent]) /
              containerWidth
          );
        } else {
          _width = Math.round((boxes[id]['layouts'][currentLayout].width * gridWidth) / containerWidth);
        }
      }
      if (_width === 0) {
        _width = 1;
      }
      let _left = Math.round(x / (parent ? subContainerWidths[parent] : gridWidth));
      if (_width + _left > noOfGrids) {
        _left = _left - (_width + _left - noOfGrids);
        if (_left < 0) {
          _left = 0;
          _width = noOfGrids;
        }
      } else if (_left < 0) {
        _left = 0;
        if (_width > noOfGrids) {
          _width = noOfGrids;
        }
      }
      if (y < 0) {
        y = 0;
      }

      if (parent) {
        const parentElem = document.getElementById(`canvas-${parent}`);
        const parentId = boxes[parent] ? parent : parent?.split('-').slice(0, -1).join('-');
        const compoenentType = boxes[parentId]?.component.component;
        var parentHeight = parentElem?.clientHeight || _height;
        if (_height > parentHeight && ['Tabs', 'Listview'].includes(compoenentType)) {
          _height = parentHeight;
          y = 0;
        }
      }

      const componentData = { ...boxes[id]['component'] };
      componentData.parent = parent ? parent : null;

      return {
        ...boxesObj,
        [id]: {
          ...boxes[id],
          component: componentData,
          layouts: {
            ...boxes[id]['layouts'],
            [currentLayout]: {
              ...boxes[id]['layouts'][currentLayout],
              width: _width,
              height: _height,
              top: y,
              left: _left,
            },
          },
        },
      };
    }, {});
    let newBoxes = {
      ...boxes,
      ...updatedBoxes,
    };
    setBoxes(newBoxes);
    updateCanvasHeight(newBoxes);
  }

  const paramUpdated = useCallback(
    (id, param, value, opts = {}) => {
      if (id === 'resizingComponentId') {
        return;
      }
      if (Object.keys(value)?.length > 0) {
        setBoxes((boxes) =>
          update(boxes, {
            [id]: {
              $merge: {
                component: {
                  ...boxes[id]?.component,
                  definition: {
                    ...boxes[id]?.component?.definition,
                    properties: {
                      ...boxes?.[id]?.component?.definition?.properties,
                      [param]: value,
                    },
                  },
                },
              },
            },
          })
        );
        if (!_.isEmpty(opts)) {
          paramUpdatesOptsRef.current = opts;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boxes, setBoxes]
  );

  const handleAddThread = async (e) => {
    e.stopPropogation && e.stopPropogation();

    const x = (e.nativeEvent.offsetX * 100) / canvasWidth;

    const elementIndex = commentsPreviewList.length;
    setCommentsPreviewList([
      ...commentsPreviewList,
      {
        x: x,
        y: e.nativeEvent.offsetY,
      },
    ]);

    const { data } = await commentsService.createThread({
      appId,
      x: x,
      y: e.nativeEvent.offsetY,
      appVersionsId,
      pageId: currentPageId,
    });

    // Remove the temporary loader preview
    const _commentsPreviewList = [...commentsPreviewList];
    _commentsPreviewList.splice(elementIndex, 1);
    setCommentsPreviewList(_commentsPreviewList);

    // Update the threads on all connected clients using websocket
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'threads', appId },
      })
    );

    // Update the list of threads on the current users page
    addNewThread(data);
  };

  const handleAddThreadOnComponent = async (_, __, e) => {
    e.stopPropogation && e.stopPropogation();

    const canvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();
    const offsetFromTopOfWindow = canvasBoundingRect.top;
    const offsetFromLeftOfWindow = canvasBoundingRect.left;

    let x = Math.round(e.screenX - 18 + e.screenX * (1 - zoomLevel) - offsetFromLeftOfWindow);
    const y = Math.round(e.screenY + 18 + e.screenY * (1 - zoomLevel) - offsetFromTopOfWindow);

    x = (x * 100) / canvasWidth;

    const elementIndex = commentsPreviewList.length;
    setCommentsPreviewList([
      ...commentsPreviewList,
      {
        x,
        y: y - 130,
      },
    ]);
    const { data } = await commentsService.createThread({
      appId,
      x,
      y: y - 130,
      appVersionsId,
      pageId: currentPageId,
    });

    // Remove the temporary loader preview
    const _commentsPreviewList = [...commentsPreviewList];
    _commentsPreviewList.splice(elementIndex, 1);
    setCommentsPreviewList(_commentsPreviewList);

    // Update the threads on all connected clients using websocket
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'threads', appId },
      })
    );

    // Update the list of threads on the current users page
    addNewThread(data);
  };

  if (showComments) {
    // const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // const currentUserInitials = `${currentUser.first_name?.charAt(0)}${currentUser.last_name?.charAt(0)}`;
    styles.cursor = `url("data:image/svg+xml,%3Csvg width='34' height='34' viewBox='0 0 34 34' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='17' cy='17' r='15.25' fill='white' stroke='%23FCAA0D' stroke-width='2.5' opacity='0.5' /%3E%3Ctext x='10' y='20' fill='%23000' opacity='0.5' font-family='inherit' font-size='11.2' font-weight='500' color='%23656d77'%3E%3C/text%3E%3C/svg%3E%0A"), text`;
  }

  const childComponents = useMemo(() => {
    const componentWithChildren = {};
    Object.keys(components).forEach((key) => {
      const component = components[key];
      const parent = component?.component?.parent;
      if (parent) {
        componentWithChildren[parent] = {
          ...componentWithChildren[parent],
          [key]: component,
        };
      }
    });
    return componentWithChildren;
  }, [components]);

  return (
    <ContainerWrapper
      showComments={showComments}
      handleAddThread={handleAddThread}
      containerRef={(el) => {
        canvasRef.current = el;
        drop(el);
      }}
      styles={styles}
      isDragging={isDragging}
      isResizing={isResizing}
      canvasHeight={canvasHeight}
    >
      {config.COMMENT_FEATURE_ENABLE && showComments && (
        <>
          <Comments socket={socket} newThread={newThread} canvasWidth={canvasWidth} currentPageId={currentPageId} />
          {commentsPreviewList.map((previewComment, index) => (
            <div
              key={index}
              style={{
                transform: `translate(${(previewComment.x * canvasWidth) / 100}px, ${previewComment.y}px)`,
                position: 'absolute',
                zIndex: 2,
              }}
            >
              <label className="form-selectgroup-item comment-preview-bubble">
                <span
                  className={cx(
                    'comment comment-preview-bubble-border cursor-move avatar avatar-sm shadow-lg bg-white avatar-rounded'
                  )}
                >
                  <Spinner />
                </span>
              </label>
            </div>
          ))}
        </>
      )}
      <div className="root">
        <div className="container-fluid rm-container p-0">
          {Object.entries({
            ...boxes,
            ...(resizingComponentId &&
              boxes[resizingComponentId] && { resizingComponentId: boxes[resizingComponentId] }),
          })
            .filter(([, box]) => isEmpty(box?.component?.parent))
            .map(([id, box]) => {
              const canShowInCurrentLayout =
                box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;
              if (box.parent || !resolveReferences(canShowInCurrentLayout, currentState)) {
                return '';
              }
              return (
                <WidgetWrapper
                  isResizing={resizingComponentId === id}
                  widget={box}
                  key={id}
                  id={id}
                  gridWidth={gridWidth}
                  currentLayout={currentLayout}
                  mode={mode}
                >
                  <DraggableBox
                    className={showComments && 'pointer-events-none'}
                    canvasWidth={canvasWidth}
                    onComponentClick={
                      config.COMMENT_FEATURE_ENABLE && showComments ? handleAddThreadOnComponent : onComponentClick
                    }
                    onEvent={onEvent}
                    // height={height}
                    onComponentOptionChanged={onComponentOptionChanged}
                    onComponentOptionsChanged={onComponentOptionsChanged}
                    key={id}
                    paramUpdated={paramUpdated}
                    id={id}
                    {...box}
                    mode={mode}
                    resizingStatusChanged={(status) => setIsResizing(status)}
                    draggingStatusChanged={(status) => setIsDragging(status)}
                    inCanvas={true}
                    zoomLevel={zoomLevel}
                    setSelectedComponent={setSelectedComponent}
                    removeComponent={removeComponent}
                    deviceWindowWidth={deviceWindowWidth}
                    isSelectedComponent={
                      mode === 'edit' ? selectedComponents.find((component) => component.id === id) : false
                    }
                    darkMode={darkMode}
                    // onComponentHover={onComponentHover}
                    // hoveredComponent={hoveredComponent}
                    sideBarDebugger={sideBarDebugger}
                    isMultipleComponentsSelected={selectedComponents?.length > 1 ? true : false}
                    childComponents={childComponents[id]}
                    containerProps={{
                      // turnOffAutoLayout,
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
                      // onComponentHover,
                      // hoveredComponent,
                      sideBarDebugger,
                      addDefaultChildren: box.withDefaultChildren,
                      currentPageId,
                      childComponents,
                      // setIsChildDragged,
                      setSubContainerWidths: (id, width) =>
                        setSubContainerWidths((widths) => ({ ...widths, [id]: width })),
                      parentGridWidth: gridWidth,
                      subContainerWidths,
                      draggedSubContainer,
                    }}
                    isVersionReleased={isVersionReleased}
                  />
                </WidgetWrapper>
              );
            })}
          <GhostWidget />
          <DragContainer
            widgets={boxes}
            onResizeStop={onResizeStop}
            onDrag={onDragStop}
            gridWidth={gridWidth}
            selectedComponents={selectedComponents}
            setIsDragging={setIsDragging}
            setIsResizing={setIsResizing}
            currentLayout={currentLayout}
            subContainerWidths={subContainerWidths}
            currentPageId={currentPageId}
            draggedSubContainer={draggedSubContainer}
            mode={isVersionReleased ? 'view' : mode}
          />
        </div>
      </div>
      {Object.keys(boxes).length === 0 && !appLoading && !isDragging && (
        <div style={{ paddingTop: '10%' }}>
          <div className="mx-auto w-50 p-5 bg-light no-components-box">
            <center className="text-muted" data-cy={`empty-editor-text`}>
              You haven&apos;t added any components yet. Drag components from the right sidebar and drop here. Check out
              our&nbsp;
              <a
                className="color-indigo9 "
                href="https://docs.tooljet.com/docs/#quickstart-guide"
                target="_blank"
                rel="noreferrer"
              >
                guide
              </a>{' '}
              on adding components.
            </center>
          </div>
        </div>
      )}
    </ContainerWrapper>
  );
};

const WidgetWrapper = ({ children, widget, id, gridWidth, currentLayout, isResizing, mode }) => {
  const isGhostComponent = id === 'resizingComponentId';
  const {
    component: { parent },
    layouts,
  } = widget;
  const { isSelected, isHovered } = useEditorStore((state) => {
    const isSelected = !!(state.selectedComponents || []).find((selected) => selected?.id === id);
    console.log('state.selectedComponents--', state.selectedComponents, id, isSelected);
    const isHovered = state?.hoveredComponent == id;
    return { isSelected, isHovered };
  }, shallow);

  const isDragging = useGridStore((state) => state?.draggingComponentId === id);

  let layoutData = layouts?.[currentLayout];
  if (isEmpty(layoutData)) {
    layoutData = layouts?.['desktop'];
  }
  // const width = (canvasWidth * layoutData.width) / NO_OF_GRIDS;
  const width = gridWidth * layoutData.width;

  const isWidgetActive = (isSelected || isDragging) && mode !== 'view';
  const styles = {
    width: width + 'px',
    height: layoutData.height + 'px',
    transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    // ...(isGhostComponent ? { opacity: 0.5 } : isResizing ? { opacity: 0 } : {}),
    ...(isGhostComponent ? { opacity: 0.5 } : {}),
    ...(isWidgetActive ? { zIndex: 3 } : {}),
  };

  console.log('state.selectedComponents--', isWidgetActive, id, isSelected, isDragging);

  return (
    <>
      <div
        className={
          isGhostComponent
            ? `ghost-target`
            : `target widget-target target1 ele-${id} moveable-box ${isResizing ? 'resizing-target' : ''} ${
                isWidgetActive ? 'active-target' : ''
              } ${isHovered ? 'hovered-target' : ''} ${isDragging ? 'opacity-0' : ''}`
        }
        data-id={`${parent}`}
        id={id}
        widgetid={id}
        style={{
          transform: `translate(332px, -134px)`,
          ...styles,
        }}
      >
        {children}
      </div>
    </>
  );
};

function GhostWidget() {
  const draggingComponentId = useGridStore((state) => state?.draggingComponentId);
  if (!draggingComponentId) return '';
  return (
    <div
      id={'moveable-drag-ghost'}
      style={{
        zIndex: 4,
        position: 'absolute',
        background: '#D9E2FC',
        opacity: '0.7',
      }}
    ></div>
  );
}

function ContainerWrapper({
  children,
  canvasHeight,
  isDragging,
  isResizing,
  showComments,
  handleAddThread,
  containerRef,
  styles,
}) {
  // const [dragTarget] = useDragTarget();
  const { resizingComponentId, draggingComponentId } = useGridStore((state) => {
    const { resizingComponentId, draggingComponentId } = state;
    return { resizingComponentId, draggingComponentId };
  }, shallow);

  return (
    <div
      {...(config.COMMENT_FEATURE_ENABLE && showComments && { onClick: handleAddThread })}
      ref={containerRef}
      style={{ ...styles, height: canvasHeight }}
      className={cx('real-canvas', {
        // 'show-grid': isDragging || isResizing || dragTarget === 'canvas',
        'show-grid': isDragging || isResizing || !!resizingComponentId || !!draggingComponentId,
      })}
      id="real-canvas"
      data-cy="real-canvas"
      canvas-height={canvasHeight}
    >
      {children}
    </div>
  );
}
