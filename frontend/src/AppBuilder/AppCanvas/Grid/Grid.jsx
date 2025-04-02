// import '@/Editor/wdyr';
import React, { useEffect, useState, useRef, useCallback } from 'react';
// eslint-disable-next-line import/no-unresolved
import Moveable from 'react-moveable';
import { shallow } from 'zustand/shallow';
import _, { isArray, isEmpty } from 'lodash';
import { flushSync } from 'react-dom';
import { RESTRICTED_WIDGETS_CONFIG } from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';
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
  hideGridLines,
  showGridLines,
  handleActivateTargets,
  handleDeactivateTargets,
  handleActivateNonDraggingComponents,
} from './gridUtils';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { dragContextBuilder, getAdjustedDropPosition } from './helpers/dragEnd';
import useStore from '@/AppBuilder/_stores/store';
import './Grid.css';
import { NO_OF_GRIDS, SUBCONTAINER_WIDGETS } from '../appCanvasConstants';
import { useDndMoveableGuidelines } from './useDndMoveableGuidelines';
import useDndMoveable from './useDndMoveable';

const CANVAS_BOUNDS = { left: 0, top: 0, right: 0, position: 'css' };
const RESIZABLE_CONFIG = {
  edge: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
  renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
};
export const GRID_HEIGHT = 10;

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
  const [canvasBounds, setCanvasBounds] = useState(CANVAS_BOUNDS);
  const draggingComponentId = useStore((state) => state.draggingComponentId, shallow);
  const resizingComponentId = useGridStore((state) => state.resizingComponentId, shallow);
  const [dragParentId, setDragParentId] = useState(null);
  const [elementGuidelines, setElementGuidelines] = useState([]);
  const componentsSnappedTo = useRef(null);
  const prevDragParentId = useRef(null);
  const newDragParentId = useRef(null);
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  // useDndMoveable(moveableRef);
  useDndMoveableGuidelines(moveableRef);

  useEffect(() => {
    const selectedSet = new Set(selectedComponents);
    const draggingOrResizingId = draggingComponentId || resizingComponentId;
    const isGrouped = findHighestLevelofSelection().length > 1;
    const firstSelectedParent =
      selectedComponents.length > 0 ? boxList.find((b) => b.id === selectedComponents[0])?.parent : null;
    const selectedParent = dragParentId || firstSelectedParent;

    const guidelines = boxList
      .filter((box) => {
        const isVisible =
          getResolvedValue(box?.component?.definition?.properties?.visibility?.value) ||
          getResolvedValue(box?.component?.definition?.styles?.visibility?.value);

        // Early return for non-visible elements
        if (!isVisible) return false;

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

  const configHandleWhenMultipleComponentSelected = (id) => {
    return (
      <div
        className={'multiple-components-config-handle'}
        onMouseUpCapture={() => {
          if (lastDraggedEventsRef.current) {
            // Creatint the same event object that matches what onDragGroupEnd expects
            const event = {
              clientX: lastDraggedEventsRef.current.events[0].clientX,
              clientY: lastDraggedEventsRef.current.events[0].clientY,
              events: lastDraggedEventsRef.current.events.map((ev) => ({
                target: ev.target,
                lastEvent: {
                  translate: [ev.translate[0], ev.translate[1]],
                },
              })),
            };

            handleDragGroupEnd(event);
          }

          if (useGridStore.getState().isGroupHandleHoverd) {
            useGridStore.getState().actions.setIsGroupHandleHoverd(false);
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
      return configHandleWhenMultipleComponentSelected('multiple-components-config-handle');
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
      moveableRef.current?.waitToChangeTarget().then(() => {
        console.log('waitToChangeTarget');
        moveableRef.current?.dragStart(e);
      });
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
  // This is needed even though we have hovered widget state because when hovered on boundary,
  // the hovered widget state is empty, hence created a separate state for boundary
  React.useEffect(() => {
    const moveableBox = document.querySelector(`.moveable-control-box`);
    const showConfigHandle = (e) => {
      const targetId = e.target.offsetParent.getAttribute('target-id');
      useStore.getState().setHoveredComponentBoundaryId(targetId);
    };
    const hideConfigHandle = () => {
      useStore.getState().setHoveredComponentBoundaryId('');
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

  const handleDragGroupEnd = (e) => {
    try {
      hideGridLines();
      setIsGroupDragging(false);
      const { events, clientX, clientY } = e;
      const initialParent = events[0].target.closest('.real-canvas');
      // Get potential new parent using same logic as onDragEnd
      let draggedOverElemId;
      let draggedOverElem;
      if (document.elementFromPoint(clientX, clientY)) {
        const targetElems = document.elementsFromPoint(clientX, clientY);
        draggedOverElem = targetElems.find((ele) => {
          const isOwnChild = events.some((ev) => ev.target.contains(ele));
          if (isOwnChild) return false;

          let isDroppable =
            !events.some((ev) => ev.target.id === ele.id) && ele.classList.contains('drag-container-parent');
          if (isDroppable) {
            let widgetId = ele?.getAttribute('component-id') || ele.id;
            let widgetType = boxList.find(({ id }) => id === widgetId)?.component?.component;
            if (!widgetType) {
              widgetId = widgetId.split('-').slice(0, -1).join('-');
              widgetType = boxList.find(({ id }) => id === widgetId)?.component?.component;
            }
            if (
              !['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container', 'Table'].includes(widgetType)
            ) {
              isDroppable = false;
            }
          }
          return isDroppable;
        });
        draggedOverElemId = draggedOverElem?.getAttribute('component-id') || draggedOverElem?.id;
      }

      const widgetsTypeToBeDropped = boxList
        .filter(({ id }) => events.some((ev) => ev.target.id === id))
        .map(({ component }) => component.component);
      const parentId = draggedOverElemId?.length > 36 ? draggedOverElemId.slice(0, 36) : draggedOverElemId;
      const parentWidgetType = getComponentTypeFromId(parentId);
      const restrictedWidgetsTobeDropped =
        RESTRICTED_WIDGETS_CONFIG?.[parentWidgetType]?.filter((widgetType) =>
          widgetsTypeToBeDropped.includes(widgetType)
        ) || [];
      const isParentChangeAllowed = isEmpty(restrictedWidgetsTobeDropped);

      if (!isParentChangeAllowed) {
        // Get original positions for all dragged components
        const currBoxes = boxList
          .filter(({ id }) => events.some((ev) => ev.target.id === id))
          .map(({ id, left, top, parent }) => ({ id, left, top, parent }));

        // Return each component to its original position
        events.forEach((ev) => {
          const originalBox = currBoxes.find((box) => box.id === ev.target.id);
          const _gridWidth = useGridStore.getState().subContainerWidths[originalBox?.parent] || gridWidth;
          if (originalBox) {
            const _left = originalBox.left * _gridWidth;
            const _top = originalBox.top;

            // Apply transform to return to original position
            ev.target.style.transform = `translate(${Math.round(_left / _gridWidth) * _gridWidth}px, ${
              Math.round(_top / GRID_HEIGHT) * GRID_HEIGHT
            }px)`;
          }
        });

        // Show error message
        toast.error(`${restrictedWidgetsTobeDropped} is not compatible as a child component of ${parentWidgetType}`);
      }

      const parentElm = draggedOverElem || document.getElementById('real-canvas');
      const parentCanvas =
        document.getElementById('canvas-' + draggedOverElemId) || document.getElementById('real-canvas');
      parentCanvas?.classList?.remove('show-grid');
      const _gridWidth = useGridStore.getState().subContainerWidths[draggedOverElemId] || gridWidth;

      if (isParentChangeAllowed) {
        handleDragEnd(
          events.map((ev) => {
            const {
              translate: [rawPosX, rawPosY],
            } = ev.lastEvent;

            // Calculate adjusted positions when parent changes
            let posX = rawPosX;
            let posY = rawPosY;

            if (parentElm && initialParent !== parentElm) {
              const newParentRect = parentElm.getBoundingClientRect();
              const initialParentRect = initialParent.getBoundingClientRect();

              // Adjust coordinates based on the difference in parent positions
              posX = rawPosX - (newParentRect.left - initialParentRect.left);
              posY = rawPosY - (newParentRect.top - initialParentRect.top);
            }

            // Apply grid snapping and bounds
            const snappedX = Math.round(posX / _gridWidth) * _gridWidth;
            const snappedY = Math.round(posY / GRID_HEIGHT) * GRID_HEIGHT;

            ev.target.style.transform = `translate(${snappedX}px, ${snappedY}px)`;
            return {
              id: ev.target.id,
              x: posX,
              y: posY,
              parent: draggedOverElemId,
            };
          })
        );
      }
    } catch (error) {
      console.error('Error dragging group', error);
    }
  };

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
  const ProgrammaticDrag = {
    name: 'programmaticDrag',
    props: [],
    events: [],

    // Method to manually start a drag operation
    startDrag(elementId, initialPosition) {
      const moveableInstance = moveableRef.current;
      if (!moveableInstance) return;

      const targetElement = document.getElementById(elementId);
      if (!targetElement) return;

      // Save reference to target and starting position
      this._targetElement = targetElement;
      this._startPos = initialPosition;

      // Create a synthetic mousedown-like event
      const inputEvent = {
        type: 'mousedown',
        target: targetElement,
        currentTarget: targetElement,
        clientX: initialPosition.x,
        clientY: initialPosition.y,
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      // Create a complete event object matching what Moveable expects
      const dragEvent = {
        target: targetElement,
        clientX: initialPosition.x,
        clientY: initialPosition.y,
        inputEvent: inputEvent,
        datas: {}, // Will store drag state
        originalDatas: {},
        isPinch: false,
        isFirstDrag: true,
        isTrusted: true,
      };

      // Get the draggable able
      const draggableAble = moveableInstance.moveable.getAble('draggable');
      if (!draggableAble) return;

      // Directly call the internal dragStart method on the Draggable able
      const result = draggableAble.dragStart(moveableInstance.moveable, dragEvent);

      // Store the event data for later use
      this._dragEvent = dragEvent;

      // After internal processing, trigger the public event
      if (moveableInstance.props.onDragStart) {
        moveableInstance.props.onDragStart(dragEvent);
      }

      return result;
    },

    // Method to update drag position
    updateDrag(elementId, newPosition) {
      const moveableInstance = moveableRef.current;
      if (!moveableInstance || !this._dragEvent || !this._startPos) return;

      // Calculate delta from starting position
      const deltaX = newPosition.x - this._startPos.x;
      const deltaY = newPosition.y - this._startPos.y;

      // Create a synthetic mousemove-like event
      const inputEvent = {
        type: 'mousemove',
        target: this._targetElement,
        currentTarget: this._targetElement,
        clientX: newPosition.x,
        clientY: newPosition.y,
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      // Create a complete event object for drag
      const dragEvent = {
        ...this._dragEvent,
        clientX: newPosition.x,
        clientY: newPosition.y,
        inputEvent: inputEvent,
        delta: [deltaX, deltaY],
        dist: [deltaX, deltaY],
        translate: [deltaX, deltaY],
        transform: `translate(${deltaX}px, ${deltaY}px)`,
        isPinch: false,
        isFirstDrag: false,
      };

      // Get the draggable able
      const draggableAble = moveableInstance.moveable.getAble('draggable');
      if (!draggableAble) return;

      // Directly call the internal drag method on the Draggable able
      const result = draggableAble.drag(moveableInstance.moveable, dragEvent);

      // After internal processing, trigger the public event
      if (moveableInstance.props.onDrag) {
        moveableInstance.props.onDrag(dragEvent);
      }

      return result;
    },

    // Method to end a drag operation
    endDrag(elementId, finalPosition) {
      const moveableInstance = moveableRef.current;
      if (!moveableInstance || !this._dragEvent || !this._startPos) return;

      // Calculate final delta
      const deltaX = finalPosition.x - this._startPos.x;
      const deltaY = finalPosition.y - this._startPos.y;

      // Create a synthetic mouseup-like event
      const inputEvent = {
        type: 'mouseup',
        target: this._targetElement,
        currentTarget: this._targetElement,
        clientX: finalPosition.x,
        clientY: finalPosition.y,
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      // Create a complete event object for dragEnd
      const dragEndEvent = {
        ...this._dragEvent,
        clientX: finalPosition.x,
        clientY: finalPosition.y,
        inputEvent: inputEvent,
        lastEvent: {
          translate: [deltaX, deltaY],
          transform: `translate(${deltaX}px, ${deltaY}px)`,
        },
        isDrag: Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0,
        isDouble: false,
      };

      // Get the draggable able
      const draggableAble = moveableInstance.moveable.getAble('draggable');
      if (!draggableAble) return;

      // Directly call the internal dragEnd method
      const result = draggableAble.dragEnd(moveableInstance.moveable, dragEndEvent);

      // After internal processing, trigger the public event
      if (moveableInstance.props.onDragEnd) {
        moveableInstance.props.onDragEnd(dragEndEvent);
      }

      // Clean up stored data
      this._dragEvent = null;
      this._startPos = null;
      this._targetElement = null;

      return result;
    },
  };
  if (mode !== 'edit') return null;

  return (
    <>
      <Moveable
        dragTargetSelf={true}
        dragTarget={isGroupHandleHoverd ? document.getElementById('multiple-components-config-handle') : undefined}
        ref={moveableRef}
        ables={[CustomMouseInteraction, MultiComponentHandle, ProgrammaticDrag]}
        props={{
          customMouseInteraction: groupedTargets.length < 2,
          multiComponentHandle: groupedTargets.length > 1,
          draggable: true,
          programmaticDrag: true,
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
          moveableRef?.current?.dragStart({ target: e.target });
          const currentWidget = boxList.find(({ id }) => id === e.target.id);
          let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
          if (currentWidget.component?.parent) {
            document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.add('show-grid');
            setDragParentId(currentWidget.component?.parent);
          } else {
            document.getElementById('real-canvas').classList.add('show-grid');
          }
          handleActivateTargets(currentWidget.component?.parent);
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
          showGridLines();
          if (!isComponentVisible(e.target.id)) {
            return false;
          }
          handleActivateNonDraggingComponents();
          useGridStore.getState().actions.setResizingComponentId(e.target.id);
          e.setMin([gridWidth, GRID_HEIGHT]);
        }}
        onResizeEnd={(e) => {
          try {
            useGridStore.getState().actions.setResizingComponentId(null);
            const currentWidget = boxList.find(({ id }) => {
              return id === e.target.id;
            });
            hideGridLines();
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
          handleDeactivateTargets();
          setDragParentId(null);
          toggleCanvasUpdater();
        }}
        onResizeGroupStart={({ events }) => {
          showGridLines();
          handleActivateNonDraggingComponents();
        }}
        onResizeGroup={({ events }) => {
          const parentElm = events[0].target.closest('.real-canvas');
          const parentWidth = parentElm?.clientWidth;
          const parentHeight = parentElm?.clientHeight;
          handleActivateTargets(parentElm?.id?.replace('canvas-', ''));
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

            hideGridLines();

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
          handleDeactivateTargets();
          toggleCanvasUpdater();
        }}
        checkInput
        onDragStart={(e) => {
          console.log('onDragStart', e);
          // This is to prevent parent component from being dragged and the stop the propagation of the event
          // if (getHoveredComponentForGrid() !== e.target.id) {
          //   return false;
          // }
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
          // if (hasParentWithClass(e.inputEvent?.target, 'react-datepicker-popper')) {
          //   return false;
          // }

          /* Checking if the dragged elemenent is a table. If its a table drag is disabled since it will affect column resizing and reordering */
          if (box?.component?.component === 'Table') {
            const tableElem = e.target.querySelector('.jet-data-table');
            isDragOnInnerElement = tableElem.contains(e.inputEvent.target);
          }
          if (box?.component?.component === 'Calendar') {
            const calenderElem = e.target.querySelector('.rbc-month-view');
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
          handleActivateNonDraggingComponents();
        }}
        onDragEnd={(e) => {
          handleDeactivateTargets();
          try {
            if (isDraggingRef.current) {
              useStore.getState().setDraggingComponentId(null);
              isDraggingRef.current = false;
            }
            prevDragParentId.current = null;
            newDragParentId.current = null;
            setDragParentId(null);

            if (!e.lastEvent) return;

            // Build the drag context from the event
            const dragContext = dragContextBuilder({ event: e, widgets: boxList });
            const { target, source, dragged } = dragContext;

            const targetSlotId = target?.slotId;
            const targetGridWidth = useGridStore.getState().subContainerWidths[targetSlotId] || gridWidth;

            // const restrictedWidgets = RESTRICTED_WIDGETS_CONFIG?.[source.widgetType] || [];
            // const draggedWidgetType = dragged.widgetType;
            const isParentChangeAllowed = dragContext.isDroppable;

            // Compute new position
            let { left, top } = getAdjustedDropPosition(e, target, isParentChangeAllowed, targetGridWidth, dragged);

            const isModalToCanvas = source.isModal && target.slotId === 'real-canvas';

            if (isParentChangeAllowed && !isModalToCanvas) {
              const parent = target.slotId === 'real-canvas' ? null : target.slotId;
              // Special case for Modal; If source widget is modal, prevent drops to canvas
              handleDragEnd([{ id: e.target.id, x: left, y: top, parent }]);
            } else {
              const sourcegridWidth = useGridStore.getState().subContainerWidths[source.slotId] || gridWidth;

              left = dragged.left * sourcegridWidth;
              top = dragged.top;

              !isModalToCanvas ??
                toast.error(`${dragged.widgetType} is not compatible as a child component of ${target.widgetType}`);
            }

            // Apply transform for smooth transition
            e.target.style.transform = `translate(${left}px, ${top}px)`;

            // Select the dragged component after drop
            setTimeout(() => setSelectedComponents([dragged.id]));
          } catch (error) {
            console.error('Error in onDragEnd:', error);
          }
          setCanvasBounds({ ...CANVAS_BOUNDS });
          hideGridLines();
          toggleCanvasUpdater();
        }}
        onDrag={(e) => {
          console.log('onDrag', e);
          // Since onDrag is called multiple times when dragging, hence we are using isDraggingRef to prevent setting state again and again
          if (!isDraggingRef.current) {
            useStore.getState().setDraggingComponentId(e.target.id);
            showGridLines();
            isDraggingRef.current = true;
          }
          const currentWidget = boxList.find((box) => box.id === e.target.id);
          const currentParentId =
            currentWidget?.component?.parent === null ? 'canvas' : currentWidget?.component?.parent;
          const _gridWidth = useGridStore.getState().subContainerWidths[dragParentId] || gridWidth;
          const _dragParentId = newDragParentId.current === null ? 'canvas' : newDragParentId.current;

          // Snap to grid
          let left = Math.round(e.translate[0] / _gridWidth) * _gridWidth;
          let top = Math.round(e.translate[1] / GRID_HEIGHT) * GRID_HEIGHT;

          // This logic is to handle the case when the dragged element is over a new canvas
          if (_dragParentId !== currentParentId) {
            left = e.translate[0];
            top = e.translate[1];
          }

          // Special case for Modal
          const oldParentId = boxList.find((b) => b.id === e.target.id)?.parent;
          const parentId = oldParentId?.length > 36 ? oldParentId.slice(0, 36) : oldParentId;
          const parentComponent = boxList.find((box) => box.id === parentId);
          const parentWidgetType = parentComponent?.component?.component;
          const isOnHeaderOrFooter = oldParentId
            ? oldParentId.includes('-header') || oldParentId.includes('-footer')
            : false;
          const isParentModalSlot = parentWidgetType === 'ModalV2' && isOnHeaderOrFooter;
          const isParentNewModal = parentComponent?.component?.component === 'ModalV2';
          const isParentLegacyModal = parentComponent?.component?.component === 'Modal';
          const isParentModal = isParentNewModal || isParentLegacyModal || isParentModalSlot;

          if (isParentModal) {
            const modalContainer = e.target.closest('.tj-modal-widget-content');
            const mainCanvas = document.getElementById('real-canvas');

            const mainRect = mainCanvas.getBoundingClientRect();
            const modalRect = modalContainer.getBoundingClientRect();
            const relativePosition = {
              top: modalRect.top - mainRect.top,
              right: mainRect.right - modalRect.right + modalContainer.offsetWidth,
              bottom: modalRect.height + (modalRect.top - mainRect.top),
              left: modalRect.left - mainRect.left,
            };
            setCanvasBounds({ ...relativePosition });
          }

          e.target.style.transform = `translate(${left}px, ${top}px)`;
          e.target.setAttribute(
            'widget-pos2',
            `translate: ${e.translate[0]} | Round: ${Math.round(e.translate[0] / gridWidth) * gridWidth} | ${gridWidth}`
          );

          // This block is to show grid lines on the canvas when the dragged element is over a new canvas
          // if (document.elementFromPoint(e.clientX, e.clientY)) {
          //   const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
          //   const draggedOverElements = targetElems.filter(
          //     (ele) =>
          //       (ele.id !== e.target.id && ele.classList.contains('target')) || ele.classList.contains('real-canvas')
          //   );
          //   const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
          //   const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));

          //   // Determine potential new parent
          //   let newParentId = draggedOverContainer?.getAttribute('data-parentId') || draggedOverElem?.id;

          //   if (newParentId === e.target.id) {
          //     newParentId = boxList.find((box) => box.id === e.target.id)?.component?.parent;
          //   } else if (parentComponent?.component?.component === 'Modal') {
          //     // Never update parentId for Modal
          //     newParentId = parentComponent?.id;
          //   }

          //   if (newParentId !== prevDragParentId.current) {
          //     setDragParentId(newParentId === 'canvas' ? null : newParentId);
          //     newDragParentId.current = newParentId === 'canvas' ? null : newParentId;
          //     prevDragParentId.current = newParentId;
          //     handleActivateTargets(newParentId);
          //   }
          // }
          // Postion ghost element exactly as same at dragged element
          if (document.getElementById(`moveable-drag-ghost`)) {
            document.getElementById(`moveable-drag-ghost`).style.transform = `translate(${left}px, ${top}px)`;
            document.getElementById(`moveable-drag-ghost`).style.width = `${e.target.clientWidth}px`;
            document.getElementById(`moveable-drag-ghost`).style.height = `${e.target.clientHeight}px`;
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
            const _gridWidth =
              useGridStore.getState().subContainerWidths?.[currentWidget?.component?.parent] || gridWidth;

            let left = Math.round(ev.translate[0] / _gridWidth) * _gridWidth;
            let top = Math.round(ev.translate[1] / GRID_HEIGHT) * GRID_HEIGHT;

            ev.target.style.transform = `translate(${left}px, ${top}px)`;
          });
          handleActivateTargets(parentElm?.id?.replace('canvas-', ''));
          updateNewPosition(events);
        }}
        onDragGroupStart={({ events }) => {
          showGridLines();
          setIsGroupDragging(true);
          handleActivateNonDraggingComponents();
        }}
        onDragGroupEnd={(e) => {
          handleDragGroupEnd(e);
          handleDeactivateTargets();
          toggleCanvasUpdater();
        }}
        onClickGroup={(e) => {
          const targetId =
            e.inputEvent.target.id || e.inputEvent.target.closest('.moveable-box')?.getAttribute('widgetid');
          if (e.inputEvent.shiftKey && targetId) {
            const currentSelectedComponents = selectedComponents;
            if (currentSelectedComponents.includes(targetId)) {
              // If component is already selected and shift is pressed, unselect it
              const filteredComponents = currentSelectedComponents.filter((id) => id !== targetId);
              setSelectedComponents(filteredComponents);
            } else {
              // If component is not selected and shift is pressed, add it to selection
              setSelectedComponents([...currentSelectedComponents, targetId]);
            }
          }
        }}
        //snap settgins
        snappable={true}
        snapGap={false}
        isDisplaySnapDigit={false}
        snapThreshold={GRID_HEIGHT}
        bounds={canvasBounds}
        // Guidelines configuration
        elementGuidelines={[...elementGuidelines, '.virtual-moveable-target']}
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
          console.log('onSnap', e);
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
