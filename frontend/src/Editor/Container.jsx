/* eslint-disable import/no-named-as-default */
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import cx from 'classnames';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes, EditorConstants } from './editorConstants';
import { DraggableBox } from './DraggableBox';
import update from 'immutability-helper';
import { componentTypes } from './WidgetManager/components';
import { resolveWidgetFieldValue, getWorkspaceId } from '@/_helpers/utils';
import Comments from './Comments';
import { commentsService } from '@/_services';
import config from 'config';
import Spinner from '@/_ui/Spinner';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  addComponents,
  addNewWidgetToTheEditor,
  isPDFSupported,
  calculateMoveableBoxHeight,
} from '@/_helpers/appUtils';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore, flushComponentsToRender } from '@/_stores/editorStore';
import { useAppInfo } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';
import _, { isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import DragContainer from './DragContainer';
import { compact, correctBounds } from './gridUtils';
import GhostWidget from './GhostWidget';
import { useDraggedSubContainer, useGridStore } from '@/_stores/gridStore';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';
import { useSampleDataSource } from '@/_stores/dataSourcesStore';
import './editor.theme.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import toast from 'react-hot-toast';
import { getSubpath } from '@/_helpers/routes';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

const deviceWindowWidth = EditorConstants.deviceWindowWidth;

export const Container = ({
  widthOfCanvas,
  mode,
  snapToGrid,
  onComponentClick,
  onEvent,
  appDefinitionChanged,
  appLoading,
  setSelectedComponent,
  zoomLevel,
  removeComponent,
  darkMode,
  socket,
  handleUndo,
  handleRedo,
}) => {
  const currentPageId = useEditorStore.getState().currentPageId;
  const appDefinition = useEditorStore.getState().appDefinition;
  const [canvasWidth, setCanvasWidth] = useState(widthOfCanvas);
  // Dont update first time to skip
  // redundant save on app definition load
  const { createDataQuery } = useDataQueriesActions();
  const { setPreviewData } = useQueryPanelActions();
  const sampleDataSource = useSampleDataSource();
  const firstUpdate = useRef(true);

  const noOfGrids = 43;

  const draggedSubContainer = useDraggedSubContainer(false);
  const { resizingComponentId, isGridDragging } = useGridStore(
    (state) => ({
      resizingComponentId: state?.resizingComponentId,
      isGridDragging: !!state?.draggingComponentId,
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

  useEffect(() => {
    const _canvasWidth = document.getElementsByClassName('canvas-area')[0]?.getBoundingClientRect()?.width;
    setCanvasWidth(_canvasWidth);
  }, [currentLayout, widthOfCanvas]);

  const gridWidth = canvasWidth / noOfGrids;

  const { appId } = useAppInfo();

  const { appVersionsId, isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      appVersionsId: state?.editingVersion?.id,
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
    [JSON.stringify(appDefinition.pages[currentPageId]?.components), currentPageId]
  );

  const [boxes, setBoxes] = useState(() => components);
  // const [isDragging, setIsDragging] = useState(false);
  // const [isResizing, setIsResizing] = useState(false);
  const [commentsPreviewList, setCommentsPreviewList] = useState([]);
  const [newThread, addNewThread] = useState({});
  const [isContainerFocused, setContainerFocus] = useState(true);
  const [canvasHeight, setCanvasHeight] = useState(null);

  useEffect(() => {
    if (currentLayout === 'mobile' && appDefinition.pages[currentPageId]?.autoComputeLayout) {
      const mobLayouts = Object.keys(boxes)
        .filter((key) => !boxes[key]?.component?.parent)
        .map((key) => {
          return { ...deepClone(boxes[key]?.layouts?.desktop), i: key };
        });
      const updatedBoxes = deepClone(boxes);
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
    }
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
            const newComponent = addComponents(
              currentPageId,
              appDefinition,
              appDefinitionChanged,
              focusedParentIdRef.current,
              JSON.parse(cliptext),
              true
            );
            setSelectedComponent(newComponent.id, newComponent.component);
          } catch (err) {
            console.log(err);
          }
        } else {
          console.log('Clipboard API is not available in this browser.');
        }
      }
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    },
    [isContainerFocused, appDefinition, focusedParentIdRef.current],
    { scopes: 'editor' }
  );

  useEffect(() => {
    if (mode === 'view' && currentLayout === 'mobile') {
      const mobLayouts = Object.keys(components)
        .filter((key) => !components[key]?.component?.parent)
        .map((key) => {
          return { ...deepClone(components[key]?.layouts?.desktop), i: key };
        });
      const updatedBoxes = deepClone(components);
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
      setBoxes({ ...updatedBoxes });
    } else {
      const diffState = diff(components, boxes);

      if (!_.isEmpty(diffState)) {
        setBoxes(components);
      }
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
    noOfBoxs != 0 && setContainerFocus(true);
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

    const definition = useEditorStore.getState().appDefinition;

    if (!definition.pages[currentPageId]?.components) return;

    const newDefinition = {
      ...definition,
      pages: {
        ...definition.pages,
        [currentPageId]: {
          ...definition.pages[currentPageId],
          components: {
            ...definition.pages[currentPageId]?.components,
            ...boxes,
          },
        },
      },
    };

    //need to check if a new component is added or deleted

    const oldComponents = definition.pages[currentPageId]?.components ?? {};
    const newComponents = boxes;

    const componendAdded = Object.keys(newComponents).length > Object.keys(oldComponents).length;

    const opts = _.isEmpty(paramUpdatesOptsRef.current) ? { containerChanges: true } : paramUpdatesOptsRef.current;

    paramUpdatesOptsRef.current = {};

    if (componendAdded) {
      opts.componentAdded = true;
    }

    const shouldUpdate = !_.isEmpty(diff(definition, newDefinition));

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

  const isDragging = isGridDragging || draggingState;

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

  const [{ isOver, isOverCurrent }, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop(item, monitor) {
        const didDrop = monitor.didDrop();
        if (didDrop) {
          return;
        }

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
        const componentMeta = deepClone(
          componentTypes.find((component) => component.component === item.component.component)
        );

        const currentActiveLayout = useEditorStore.getState().currentLayout;

        const newComponent = addNewWidgetToTheEditor(
          componentMeta,
          monitor,
          boxes,
          canvasBoundingRect,
          currentActiveLayout,
          snapToGrid,
          zoomLevel
        );

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
            const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue, styles } = child;

            const componentMeta = deepClone(componentTypes.find((component) => component.component === componentName));
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
              { ...boxes, ...childrenBoxes },
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

        const newBoxes = {
          ...boxes,
          [newComponent.id]: {
            component: newComponent.component,
            layouts: {
              ...newComponent.layout,
            },
          },
          ...childrenBoxes,
        };
        setBoxes(newBoxes);

        setSelectedComponent(newComponent.id, newComponent.component);

        return undefined;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    }),
    [moveBox]
  );

  const onResizeStop = (boxList) => {
    const newBoxes = boxList.reduce((newBoxList, { id, height, width, x, y, gw }) => {
      const _canvasWidth = gw ? gw * noOfGrids : canvasWidth;
      let newWidth = Math.round((width * noOfGrids) / _canvasWidth);
      y = Math.round(y / 10) * 10;
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
    const copyOfBoxes = JSON.parse(JSON.stringify(boxes));

    const updatedBoxes = boxPositions.reduce((boxesObj, { id, x, y, parent }) => {
      let _width = copyOfBoxes[id]['layouts'][currentLayout].width;
      let _height = copyOfBoxes[id]['layouts'][currentLayout].height;
      const containerWidth = parent ? useGridStore.getState().subContainerWidths[parent] : gridWidth;
      if (parent !== copyOfBoxes[id]['component']?.parent) {
        if (copyOfBoxes[id]['component']?.parent) {
          _width = Math.round(
            (copyOfBoxes[id]['layouts'][currentLayout].width *
              useGridStore.getState().subContainerWidths[boxes[id]['component']?.parent]) /
              containerWidth
          );
        } else {
          _width = Math.round((boxes[id]['layouts'][currentLayout].width * gridWidth) / containerWidth);
        }
      }
      if (_width === 0) {
        _width = 1;
      }
      let _left = Math.round(x / (parent ? useGridStore.getState().subContainerWidths[parent] : gridWidth));
      y = Math.round(y / 10) * 10;
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
        const parentId = copyOfBoxes[parent] ? parent : parent?.split('-').slice(0, -1).join('-');
        const componentType = copyOfBoxes[parentId]?.component.component;
        var parentHeight = parentElem?.clientHeight || _height;
        if (_height > parentHeight && ['Tabs', 'Listview'].includes(componentType)) {
          _height = parentHeight;
          y = 0;
        }

        if (componentType === 'Listview' && y > parentHeight) {
          y = y % parentHeight;
        }
      }

      const componentData = JSON.parse(JSON.stringify(copyOfBoxes[id]['component']));
      componentData.parent = parent ? parent : null;

      return {
        ...boxesObj,
        [id]: {
          ...copyOfBoxes[id],
          component: componentData,
          layouts: {
            ...copyOfBoxes[id]['layouts'],
            [currentLayout]: {
              ...copyOfBoxes[id]['layouts'][currentLayout],
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
      ...copyOfBoxes,
      ...updatedBoxes,
    };

    const diffState = diff(boxes, newBoxes);

    // Added to avoid sending layout data to BE without layout key
    // resulting in App could not save error
    for (const diffComponent in diffState) {
      if (!('layouts' in diffState[diffComponent])) return;
    }

    setBoxes((prev) => {
      const updatedComponentsAsperDiff = Object.keys(diffState).reduce((acc, key) => {
        const component = newBoxes[key];
        if (component) {
          acc[key] = component;
        }
        return acc;
      }, {});

      return {
        ...prev,
        ...updatedComponentsAsperDiff,
      };
    });

    updateCanvasHeight(newBoxes);
  }

  const paramUpdated = useCallback(
    (id, param, value, opts = {}) => {
      if (id === 'resizingComponentId') {
        return;
      }
      if (Object.keys(value)?.length > 0) {
        setBoxes((boxes) => {
          // Ensure boxes[id] exists. This can happen is page is already switched and the component attributes change gets triggered after that
          if (!boxes[id]) {
            console.error(`Box with id ${id} does not exist`);
            return boxes;
          }
          return update(boxes, {
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
          });
        });
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

  const openAddUserWorkspaceSetting = () => {
    const workspaceId = getWorkspaceId();
    const subPath = getSubpath();
    const path = subPath
      ? `${subPath}/${workspaceId}/workspace-settings?adduser=true`
      : `/${workspaceId}/workspace-settings?adduser=true`;
    window.open(path, '_blank');
  };

  const handleConnectSampleDB = () => {
    const source = sampleDataSource;
    const query = `SELECT tablename \nFROM pg_catalog.pg_tables \nWHERE schemaname='public';`;
    createDataQuery(source, true, { query });
    setPreviewData(null);
  };

  const getContainerProps = React.useCallback(() => {
    return {
      mode,
      snapToGrid,
      onComponentClick,
      onEvent,
      appDefinition,
      appDefinitionChanged,
      appLoading,
      zoomLevel,
      setSelectedComponent,
      removeComponent,
      currentLayout,
      selectedComponents,
      darkMode,
      currentPageId,
      childComponents,
      parentGridWidth: gridWidth,
      draggedSubContainer,
    };
  }, [childComponents, selectedComponents, draggedSubContainer, darkMode, currentLayout, currentPageId, gridWidth]);

  const queryBoxText = sampleDataSource
    ? 'Connect to your data source or use our sample data source to start playing around!'
    : 'Connect to a data source to be able to create a query';

  const showEmptyContainer = !appLoading && !isDragging && mode !== 'view';

  return (
    <ContainerWrapper
      showComments={showComments}
      handleAddThread={handleAddThread}
      containerRef={(el) => {
        canvasRef.current = el;
        drop(el);
      }}
      styles={styles}
      isDropping={draggingState}
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
          })
            .filter(([, box]) => isEmpty(box?.component?.parent))
            .map(([id, box]) => {
              return (
                <WidgetWrapper
                  isResizing={resizingComponentId === id}
                  widget={box}
                  key={id}
                  id={id}
                  gridWidth={gridWidth}
                  currentLayout={currentLayout}
                  mode={mode}
                  propertiesDefinition={box?.component?.definition?.properties}
                  stylesDefinition={box?.component?.definition?.styles}
                  otherDefinition={box?.component?.definition?.others}
                  componentType={box?.component?.component}
                >
                  <DraggableBox
                    className={showComments && 'pointer-events-none'}
                    canvasWidth={canvasWidth}
                    onComponentClick={
                      config.COMMENT_FEATURE_ENABLE && showComments ? handleAddThreadOnComponent : onComponentClick
                    }
                    onEvent={onEvent}
                    key={id}
                    paramUpdated={paramUpdated}
                    id={id}
                    {...box}
                    mode={mode}
                    inCanvas={true}
                    zoomLevel={zoomLevel}
                    removeComponent={removeComponent}
                    isSelectedComponent={
                      mode === 'edit' ? selectedComponents.find((component) => component.id === id) : false
                    }
                    darkMode={darkMode}
                    isMultipleComponentsSelected={selectedComponents?.length > 1 ? true : false}
                    getContainerProps={getContainerProps}
                    isVersionReleased={isVersionReleased}
                    currentPageId={currentPageId}
                    childComponents={childComponents[id]}
                  />
                </WidgetWrapper>
              );
            })}
          <ResizeGhostWidget
            resizingComponentId={resizingComponentId}
            widgets={boxes}
            currentLayout={currentLayout}
            canvasWidth={canvasWidth}
            gridWidth={gridWidth}
          />
          <DragGhostWidget />
          <DragContainer
            widgets={boxes}
            onResizeStop={onResizeStop}
            onDrag={onDragStop}
            gridWidth={gridWidth}
            selectedComponents={selectedComponents}
            currentLayout={currentLayout}
            currentPageId={currentPageId}
            draggedSubContainer={draggedSubContainer}
            mode={isVersionReleased ? 'view' : mode}
          />
        </div>
      </div>
      {Object.keys(boxes).length === 0 && showEmptyContainer && (
        <div style={{ paddingTop: '10%' }}>
          <div className="row empty-box-cont">
            <div className="col-md-4 dotted-cont">
              <div className="box-icon">
                <BulkIcon name="addtemplate" width="25" viewBox="0 0 28 28" />
              </div>
              <div className={`title-text`} data-cy="empty-editor-text">
                Drag and drop a component
              </div>
              <div className="title-desc">
                Choose a component from the right side panel or use our pre-built templates to get started quickly!
              </div>
            </div>
            <div className="col-md-4 dotted-cont">
              <div className="box-icon">
                <SolidIcon name="datasource" fill="#3E63DD" width="25" />
              </div>
              <div className={`title-text`}>Create a Query</div>
              <div className="title-desc">{queryBoxText}</div>
              {!!sampleDataSource && (
                <div className="box-link">
                  <div className="child">
                    <a className="link-but" onClick={handleConnectSampleDB}>
                      Connect to sample data source{' '}
                    </a>
                  </div>

                  <div>
                    <BulkIcon name="arrowright" fill="#3E63DD" />
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-4 dotted-cont">
              <div className="box-icon">
                <BulkIcon name="invitecollab" width="25" viewBox="0 0 28 28" />
              </div>
              <div className={`title-text `}>Share your application!</div>
              <div className="title-desc">
                Invite users to collaborate in real-time with multiplayer editing and comments for seamless development.
              </div>
              <div className="box-link">
                <div className="child">
                  <a className="link-but" onClick={openAddUserWorkspaceSetting}>
                    Invite collaborators{' '}
                  </a>
                </div>
                <div>
                  <BulkIcon name="arrowright" fill="#3E63DD" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContainerWrapper>
  );
};

const WidgetWrapper = ({
  children,
  widget,
  id,
  gridWidth,
  currentLayout,
  isResizing,
  mode,
  propertiesDefinition,
  stylesDefinition,
  componentType,
  otherDefinition,
}) => {
  const isGhostComponent = id === 'resizingComponentId';
  const {
    component: { parent },
    layouts,
  } = widget;
  const { isSelected, isHovered, shouldRerender } = useEditorStore((state) => {
    const isSelected = !!(state.selectedComponents || []).find((selected) => selected?.id === id);
    // const isHovered = state?.hoveredComponent == id;
    /*
     `shouldRerender` is added only for re-rendering the component when visibility/showOnMobile/showOnDesktop 
     updates since these attributes need update or WidgetWrapper rather than actual Widget itself
     */
    const shouldRerender = state.componentsNeedsUpdateOnNextRender.some((compId) => compId === id);
    return { isSelected, shouldRerender };
  }, shallow);

  const isDragging = useGridStore((state) => state?.draggingComponentId === id);

  const canShowInCurrentLayout = otherDefinition[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value;

  if (parent || !resolveWidgetFieldValue(canShowInCurrentLayout)) {
    /*
      Remove the component from the re-render queue
      This is necessary because child components are not rendered,
      so their flush functions won't be called from ControlledComponentToRender
    */
    shouldRerender && flushComponentsToRender(id);
    return '';
  }

  let layoutData = layouts?.[currentLayout];
  if (isEmpty(layoutData)) {
    layoutData = layouts?.['desktop'];
  }
  // const width = (canvasWidth * layoutData.width) / NO_OF_GRIDS;
  const width = gridWidth * layoutData.width;
  const { label = { value: null } } = propertiesDefinition ?? {};
  const visibility = propertiesDefinition?.visibility?.value ?? stylesDefinition?.visibility?.value ?? null;
  const resolvedVisibility = resolveWidgetFieldValue(visibility);

  const isWidgetActive = (isSelected || isDragging) && mode !== 'view';

  const styles = {
    width: width + 'px',
    height: resolvedVisibility
      ? calculateMoveableBoxHeight(componentType, layoutData, stylesDefinition, label) + 'px'
      : '10px',
    transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    ...(isGhostComponent ? { opacity: 0.5 } : {}),
    ...(isWidgetActive ? { zIndex: 3 } : {}),
  };
  return (
    <>
      <div
        className={
          isGhostComponent
            ? `ghost-target`
            : `target widget-target target1 ele-${id} moveable-box ${isResizing ? 'resizing-target' : ''} ${
                isWidgetActive ? 'active-target' : ''
              } ${isDragging ? 'opacity-0' : ''}`
        }
        data-id={`${parent}`}
        id={id}
        widgetid={id}
        style={{
          transform: `translate(332px, -134px)`,
          zIndex: mode === 'view' && widget.component.component == 'Datepicker' ? 2 : null,
          ...styles,
        }}
      >
        {children}
      </div>
    </>
  );
};

function DragGhostWidget() {
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

function ContainerWrapper({ children, canvasHeight, isDropping, showComments, handleAddThread, containerRef, styles }) {
  const { resizingComponentId, draggingComponentId, dragTarget } = useGridStore((state) => {
    const { resizingComponentId, draggingComponentId, dragTarget } = state;
    return { resizingComponentId, draggingComponentId, dragTarget };
  }, shallow);

  return (
    <div
      {...(config.COMMENT_FEATURE_ENABLE && showComments && { onClick: handleAddThread })}
      ref={containerRef}
      style={{ ...styles, height: canvasHeight }}
      className={cx('real-canvas', {
        'show-grid': (!!resizingComponentId && !dragTarget) || (!!draggingComponentId && !dragTarget) || isDropping,
      })}
      id="real-canvas"
      data-cy="real-canvas"
      canvas-height={canvasHeight}
    >
      {children}
    </div>
  );
}

const ResizeGhostWidget = ({ resizingComponentId, widgets, currentLayout, canvasWidth, gridWidth }) => {
  const dragTarget = useGridStore((state) => state.dragTarget);
  if (!resizingComponentId || dragTarget) {
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
