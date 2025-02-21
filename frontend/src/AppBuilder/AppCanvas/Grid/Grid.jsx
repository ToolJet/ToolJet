// import '@/Editor/wdyr';
import React, { useEffect, useState, useRef, useCallback } from 'react';
// eslint-disable-next-line import/no-unresolved
import Moveable from 'react-moveable';
import { shallow } from 'zustand/shallow';
import _, { isArray } from 'lodash';
import { flushSync } from 'react-dom';
import { restrictedWidgetsObj } from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';
import { useGridStore, useIsGroupHandleHoverd, useOpenModalWidgetId } from '@/_stores/gridStore';
import toast from 'react-hot-toast';
import {
  individualGroupableProps,
  getMouseDistanceFromParentDiv,
  findChildrenAndGrandchildren,
  findHighestLevelofSelection,
  getOffset,
  hasParentWithClass,
  getPositionForGroupDrag,
  adjustWidth,
} from './gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import './Grid.css';
import { NO_OF_GRIDS, SUBCONTAINER_WIDGETS } from '../appCanvasConstants';

const CANVAS_BOUNDS = { left: 0, top: 0, right: 0, position: 'css' };
const RESIZABLE_CONFIG = {
  edge: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
  renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
};
const GRID_HEIGHT = 10;

export default function Grid({ gridWidth, currentLayout }) {
  const lastDraggedEventsRef = useRef(null);
  const updateCanvasBottomHeight = useStore((state) => state.updateCanvasBottomHeight, shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);
  const mode = useStore((state) => state.currentMode, shallow);
  const [boxList, setBoxList] = useState([]);
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(), shallow);
  const selectedComponents = useStore((state) => state.selectedComponents, shallow);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const getComponentTypeFromId = useStore((state) => state.getComponentTypeFromId, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const isGroupHandleHoverd = useIsGroupHandleHoverd();
  const openModalWidgetId = useOpenModalWidgetId();
  const moveableRef = useRef(null);
  const triggerCanvasUpdater = useStore((state) => state.triggerCanvasUpdater, shallow);
  const toggleCanvasUpdater = useStore((state) => state.toggleCanvasUpdater, shallow);
  const groupResizeDataRef = useRef([]);
  const isDraggingRef = useRef(false);
  const canvasWidth = NO_OF_GRIDS * gridWidth;
  const getHoveredComponentForGrid = useStore((state) => state.getHoveredComponentForGrid, shallow);
  const getResolvedComponent = useStore((state) => state.getResolvedComponent, shallow);
  const draggingComponentId = useGridStore((state) => state.draggingComponentId, shallow);
  const resizingComponentId = useGridStore((state) => state.resizingComponentId, shallow);
  const [dragParentId, setDragParentId] = useState(null);
  const [elementGuidelines, setElementGuidelines] = useState([]);
  const componentsSnappedTo = useRef(null);
  const prevDragParentId = useRef(null);
  const newDragParentId = useRef(null);
  const [isGroupDragging, setIsGroupDragging] = useState(false);

  useEffect(() => {
    const selectedSet = new Set(selectedComponents);
    const draggingOrResizingId = draggingComponentId || resizingComponentId;
    const isGrouped = findHighestLevelofSelection().length > 1;
    const firstSelectedParent =
      selectedComponents.length > 0 ? boxList.find((b) => b.id === selectedComponents[0])?.parent : null;
    const selectedParent = dragParentId || firstSelectedParent;

    const guidelines = boxList
      .filter((box) => {
        // Early return for non-visible elements
        if (!getResolvedValue(box?.component?.definition?.properties?.visibility?.value)) return false;

        if (isGrouped) {
          // If component is selected, don't show its guidelines
          if (selectedSet.has(box.id)) return false;
          return selectedParent ? box.parent === selectedParent : !box.parent;
        }

        if (draggingOrResizingId) {
          if (box.id === draggingOrResizingId) return false;
          return dragParentId ? box.parent === dragParentId : !box.parent;
        }

        return true;
      })
      .map((box) => `.ele-${box.id}`);
    setElementGuidelines(guidelines);
  }, [boxList, dragParentId, draggingComponentId, resizingComponentId, selectedComponents, getResolvedValue]);

  useEffect(() => {
    setBoxList(
      Object.keys(currentPageComponents)
        .map((key) => {
          const widget = currentPageComponents[key];
          return {
            id: key,
            ...widget,
            height: widget?.layouts?.[currentLayout]?.height,
            left: widget?.layouts?.[currentLayout]?.left,
            top: widget?.layouts?.[currentLayout]?.top,
            width: widget?.layouts?.[currentLayout]?.width,
            parent: widget?.component?.parent,
            component: widget?.component,
          };
        })
        .filter((box) =>
          getResolvedValue(
            box?.component?.definition?.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value
          )
        )
    );
  }, [currentPageComponents, setBoxList, currentLayout]);

  const noOfBoxs = Object.values(boxList || []).length;

  useEffect(() => {
    updateCanvasBottomHeight(boxList);
    noOfBoxs != 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noOfBoxs, triggerCanvasUpdater]);

  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  const handleResizeStop = useCallback(
    (boxList) => {
      const transformedBoxes = boxList.reduce((acc, box) => {
        acc[box.id] = box;
        return acc;
      }, {});
      boxList.forEach(({ id, height, width, x, y, gw }) => {
        const _canvasWidth = gw ? gw * NO_OF_GRIDS : canvasWidth;
        let newWidth = Math.round((width * NO_OF_GRIDS) / _canvasWidth);
        y = Math.round(y / GRID_HEIGHT) * GRID_HEIGHT;
        gw = gw ? gw : gridWidth;

        const parent = transformedBoxes[id]?.component?.parent;
        if (y < 0) {
          y = 0;
        }
        if (parent) {
          const parentElem = document.getElementById(`canvas-${parent}`);
          const parentId = parent.includes('-') ? parent?.split('-').slice(0, -1).join('-') : parent;
          const componentType = transformedBoxes.find((box) => box.id === parentId)?.component.component;
          var parentHeight = parentElem?.clientHeight || height;
          if (height > parentHeight && ['Tabs', 'Listview'].includes(componentType)) {
            height = parentHeight;
            y = 0;
          }
          let posX = Math.round(x / gw);
          if (posX + newWidth > 43) {
            newWidth = 43 - posX;
          }
        }
        setComponentLayout({
          [id]: {
            height: height ? height : GRID_HEIGHT,
            width: newWidth ? newWidth : 1,
            top: y,
            left: Math.round(x / gw),
          },
        });
      });
    },
    [canvasWidth, gridWidth, setComponentLayout]
  );

  const configHandleForMultiple = (id) => {
    return (
      <div
        className={'multiple-components-config-handle'}
        onMouseUpCapture={() => {
          if (lastDraggedEventsRef.current) {
            const parent = boxList.find((box) => box.id == lastDraggedEventsRef.current.events[0].target.id)?.component
              ?.parent;
            handleDragEnd(
              lastDraggedEventsRef.current.events.map((ev) => ({
                id: ev.target.id,
                x: ev.translate[0],
                y: ev.translate[1],
                parent,
              }))
            );
          }
          if (useGridStore.getState().isGroupHandleHoverd) {
            useGridStore.getState().actions.setIsGroupHandleHoverd(false);
          }
          const parentElm = lastDraggedEventsRef?.current?.events?.[0]?.target?.closest('.real-canvas');
          if (parentElm && parentElm?.classList?.contains('show-grid')) {
            parentElm?.classList?.remove('show-grid');
          }
        }}
        onMouseDownCapture={() => {
          lastDraggedEventsRef.current = null;
          if (!useGridStore.getState().isGroupHandleHoverd) {
            useGridStore.getState().actions.setIsGroupHandleHoverd(true);
          }
        }}
      >
        <span className="badge handle-content" id={id} style={{ background: '#4d72fa' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              style={{ cursor: 'pointer', marginRight: '5px', verticalAlign: 'middle' }}
              src="assets/images/icons/settings.svg"
              width="12"
              height="12"
              draggable="false"
            />
            <span>components</span>
          </div>
        </span>
      </div>
    );
  };

  //TO-DO -> Move this to moveableExtensions.js
  const MultiComponentHandle = {
    name: 'multiComponentHandle',
    props: [],
    events: [],
    render() {
      return configHandleForMultiple('multiple-components-config-handle');
    },
  };

  const CustomMouseInteraction = {
    name: 'customMouseInteraction',
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

  useEffect(() => {
    const controlBoxes = document.querySelectorAll('.moveable-control-box[target-id]');
    controlBoxes.forEach((box) => {
      box.style.display = '';
    });
    if (openModalWidgetId) {
      const children = findChildrenAndGrandchildren(openModalWidgetId, boxList);
      const controlBoxes = document.querySelectorAll('.moveable-control-box[target-id]');
      controlBoxes.forEach((box) => {
        const id = box.getAttribute('target-id');
        if (!children.includes(id)) {
          box.style.display = 'none';
        }
      });
    }
  }, [openModalWidgetId, boxList, selectedComponents]);

  /* DON'T ADD ANY STATE UPDATE LOGIC HERE */
  /* Added to avoid blocking the main thread */
  const reloadGrid = useCallback(async () => {
    window.requestIdleCallback(() => {
      if (moveableRef.current) {
        moveableRef.current.updateRect();
        moveableRef.current.updateTarget();
        moveableRef.current.updateSelectors();
      }
      Array.isArray(moveableRef.current?.moveable?.moveables) &&
        moveableRef.current?.moveable?.moveables.forEach((moveable) => {
          const {
            props: { target },
            controlBox,
          } = moveable;
          controlBox.setAttribute('target-id', target.id);
        });

      const selectedComponentsId = new Set(
        selectedComponents.map((componentId) => {
          return componentId;
        })
      );

      // Get all elements with the old class name
      var elements = document.getElementsByClassName('selected-component');
      // Iterate through the elements and replace the old class with the new one
      for (var i = 0; i < elements.length; i++) {
        elements[i].className = 'moveable-control-box modal-moveable rCS1w3zcxh';
      }

      const controlBoxes = moveableRef?.current?.moveable?.getMoveables();
      if (controlBoxes) {
        for (const element of controlBoxes) {
          if (selectedComponentsId.has(element?.props?.target?.id)) {
            element?.controlBox?.classList.add('selected-component', `sc-${element?.props?.target?.id}`);
          }
        }
      }
    });
  }, [selectedComponents]);

  const groupedTargets = [...findHighestLevelofSelection().map((component) => '.ele-' + component.id)];

  useEffect(() => {
    reloadGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponents, openModalWidgetId, boxList, currentLayout]);

  const updateNewPosition = (events, parent = null) => {
    const posWithParent = {
      events,
      parent,
    };
    lastDraggedEventsRef.current = posWithParent;
  };

  const isComponentVisible = (id) => {
    const component = getResolvedComponent(id);
    let visibility;
    if (isArray(component)) {
      visibility = component?.[0]?.properties?.visibility ?? component?.[0]?.styles?.visibility ?? null;
    } else {
      visibility = component?.properties?.visibility ?? component?.styles?.visibility ?? null;
    }
    return visibility;
  };

  const handleDragEnd = useCallback(
    (boxPositions) => {
      let newParent = null;
      const updatedLayouts = boxPositions.reduce((layouts, { id, x, y, parent }) => {
        const currentWidget = boxList.find((box) => box.id === id);
        const containerWidth = parent ? useGridStore.getState().subContainerWidths[parent] : gridWidth;

        let _width = currentWidget.layouts[currentLayout].width;
        let _height = currentWidget.layouts[currentLayout].height;

        // Adjust width if parent changed
        if (parent !== currentWidget.component?.parent) {
          const oldContainerWidth = currentWidget.component?.parent
            ? useGridStore.getState().subContainerWidths[currentWidget.component.parent]
            : gridWidth;
          _width = Math.round((_width * oldContainerWidth) / containerWidth);
        }

        // Ensure minimum width
        _width = Math.max(_width, 1);

        // Calculate new left position
        let _left = Math.round(x / containerWidth);

        // Adjust position and width if exceeding grid bounds
        if (_width + _left > NO_OF_GRIDS) {
          _left = Math.max(0, NO_OF_GRIDS - _width);
          _width = Math.min(_width, NO_OF_GRIDS);
        }

        // Round y position
        y = Math.max(0, Math.round(y / GRID_HEIGHT) * GRID_HEIGHT);
        // Adjust height for certain parent components
        if (parent) {
          const parentElem = document.getElementById(`canvas-${parent}`);
          const parentId = parent.includes('-') ? parent.split('-').slice(0, -1).join('-') : parent;
          const componentType = boxList.find((box) => box.id === parentId)?.component.component;
          const parentHeight = parentElem?.clientHeight || _height;
          if (_height > parentHeight && ['Tabs', 'Listview'].includes(componentType)) {
            _height = parentHeight;
            y = 0;
          }

          if (componentType === 'Listview' && y > parentHeight) {
            y = y % parentHeight;
          }
        }
        newParent = parent ? parent : null;
        layouts[id] = {
          width: _width,
          height: _height,
          top: y,
          left: _left,
        };

        return layouts;
      }, {});
      setComponentLayout(updatedLayouts, newParent, undefined, { updateParent: true });
      toggleCanvasUpdater();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boxList, currentLayout, gridWidth]
  );

  // Add event listeners for config handle visibility when hovering over widget boundary
  React.useEffect(() => {
    const moveableBox = document.querySelector(`.moveable-control-box`);
    const showConfigHandle = (e) => {
      const targetId = e.target.offsetParent.getAttribute('target-id');
      const configHandle = document.querySelector(`.config-handle[widget-id="${targetId}"]`);
      configHandle.classList.add('config-handle-visible');
    };
    const hideConfigHandle = (e) => {
      const targetId = e.target.offsetParent.getAttribute('target-id');
      const configHandle = document.querySelector(`.config-handle[widget-id="${targetId}"]`);
      configHandle.classList.remove('config-handle-visible');
    };
    if (moveableBox) {
      moveableBox.addEventListener('mouseover', showConfigHandle);
      moveableBox.addEventListener('mouseout', hideConfigHandle);
    }
    return () => {
      moveableBox.removeEventListener('mouseover', showConfigHandle);
      moveableBox.removeEventListener('mouseout', hideConfigHandle);
    };
  }, []);

  React.useEffect(() => {
    const components = Array.from(document.querySelectorAll('.active-target')).filter(
      (component) => !selectedComponents.includes(component.getAttribute('widgetid'))
    );
    const draggingOrResizing = draggingComponentId || resizingComponentId;
    if (!draggingOrResizing && components.length > 0) {
      for (const component of components) {
        component?.classList?.remove('active-target');
      }
    }
  }, [draggingComponentId, resizingComponentId, isGroupDragging, selectedComponents]);

  if (mode !== 'edit') return null;

  return (
    <>
      <Moveable
        dragTargetSelf={true}
        dragTarget={isGroupHandleHoverd ? document.getElementById('multiple-components-config-handle') : undefined}
        ref={moveableRef}
        ables={[CustomMouseInteraction, MultiComponentHandle]}
        props={{
          customMouseInteraction: groupedTargets.length < 2,
          multiComponentHandle: groupedTargets.length > 1,
        }}
        flushSync={flushSync}
        target={groupedTargets?.length > 1 ? groupedTargets : '.target'}
        origin={false}
        individualGroupable={groupedTargets.length <= 1}
        draggable={!shouldFreeze && mode !== 'view'}
        resizable={!shouldFreeze ? RESIZABLE_CONFIG : false && mode !== 'view'}
        keepRatio={false}
        individualGroupableProps={individualGroupableProps}
        onResize={(e) => {
          const currentWidget = boxList.find(({ id }) => id === e.target.id);
          let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
          if (currentWidget.component?.parent) {
            document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.add('show-grid');
            useGridStore.getState().actions.setDragTarget(currentWidget.component?.parent);
          } else {
            document.getElementById('real-canvas').classList.add('show-grid');
          }

          const currentWidth = currentWidget.width * _gridWidth;
          const diffWidth = e.width - currentWidth;
          const diffHeight = e.height - currentWidget.height;
          const isLeftChanged = e.direction[0] === -1;
          const isTopChanged = e.direction[1] === -1;

          let transformX = currentWidget.left * _gridWidth;
          let transformY = currentWidget.top;
          if (isLeftChanged) {
            transformX = currentWidget.left * _gridWidth - diffWidth;
          }
          if (isTopChanged) {
            transformY = currentWidget.top - diffHeight;
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
          // Postion ghost element exactly with respect to resizing element
          if (document.getElementById('resize-ghost-widget')) {
            document.getElementById(
              'resize-ghost-widget'
            ).style.transform = `translate(${transformX}px, ${transformY}px)`;
            document.getElementById('resize-ghost-widget').style.width = `${e.target.clientWidth}px`;
            document.getElementById('resize-ghost-widget').style.height = `${e.target.clientHeight}px`;
          }
        }}
        onResizeStart={(e) => {
          if (
            e.target.id &&
            useGridStore.getState().resizingComponentId !== e.target.id &&
            !e.target.classList.contains('delete-icon')
          ) {
            // When clicked on widget boundary/resizer, select the component
            setSelectedComponents([e.target.id]);
          }

          if (!isComponentVisible(e.target.id)) {
            return false;
          }
          useGridStore.getState().actions.setResizingComponentId(e.target.id);
          e.setMin([gridWidth, GRID_HEIGHT]);
        }}
        onResizeEnd={(e) => {
          try {
            useGridStore.getState().actions.setResizingComponentId(null);
            const currentWidget = boxList.find(({ id }) => {
              return id === e.target.id;
            });
            document.getElementById('real-canvas')?.classList.remove('show-grid');
            document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.remove('show-grid');
            let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
            let width = Math.round(e?.lastEvent?.width / _gridWidth) * _gridWidth;
            const height = Math.round(e?.lastEvent?.height / GRID_HEIGHT) * GRID_HEIGHT;

            const currentWidth = currentWidget.width * _gridWidth;
            const diffWidth = e.lastEvent?.width - currentWidth;
            const diffHeight = e.lastEvent?.height - currentWidget?.height;
            const isLeftChanged = e.lastEvent?.direction?.[0] === -1;
            const isTopChanged = e.lastEvent?.direction?.[1] === -1;

            let transformX = currentWidget.left * _gridWidth;
            let transformY = currentWidget.top;
            if (isLeftChanged) {
              transformX = currentWidget.left * _gridWidth - diffWidth;
            }
            if (isTopChanged) {
              transformY = currentWidget.top - diffHeight;
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

            const roundedTransformY = Math.round(transformY / GRID_HEIGHT) * GRID_HEIGHT;
            transformY = transformY % GRID_HEIGHT === 5 ? roundedTransformY - GRID_HEIGHT : roundedTransformY;
            e.target.style.transform = `translate(${Math.round(transformX / _gridWidth) * _gridWidth}px, ${
              Math.round(transformY / GRID_HEIGHT) * GRID_HEIGHT
            }px)`;
            if (!maxWidthHit || e.width < e.target.clientWidth) {
              e.target.style.width = `${Math.round(e.lastEvent.width / _gridWidth) * _gridWidth}px`;
            }
            if (!maxHeightHit || e.height < e.target.clientHeight) {
              e.target.style.height = `${Math.round(e.lastEvent.height / GRID_HEIGHT) * GRID_HEIGHT}px`;
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
            handleResizeStop([resizeData]);
          } catch (error) {
            console.error('ResizeEnd error ->', error);
          }
          useGridStore.getState().actions.setDragTarget();
          toggleCanvasUpdater();
        }}
        onResizeGroupStart={({ events }) => {
          const parentElm = events[0].target.closest('.real-canvas');
          parentElm.classList.add('show-grid');
        }}
        onResizeGroup={({ events }) => {
          const parentElm = events[0].target.closest('.real-canvas');
          const parentWidth = parentElm?.clientWidth;
          const parentHeight = parentElm?.clientHeight;

          const { posRight, posLeft, posTop, posBottom } = getPositionForGroupDrag(events, parentWidth, parentHeight);
          events.forEach((ev) => {
            ev.target.style.width = `${ev.width}px`;
            ev.target.style.height = `${ev.height}px`;
            ev.target.style.transform = ev.drag.transform;
          });

          if (!(posLeft < 0 || posTop < 0 || posRight < 0 || posBottom < 0)) {
            groupResizeDataRef.current = events;
          }
        }}
        onResizeGroupEnd={(e) => {
          try {
            const { events } = e;
            const newBoxs = [];

            const parentElm = events[0].target.closest('.real-canvas');
            parentElm.classList.remove('show-grid');

            // TODO: Logic needs to be relooked post go live P2
            groupResizeDataRef.current.forEach((ev) => {
              const currentWidget = boxList.find(({ id }) => {
                return id === ev.target.id;
              });
              let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
              let width = Math.round(ev.width / _gridWidth) * _gridWidth;
              width = width < _gridWidth ? _gridWidth : width;
              let posX = Math.round(ev.drag.translate[0] / _gridWidth) * _gridWidth;
              let posY = Math.round(ev.drag.translate[1] / GRID_HEIGHT) * GRID_HEIGHT;
              let height = Math.round(ev.height / GRID_HEIGHT) * GRID_HEIGHT;
              height = height < GRID_HEIGHT ? GRID_HEIGHT : height;

              ev.target.style.width = `${width}px`;
              ev.target.style.height = `${height}px`;
              ev.target.style.transform = `translate(${posX}px, ${posY}px)`;
              newBoxs.push({
                id: ev.target.id,
                height: height,
                width: width,
                x: posX,
                y: posY,
                gw: _gridWidth,
              });
            });

            if (groupResizeDataRef.current.length) {
              handleResizeStop(newBoxs);
            } else {
              events.forEach((ev) => {
                const currentWidget = boxList.find(({ id }) => {
                  return id === ev.target.id;
                });
                let _gridWidth =
                  useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
                let width = currentWidget?.layouts[currentLayout].width * _gridWidth;
                let posX = currentWidget?.layouts[currentLayout].left * _gridWidth;
                let posY = currentWidget?.layouts[currentLayout].top;
                let height = currentWidget?.layouts[currentLayout].height;
                height = height < GRID_HEIGHT ? GRID_HEIGHT : height;
                ev.target.style.width = `${width}px`;
                ev.target.style.height = `${height}px`;
                ev.target.style.transform = `translate(${posX}px, ${posY}px)`;
              });
            }
            groupResizeDataRef.current = [];
            reloadGrid();
          } catch (error) {
            console.error('Error resizing group', error);
          }
          toggleCanvasUpdater();
        }}
        checkInput
        onDragStart={(e) => {
          if (getHoveredComponentForGrid() !== e.target.id) {
            return false;
          }
          newDragParentId.current = boxList.find((box) => box.id === e.target.id)?.parent;
          e?.moveable?.controlBox?.removeAttribute('data-off-screen');
          const box = boxList.find((box) => box.id === e.target.id);
          // Prevent drag if shift is pressed for SUBCONTAINER_WIDGETS
          if (SUBCONTAINER_WIDGETS.includes(box?.component?.component) && e.inputEvent.shiftKey) {
            return false;
          }
          //  This flag indicates whether the drag event originated on a child element within a component
          //  (e.g., inside a Table's columns, Calendar's dates, or Kanban's cards).
          //  When true, it prevents the parent component from being dragged, allowing the inner elements
          //  to handle their own interactions like column resizing or card dragging
          let isDragOnInnerElement = false;

          /* If the drag or click is on a calender popup draggable interactions are not executed so that popups and other components inside calender popup works. 
            Also user dont need to drag an calender from using popup */
          if (hasParentWithClass(e.inputEvent.target, 'react-datepicker-popper')) {
            return false;
          }

          /* Checking if the dragged elemenent is a table. If its a table drag is disabled since it will affect column resizing and reordering */
          if (box?.component?.component === 'Table') {
            const tableElem = e.target.querySelector('.jet-data-table');
            isDragOnInnerElement = tableElem.contains(e.inputEvent.target);
          }
          if (box?.component?.component === 'Calendar') {
            const calenderElem =
              e.target.querySelector('.rbc-month-view') ||
              e.target.querySelector('.rbc-time-view') ||
              e.target.querySelector('.rbc-day-view');
            isDragOnInnerElement = calenderElem.contains(e.inputEvent.target);
          }

          if (box?.component?.component === 'Kanban') {
            const handleContainers = e.target.querySelectorAll('.handle-container');
            isDragOnInnerElement = Array.from(handleContainers).some((container) =>
              container.contains(e.inputEvent.target)
            );
          }

          if (['RangeSlider', 'BoundedBox'].includes(box?.component?.component) || isDragOnInnerElement) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const isHandle = targetElems.find((ele) => ele.classList.contains('handle-content'));
            if (!isHandle) {
              return false;
            }
          }
          // This is to prevent parent component from being dragged and the stop the propagation of the event
        }}
        onDragEnd={(e) => {
          try {
            if (isDraggingRef.current) {
              useGridStore.getState().actions.setDraggingComponentId(null);
              isDraggingRef.current = false;
            }
            prevDragParentId.current = null;
            newDragParentId.current = null;
            setDragParentId(null);

            if (!e.lastEvent) {
              return;
            }

            let draggedOverElemId = boxList.find((box) => box.id === e.target.id)?.parent;
            let draggedOverElemIdType;
            const parentComponent = boxList.find((box) => box.id === boxList.find((b) => b.id === e.target.id)?.parent);
            let draggedOverElem;
            if (document.elementFromPoint(e.clientX, e.clientY) && parentComponent?.component?.component !== 'Modal') {
              const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
              draggedOverElem = targetElems.find((ele) => {
                const isOwnChild = e.target.contains(ele); // if the hovered element is a child of actual draged element its not considered
                if (isOwnChild) return false;

                let isDroppable = ele.id !== e.target.id && ele.classList.contains('drag-container-parent');
                if (isDroppable) {
                  let widgetId = ele?.getAttribute('component-id') || ele.id;
                  let widgetType = boxList.find(({ id }) => id === widgetId)?.component?.component;
                  if (!widgetType) {
                    widgetId = widgetId.split('-').slice(0, -1).join('-');
                    widgetType = boxList.find(({ id }) => id === widgetId)?.component?.component;
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
            const currentParentId = boxList.find(({ id: widgetId }) => e.target.id === widgetId)?.component?.parent;
            let left = e.lastEvent?.translate[0];
            let top = e.lastEvent?.translate[1];
            if (
              ['Listview', 'Kanban', 'Container'].includes(
                boxList.find((box) => box.id === draggedOverElemId)?.component?.component
              )
            ) {
              const elemContainer = e.target.closest('.real-canvas');
              const containerHeight = elemContainer.clientHeight;
              const maxY = containerHeight - e.target.clientHeight;
              top = top > maxY ? maxY : top;
            }

            const currentWidget = boxList.find(({ id }) => id === e.target.id)?.component?.component;
            const parentId = draggedOverElemId?.length > 36 ? draggedOverElemId.slice(0, 36) : draggedOverElemId;
            draggedOverElemIdType = getComponentTypeFromId(parentId);
            const parentWidget = draggedOverElemIdType === 'Kanban' ? 'Kanban_card' : draggedOverElemIdType;
            const restrictedWidgets = restrictedWidgetsObj?.[parentWidget] || [];
            const isParentChangeAllowed = !restrictedWidgets.includes(currentWidget);
            if (draggedOverElemId !== currentParentId) {
              if (isParentChangeAllowed) {
                const draggedOverWidget = boxList.find((box) => box.id === draggedOverElemId);

                let parentWidgetType = boxList.find((box) => box.id === draggedOverElemId)?.component?.component;
                // @TODO - When dropping back to container from canvas, the boxList doesn't have canvas header,
                // boxList will return null. But we need to tell getMouseDistanceFromParentDiv parentWidgetType is container
                // As container id is like 'canvas-2375e23765e-123234'
                if (parentId && !parentWidgetType && draggedOverElemId.includes('-header')) {
                  parentWidgetType = 'Container';
                }

                let { left: _left, top: _top } = getMouseDistanceFromParentDiv(
                  e,
                  draggedOverWidget?.component?.component === 'Kanban' ? draggedOverElem : draggedOverElemId,
                  parentWidgetType
                );
                left = _left;
                top = _top;
              } else {
                const currBox = boxList.find((l) => l.id === e.target.id);
                left = currBox.left * gridWidth;
                top = currBox.top;
                toast.error(`${currentWidget} is not compatible as a child component of ${parentWidget}`);
                e.target.style.transform = `translate(${left}px, ${top}px)`;
              }
            }
            e.target.style.transform = `translate(${Math.round(left / _gridWidth) * _gridWidth}px, ${
              Math.round(top / GRID_HEIGHT) * GRID_HEIGHT
            }px)`;
            if (draggedOverElemId === currentParentId || isParentChangeAllowed) {
              handleDragEnd([
                {
                  id: e.target.id,
                  x: left,
                  y: Math.round(top / GRID_HEIGHT) * GRID_HEIGHT,
                  parent: isParentChangeAllowed ? draggedOverElemId : undefined,
                },
              ]);
            }
            const box = boxList.find((box) => box.id === e.target.id);
            //
            setTimeout(() => setSelectedComponents([box.id]));
          } catch (error) {
            console.log('draggedOverElemId->error', error);
          }
          // Hide all sub-canvases
          var canvasElms = document.getElementsByClassName('sub-canvas');
          var elementsArray = Array.from(canvasElms);
          elementsArray.forEach(function (element) {
            element.classList.remove('show-grid');
            element.classList.add('hide-grid');
          });
          document.getElementById('real-canvas')?.classList.remove('show-grid');
          toggleCanvasUpdater();
        }}
        onDrag={(e) => {
          if (!isDraggingRef.current) {
            useGridStore.getState().actions.setDraggingComponentId(e.target.id);
            isDraggingRef.current = true;
          }

          const currentWidget = boxList.find((box) => box.id === e.target.id);
          const currentParentId =
            currentWidget?.component?.parent === null ? 'canvas' : currentWidget?.component?.parent;
          const _gridWidth = useGridStore.getState().subContainerWidths[dragParentId] || gridWidth;
          const parentComponent = boxList.find((box) => box.id === dragParentId);
          const _dragParentId = newDragParentId.current === null ? 'canvas' : newDragParentId.current;

          let left = Math.round(e.translate[0] / _gridWidth) * _gridWidth;
          let top = Math.round(e.translate[1] / GRID_HEIGHT) * GRID_HEIGHT;
          // This logic is to handle the case when the dragged element is over a new canvas
          if (_dragParentId !== currentParentId) {
            left = e.translate[0];
            top = e.translate[1];
          }

          // Snap to grid

          // Special case for Modal
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

          // This block is to show grid lines on the canvas when the dragged element is over a new canvas
          if (document.elementFromPoint(e.clientX, e.clientY)) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const draggedOverElements = targetElems.filter(
              (ele) =>
                ele.id !== e.target.id && (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
            );
            const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
            const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));
            const appCanvas = document.getElementById('real-canvas');

            // Show grid line for manin canvas
            draggedOverContainer?.classList.remove('hide-grid');
            draggedOverContainer?.classList.add('show-grid');
            // Remove 'show-grid' class from all sub-canvases
            const canvasElms = document.getElementsByClassName('sub-canvas');
            Array.from(canvasElms).forEach((element) => {
              element.classList.remove('show-grid');
              element.classList.add('hide-grid');
            });

            // Determine the current parent and potential new parent
            const parentId = draggedOverContainer?.getAttribute('data-parentId') || draggedOverElem?.id;
            if (parentId !== prevDragParentId.current) {
              setDragParentId(parentId === 'canvas' ? null : parentId);
              newDragParentId.current = parentId === 'canvas' ? null : parentId;
              prevDragParentId.current = parentId;
            }
            // Show grid for the appropriate canvas
            if (parentId) {
              const newParentCanvas = document.getElementById('canvas-' + parentId);
              if (newParentCanvas) {
                appCanvas?.classList?.remove('show-grid');
                newParentCanvas?.classList.remove('hide-grid');
                newParentCanvas?.classList.add('show-grid');
              }
            }
            useGridStore.getState().actions.setDragTarget(parentId);
          }
          // Postion ghost element exactly as same at dragged element
          if (document.getElementById('moveable-drag-ghost')) {
            document.getElementById('moveable-drag-ghost').style.transform = `translate(${left}px, ${top}px)`;
            document.getElementById('moveable-drag-ghost').style.width = `${e.target.clientWidth}px`;
            document.getElementById('moveable-drag-ghost').style.height = `${e.target.clientHeight}px`;
          }
        }}
        onDragGroup={(ev) => {
          const { events } = ev;
          const parentElm = events[0]?.target?.closest('.real-canvas');
          if (parentElm && !parentElm.classList.contains('show-grid')) {
            parentElm?.classList?.add('show-grid');
          }

          events.forEach((ev) => {
            const currentWidget = boxList.find(({ id }) => id === ev.target.id);
            const _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;

            let left = Math.round(ev.translate[0] / _gridWidth) * _gridWidth;
            let top = Math.round(ev.translate[1] / GRID_HEIGHT) * GRID_HEIGHT;

            ev.target.style.transform = `translate(${left}px, ${top}px)`;
          });
          updateNewPosition(events);
        }}
        onDragGroupStart={({ events }) => {
          setIsGroupDragging(true);
          const parentElm = events[0]?.target?.closest('.real-canvas');
          parentElm?.classList?.add('show-grid');
        }}
        onDragGroupEnd={(e) => {
          try {
            setIsGroupDragging(false);
            const { events } = e;
            const parentId = boxList.find((box) => box.id === events[0]?.target?.id)?.component?.parent;
            const parentElm = events[0].target.closest('.real-canvas');
            parentElm.classList.remove('show-grid');

            const parentWidth = parentElm?.clientWidth;
            const parentHeight = parentElm?.clientHeight;

            const { posRight, posLeft, posTop, posBottom } = getPositionForGroupDrag(events, parentWidth, parentHeight);
            const _gridWidth = useGridStore.getState().subContainerWidths[parentId] || gridWidth;

            handleDragEnd(
              events.map((ev) => {
                let posX = ev.lastEvent.translate[0];
                let posY = ev.lastEvent.translate[1];
                if (posLeft < 0) {
                  posX = ev.lastEvent.translate[0] - posLeft;
                }
                if (posTop < 0) {
                  posY = ev.lastEvent.translate[1] - posTop;
                }
                if (posRight < 0) {
                  posX = ev.lastEvent.translate[0] + posRight;
                }
                if (posBottom < 0) {
                  posY = ev.lastEvent.translate[1] + posBottom;
                }
                ev.target.style.transform = `translate(${Math.round(posX / _gridWidth) * _gridWidth}px, ${
                  Math.round(posY / GRID_HEIGHT) * GRID_HEIGHT
                }px)`;
                return {
                  id: ev.target.id,
                  x: posX,
                  y: posY,
                  parent: parentId,
                };
              })
            );
          } catch (error) {
            console.error('Error dragging group', error);
          }
          toggleCanvasUpdater();
        }}
        bounds={CANVAS_BOUNDS}
        displayAroundControls={true}
        controlPadding={20}
        //snap settgins
        snappable={true}
        snapGap={false}
        isDisplaySnapDigit={false}
        snapThreshold={10}
        // Guidelines configuration
        elementGuidelines={elementGuidelines}
        snapDirections={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          center: false,
          middle: false,
        }}
        elementSnapDirections={{
          top: true,
          left: true,
          bottom: true,
          right: true,
          center: false,
          middle: false,
        }}
        onSnap={(e) => {
          const components = e.elements;
          if (isArray(componentsSnappedTo.current)) {
            for (const component of componentsSnappedTo.current) {
              component?.element?.classList?.remove('active-target');
            }
          }
          componentsSnappedTo.current = components;
          for (const component of components) {
            component.element.classList.add('active-target');
          }
        }}
        snapGridAll={true}
      />
    </>
  );
}
