/* eslint-disable import/no-named-as-default */
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import cx from 'classnames';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import { componentTypes } from './WidgetManager/components';
import { resolveReferences } from '@/_helpers/utils';
import useRouter from '@/_hooks/use-router';
import Comments from './Comments';
import { commentsService } from '@/_services';
import config from 'config';
import Spinner from '@/_ui/Spinner';
import { useHotkeys } from 'react-hotkeys-hook';
const produce = require('immer').default;
import { addComponents, addNewWidgetToTheEditor } from '@/_helpers/appUtils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

const NO_OF_GRIDS = 43;

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
  const gridWidth = canvasWidth / NO_OF_GRIDS;
  const styles = {
    width: currentLayout === 'mobile' ? deviceWindowWidth : '100%',
    maxWidth: `${canvasWidth}px`,
    backgroundSize: `${gridWidth}px 10px`,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const components = appDefinition.pages[currentPageId]?.components ?? {};
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
  const { showComments, currentLayout, selectedComponents } = useEditorStore(
    (state) => ({
      showComments: state?.showComments,
      currentLayout: state?.currentLayout,
      selectedComponents: state?.selectedComponents,
    }),
    shallow
  );

  const [boxes, setBoxes] = useState(components);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [commentsPreviewList, setCommentsPreviewList] = useState([]);
  const [newThread, addNewThread] = useState({});
  const [isContainerFocused, setContainerFocus] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(null);
  const router = useRouter();
  const canvasRef = useRef(null);
  const focusedParentIdRef = useRef(undefined);
  useHotkeys('meta+z, control+z', () => handleUndo());
  useHotkeys('meta+shift+z, control+shift+z', () => handleRedo());
  useHotkeys(
    'meta+v, control+v',
    () => {
      if (isContainerFocused && !(isVersionReleased || isEditorFreezed)) {
        navigator.clipboard.readText().then((cliptext) => {
          try {
            addComponents(
              currentPageId,
              appDefinition,
              appDefinitionChanged,
              focusedParentIdRef.current,
              JSON.parse(cliptext)
            );
          } catch (err) {
            console.log(err);
          }
        });
      }
      enableReleasedVersionPopupState();
    },
    [isContainerFocused, appDefinition, focusedParentIdRef]
  );

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

  useEffect(() => {
    setBoxes(components);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(components)]);

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

  // Dont update first time to skip
  // redundant save on app definition load
  const firstUpdate = useRef(true);
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

    appDefinitionChanged(newDefinition);
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

  function convertXToPercentage(x, canvasWidth) {
    return (x * 100) / canvasWidth;
  }

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
        if (item.parent) {
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
        const componentMeta = componentTypes.find((component) => component.component === item.component.component);
        console.log('adding new component');
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

  const onDragStop = useCallback(
    (e, componentId, direction, currentLayout) => {
      if (isVersionReleased || isEditorFreezed) {
        enableReleasedVersionPopupState();
        return;
      }
      // const id = componentId ? componentId : uuidv4();

      // Get the width of the canvas
      const canvasBounds = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();
      const canvasWidth = canvasBounds?.width;
      const nodeBounds = direction.node.getBoundingClientRect();

      // Computing the left offset
      const leftOffset = nodeBounds.x - canvasBounds.x;
      const currentLeftOffset = boxes[componentId]?.layouts?.[currentLayout]?.left;
      const leftDiff = currentLeftOffset - convertXToPercentage(leftOffset, canvasWidth);

      // Computing the top offset
      // const currentTopOffset = boxes[componentId].layouts[currentLayout].top;
      const topDiff = boxes[componentId].layouts[currentLayout].top - (nodeBounds.y - canvasBounds.y);

      let newBoxes = { ...boxes };

      for (const selectedComponent of selectedComponents) {
        newBoxes = produce(newBoxes, (draft) => {
          if (draft[selectedComponent.id]) {
            const topOffset = draft[selectedComponent.id].layouts[currentLayout].top;
            const leftOffset = draft[selectedComponent.id].layouts[currentLayout].left;

            draft[selectedComponent.id].layouts[currentLayout].top = topOffset - topDiff;
            draft[selectedComponent.id].layouts[currentLayout].left = leftOffset - leftDiff;
          }
        });
      }

      setBoxes(newBoxes);
      updateCanvasHeight(newBoxes);
    },
    [isVersionReleased, enableReleasedVersionPopupState, boxes, setBoxes, selectedComponents, updateCanvasHeight]
  );

  const onResizeStop = useCallback(
    (id, e, direction, ref, d, position) => {
      if (isVersionReleased || isEditorFreezed) {
        enableReleasedVersionPopupState();
        return;
      }

      const deltaWidth = Math.round(d.width / gridWidth) * gridWidth; //rounding of width of element to nearest mulitple of gridWidth
      const deltaHeight = d.height;

      if (deltaWidth === 0 && deltaHeight === 0) {
        return;
      }

      let { x, y } = position;
      x = Math.round(x / gridWidth) * gridWidth;

      const defaultData = {
        top: 100,
        left: 0,
        width: 445,
        height: 500,
      };

      let { left, top, width, height } = boxes[id]['layouts'][currentLayout] || defaultData;

      const boundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
      const canvasWidth = boundingRect?.width;

      //round the width to nearest multiple of gridwidth before converting to %
      const currentWidth = (canvasWidth * width) / NO_OF_GRIDS;
      let newWidth = currentWidth + deltaWidth;
      newWidth = Math.round(newWidth / gridWidth) * gridWidth;
      width = (newWidth * NO_OF_GRIDS) / canvasWidth;

      height = height + deltaHeight;

      top = y;
      left = (x * 100) / canvasWidth;

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
      updateCanvasHeight(newBoxes);
    },
    [setBoxes, currentLayout, boxes, enableReleasedVersionPopupState, isVersionReleased, updateCanvasHeight, gridWidth]
  );

  const paramUpdated = useCallback(
    (id, param, value) => {
      if (Object.keys(value).length > 0) {
        setBoxes((boxes) =>
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
    },
    [setBoxes]
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
      appId: router.query.id,
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
        data: { message: 'threads', appId: router.query.id },
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
      appId: router.query.id,
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
        data: { message: 'threads', appId: router.query.id },
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
      const { parent } = component;
      if (parent) {
        componentWithChildren[parent] = {
          ...componentWithChildren[parent],
          [key]: component,
        };
      }
    });
    return componentWithChildren;
  }, [components]);

  const resizingStatusChanged = useCallback(
    (status) => {
      setIsResizing(status);
    },
    [setIsResizing]
  );

  const draggingStatusChanged = useCallback(
    (status) => {
      setIsDragging(status);
    },
    [setIsDragging]
  );

  const containerProps = useMemo(() => {
    return {
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
      sideBarDebugger,
      currentPageId,
      childComponents,
    };
  }, [
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
    sideBarDebugger,
    currentPageId,
    childComponents,
  ]);

  return (
    <div
      {...(config.COMMENT_FEATURE_ENABLE && showComments && { onClick: handleAddThread })}
      ref={(el) => {
        canvasRef.current = el;
        drop(el);
      }}
      style={{ ...styles, height: canvasHeight }}
      className={cx('real-canvas', {
        'show-grid': isDragging || isResizing,
      })}
      id="real-canvas"
      data-cy="real-canvas"
      canvas-height={canvasHeight}
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
      {Object.keys(boxes).map((key) => {
        const box = boxes[key];
        const canShowInCurrentLayout =
          box.component.definition.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;
        const addDefaultChildren = box.withDefaultChildren;
        if (!box.parent && resolveReferences(canShowInCurrentLayout, currentState)) {
          return (
            <DraggableBox
              className={showComments && 'pointer-events-none'}
              canvasWidth={canvasWidth}
              onComponentClick={
                config.COMMENT_FEATURE_ENABLE && showComments ? handleAddThreadOnComponent : onComponentClick
              }
              onEvent={onEvent}
              onComponentOptionChanged={onComponentOptionChanged}
              onComponentOptionsChanged={onComponentOptionsChanged}
              key={key}
              onResizeStop={onResizeStop}
              onDragStop={onDragStop}
              paramUpdated={paramUpdated}
              id={key}
              {...boxes[key]}
              mode={mode}
              resizingStatusChanged={resizingStatusChanged}
              draggingStatusChanged={draggingStatusChanged}
              inCanvas={true}
              zoomLevel={zoomLevel}
              setSelectedComponent={setSelectedComponent}
              removeComponent={removeComponent}
              deviceWindowWidth={deviceWindowWidth}
              darkMode={darkMode}
              sideBarDebugger={sideBarDebugger}
              childComponents={childComponents[key]}
              containerProps={{ ...containerProps, addDefaultChildren }}
            />
          );
        }
      })}
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
    </div>
  );
};
