// import '@/Editor/wdyr';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Moveable from 'react-moveable';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import './DragContainer.css';
import _, { isEmpty } from 'lodash';
import { flushSync } from 'react-dom';
import { restrictedWidgetsObj } from './WidgetManager/restrictedWidgetsConfig';
import { useGridStore, useIsGroupHandleHoverd, useOpenModalWidgetId } from '@/_stores/gridStore';
import toast from 'react-hot-toast';
import { individualGroupableProps } from './gridUtils';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

const CANVAS_BOUNDS = { left: 0, top: 0, right: 0, bottom: 0, position: 'css' };
const RESIZABLE_CONFIG = {
  edge: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
  renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
};

export default function DragContainer({
  widgets,
  mode,
  onResizeStop,
  onDrag,
  gridWidth,
  selectedComponents = [],
  currentLayout,
  draggedSubContainer,
}) {
  const lastDraggedEventsRef = useRef(null);
  const boxes = Object.keys(widgets).map((key) => ({ ...widgets[key], id: key }));
  const isGroupHandleHoverd = useIsGroupHandleHoverd();
  const openModalWidgetId = useOpenModalWidgetId();
  const configHandleForMultiple = (id) => {
    return (
      <div
        className={'multiple-components-config-handle'}
        onMouseUpCapture={() => {
          if (lastDraggedEventsRef.current) {
            const preant = boxes.find((box) => box.id == lastDraggedEventsRef.current.events[0].target.id)?.component
              ?.parent;
            // Adding the new updates to the macro task queue to unblock UI

            onDrag(
              lastDraggedEventsRef.current.events.map((ev) => ({
                id: ev.target.id,
                x: ev.translate[0],
                y: ev.translate[1],
                parent: preant,
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

  const DimensionViewable = {
    name: 'dimensionViewable',
    props: [],
    events: [],
    render() {
      return configHandleForMultiple('multiple-components-config-handle');
    },
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

  const moveableRef = useRef();
  const draggedOverElemRef = useRef(null);
  const childMoveableRefs = useRef({});
  const groupResizeDataRef = useRef([]);
  const isDraggingRef = useRef(false);
  const boxList = boxes
    .filter((box) =>
      ['{{true}}', true].includes(
        box?.component?.definition?.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value
      )
    )
    .map((box) => ({
      id: box.id,
      height: box?.layouts?.[currentLayout]?.height,
      left: box?.layouts?.[currentLayout]?.left,
      top: box?.layouts?.[currentLayout]?.top,
      width: box?.layouts?.[currentLayout]?.width,
      parent: box?.component?.parent,
    }));
  const [list, setList] = useState(boxList);

  const hoveredComponent = useEditorStore((state) => state?.hoveredComponent, shallow);

  useEffect(() => {
    if (!moveableRef.current) {
      return;
    }
    moveableRef.current.updateRect();
    moveableRef.current.updateTarget();
    moveableRef.current.updateSelectors();
    for (let refObj of Object.values(childMoveableRefs.current)) {
      if (refObj) {
        refObj.updateRect();
        refObj.updateTarget();
        refObj.updateSelectors();
      }
    }
    setTimeout(reloadGrid, 100);

    try {
      const boxes = document.querySelectorAll('.jet-container');
      var timer;
      boxes.forEach((box) => {
        box.addEventListener('scroll', function handleClick() {
          if (timer) {
            clearTimeout(timer);
          }

          timer = setTimeout(function () {
            reloadGrid();
          }, 250); //Threshold is 100ms
        });
      });
    } catch (error) {
      console.error('Error---->', error);
    }
  }, [hoveredComponent, reloadGrid]);

  useEffect(() => {
    setList(boxList);
    setTimeout(reloadGrid, 100);
  }, [currentLayout]);

  useEffect(() => {
    const controlBoxes = document.querySelectorAll('.moveable-control-box[target-id]');
    controlBoxes.forEach((box) => {
      box.style.display = '';
    });
    if (openModalWidgetId) {
      const children = findChildrenAndGrandchildren(openModalWidgetId, boxes);
      const controlBoxes = document.querySelectorAll('.moveable-control-box[target-id]');
      controlBoxes.forEach((box) => {
        const id = box.getAttribute('target-id');
        if (!children.includes(id)) {
          box.style.display = 'none';
        }
      });
    }
  }, [openModalWidgetId, selectedComponents]);

  const reloadGrid = useCallback(async () => {
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
      selectedComponents.map((component) => {
        return component.id;
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
  }, [selectedComponents]);

  useEffect(() => {
    setList(boxList);
  }, [JSON.stringify(boxes)]);

  const groupedTargets = [
    ...findHighestLevelofSelection(selectedComponents).map((component) => '.ele-' + component.id),
  ];

  useEffect(() => {
    reloadGrid();
  }, [selectedComponents, openModalWidgetId, widgets]);

  const updateNewPosition = (events, parent = null) => {
    const posWithParent = {
      events,
      parent,
    };
    lastDraggedEventsRef.current = posWithParent;
  };

  const widgetsWithDefinitions = Object.entries(boxes).map(([id, box]) => {
    const propertiesDefinition = box?.component?.definition?.properties || {};
    const stylesDefinition = box?.component?.definition?.styles || {};
    return {
      id,
      propertiesDefinition,
      stylesDefinition,
      ...box,
    };
  });

  const isComponentVisible = (id) => {
    for (const key in widgetsWithDefinitions) {
      if (widgetsWithDefinitions[key].id === id) {
        const visibility =
          widgetsWithDefinitions[key].propertiesDefinition?.visibility?.value ??
          widgetsWithDefinitions[key].stylesDefinition?.visibility?.value ??
          null;
        return resolveWidgetFieldValue(visibility);
      }
    }
    return true;
  };

  return mode === 'edit' ? (
    <>
      <Moveable
        dragTargetSelf={true}
        dragTarget={isGroupHandleHoverd ? document.getElementById('multiple-components-config-handle') : undefined}
        ref={moveableRef}
        ables={[MouseCustomAble, DimensionViewable]}
        props={{
          mouseTest: groupedTargets.length < 2,
          dimensionViewable: groupedTargets.length > 1,
        }}
        flushSync={flushSync}
        target={groupedTargets?.length > 1 ? groupedTargets : '.target'}
        origin={false}
        individualGroupable={groupedTargets.length <= 1}
        draggable={true}
        resizable={RESIZABLE_CONFIG}
        keepRatio={false}
        // key={list.length}
        individualGroupableProps={individualGroupableProps}
        onResize={(e) => {
          const currentLayout = list.find(({ id }) => id === e.target.id);
          const currentWidget = boxes.find(({ id }) => id === e.target.id);
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
            const currentWidget = boxes.find(({ id }) => {
              return id === e.target.id;
            });
            document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.remove('show-grid');
            let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
            let width = Math.round(e.lastEvent.width / _gridWidth) * _gridWidth;
            const height = Math.round(e.lastEvent.height / 10) * 10;

            const currentLayout = list.find(({ id }) => id === e.target.id);
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
            onResizeStop([resizeData]);
          } catch (error) {
            console.error('ResizeEnd error ->', error);
          }
          useGridStore.getState().actions.setDragTarget();
        }}
        onResizeStart={(e) => {
          if (!isComponentVisible(e.target.id)) {
            return false;
          }
          performance.mark('onResizeStart');
          useGridStore.getState().actions.setResizingComponentId(e.target.id);
          e.setMin([gridWidth, 10]);
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
              const currentWidget = boxes.find(({ id }) => {
                return id === ev.target.id;
              });
              let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
              let width = Math.round(ev.width / _gridWidth) * _gridWidth;
              width = width < _gridWidth ? _gridWidth : width;
              let posX = Math.round(ev.drag.translate[0] / _gridWidth) * _gridWidth;
              let posY = Math.round(ev.drag.translate[1] / 10) * 10;
              let height = Math.round(ev.height / 10) * 10;
              height = height < 10 ? 10 : height;

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
              // Adding the new updates to the macro task queue to unblock UI
              // setTimeout(() => {
              // });
              onResizeStop(newBoxs);
            } else {
              events.forEach((ev) => {
                const currentWidget = boxes.find(({ id }) => {
                  return id === ev.target.id;
                });
                let _gridWidth =
                  useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
                let width = currentWidget?.layouts[currentLayout].width * _gridWidth;
                let posX = currentWidget?.layouts[currentLayout].left * _gridWidth;
                let posY = currentWidget?.layouts[currentLayout].top;
                let height = currentWidget?.layouts[currentLayout].height;
                height = height < 10 ? 10 : height;
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
        }}
        checkInput
        onDragStart={(e) => {
          e?.moveable?.controlBox?.removeAttribute('data-off-screen');
          const box = boxes.find((box) => box.id === e.target.id);
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
                  let widgetType = boxes.find(({ id }) => id === widgetId)?.component?.component;
                  if (!widgetType) {
                    widgetId = widgetId.split('-').slice(0, -1).join('-');
                    widgetType = boxes.find(({ id }) => id === widgetId)?.component?.component;
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
            const currentParentId = boxes.find(({ id: widgetId }) => e.target.id === widgetId)?.component?.parent;
            let left = e.lastEvent.translate[0];
            let top = e.lastEvent.translate[1];

            if (['Listview', 'Kanban'].includes(widgets[draggedOverElemId]?.component?.component)) {
              const elemContainer = e.target.closest('.real-canvas');
              const containerHeight = elemContainer.clientHeight;
              const maxY = containerHeight - e.target.clientHeight;
              top = top > maxY ? maxY : top;
            }

            const currentWidget = boxes.find(({ id }) => id === e.target.id)?.component?.component;
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
                const currBox = list.find((l) => l.id === e.target.id);
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
              // Adding the new updates to the macro task queue to unblock UI
              //   setTimeout(() =>
              // );
              onDrag([
                {
                  id: e.target.id,
                  x: left,
                  y: Math.round(top / 10) * 10,
                  parent: isParentChangeAllowed ? draggedOverElemId : undefined,
                },
              ]);
            }
            const box = boxes.find((box) => box.id === e.target.id);
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
        onDragGroup={(ev) => {
          const { events } = ev;
          const parentElm = events[0]?.target?.closest('.real-canvas');
          if (parentElm && !parentElm.classList.contains('show-grid')) {
            parentElm?.classList?.add('show-grid');
          }

          events.forEach((ev) => {
            let posX = ev.translate[0];
            let posY = ev.translate[1];

            ev.target.style.transform = `translate(${posX}px, ${posY}px)`;
          });
          updateNewPosition(events);
        }}
        onDragGroupStart={({ events }) => {
          const parentElm = events[0]?.target?.closest('.real-canvas');
          parentElm?.classList?.add('show-grid');
        }}
        onDragGroupEnd={(e) => {
          try {
            const { events } = e;
            const parentId = widgets[events[0]?.target?.id]?.component?.parent;

            const parentElm = events[0].target.closest('.real-canvas');
            parentElm.classList.remove('show-grid');

            const parentWidth = parentElm?.clientWidth;
            const parentHeight = parentElm?.clientHeight;

            const { posRight, posLeft, posTop, posBottom } = getPositionForGroupDrag(events, parentWidth, parentHeight);
            const _gridWidth = useGridStore.getState().subContainerWidths[parentId] || gridWidth;

            onDrag(
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
                  Math.round(posY / 10) * 10
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
        }}
        //snap settgins
        snappable={true}
        snapThreshold={10}
        isDisplaySnapDigit={false}
        bounds={CANVAS_BOUNDS}
        displayAroundControls={true}
        controlPadding={20}
      />
    </>
  ) : (
    ''
  );
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

export function findHighestLevelofSelection(selectedComponents) {
  let result = [...selectedComponents];
  if (selectedComponents.some((widget) => !widget?.component?.parent)) {
    result = selectedComponents.filter((widget) => !widget?.component?.parent);
  } else {
    result = selectedComponents.filter(
      (widget) => widget?.component?.parent === selectedComponents[0]?.component?.parent
    );
  }
  return result;
}

function findChildrenAndGrandchildren(parentId, widgets) {
  if (isEmpty(widgets)) {
    return [];
  }
  const children = widgets.filter((widget) => widget?.component?.parent?.startsWith(parentId));
  let result = [];
  for (const child of children) {
    result.push(child.id);
    result = result.concat(...findChildrenAndGrandchildren(child.id, widgets));
  }
  return result;
}

function adjustWidth(width, posX, gridWidth) {
  posX = Math.round(posX / gridWidth);
  width = Math.round(width / gridWidth);
  if (posX + width > 43) {
    width = 43 - posX;
  }
  return width * gridWidth;
}

function getPositionForGroupDrag(events, parentWidth, parentHeight) {
  return events.reduce((positions, ev) => {
    const eventObj = ev.lastEvent ? ev.lastEvent : ev;
    const { width, height } = eventObj;

    const {
      translate: [elemPosX, elemPosY],
    } = eventObj.drag ? eventObj.drag : eventObj;

    return {
      ...positions,
      posRight: Math.min(
        positions.posRight ?? Infinity, // Handle potential initial undefined value
        parentWidth - (width + elemPosX)
      ),
      posBottom: Math.min(positions.posBottom ?? Infinity, parentHeight - (height + elemPosY)),
      posLeft: Math.min(positions.posLeft ?? Infinity, elemPosX),
      posTop: Math.min(positions.posTop ?? Infinity, elemPosY),
    };
  }, {});
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
