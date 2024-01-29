import React, { useEffect, useState, useRef } from 'react';
import Moveable, { makeAble } from 'react-moveable';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import './DragContainer.css';
import _, { isEmpty, debounce } from 'lodash';
import { flushSync } from 'react-dom';
import { restrictedWidgetsObj } from './WidgetManager/restrictedWidgetsConfig';
import { useGridStore } from '@/_stores/gridStore';

export default function DragContainer({
  widgets,
  mode,
  onResizeStop,
  onDrag,
  gridWidth,
  selectedComponents = [],
  setIsDragging,
  setIsResizing,
  currentLayout,
  subContainerWidths,
  draggedSubContainer,
}) {
  console.log('Irenderrrr');
  const lastDraggedEventsRef = useRef(null);
  const boxes = Object.keys(widgets).map((key) => ({ ...widgets[key], id: key }));
  console.log('boxes===>', boxes);
  const configHandleForMultiple = (id) => {
    return (
      <div
        className={'multiple-components-config-handle'}
        onMouseUpCapture={() => {
          if (lastDraggedEventsRef.current) {
            const preant = boxes.find((box) => (box.id = lastDraggedEventsRef.current?.events?.[0]?.target?.id))
              ?.component?.parent;
            onDrag(
              lastDraggedEventsRef.current.events.map((ev) => ({
                id: ev.target.id,
                x: ev.translate[0],
                y: ev.translate[1],
                parent: preant,
              }))
            );
          }
          if (useGridStore.getState().isGroundHandleHoverd) {
            useGridStore.getState().actions.setIsGroundHandleHoverd(false);
          }
        }}
        onMouseDownCapture={() => {
          lastDraggedEventsRef.current = null;
          if (!useGridStore.getState().isGroundHandleHoverd) {
            useGridStore.getState().actions.setIsGroundHandleHoverd(true);
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

  const DimensionViewableForSub = {
    name: 'dimensionViewableForSub',
    props: [],
    events: [],
    render() {
      return configHandleForMultiple('multiple-components-config-handle-sub');
    },
  };

  const MouseCustomAble = {
    name: 'mouseTest',
    props: {},
    events: {},
    mouseEnter(e) {
      const controlBoxes = document.getElementsByClassName('moveable-control-box');
      console.log('MouseCustomAble ENTER', e);
      for (const element of controlBoxes) {
        element.classList.remove('moveable-control-box-d-block');
      }
      e.props.target.classList.add('hovered');
      e.controlBox.classList.add('moveable-control-box-d-block');
    },
    mouseLeave(e) {
      console.log('MouseCustomAble LEAVE', e);
      e.props.target.classList.remove('hovered');
      e.controlBox.classList.remove('moveable-control-box-d-block');
    },
  };

  // const [dragTarget, useGridStore.getState().actions.setDragTarget] = useDragTarget();
  const [draggedTarget, setDraggedTarget] = useState();
  const moveableRef = useRef();
  const draggedOverElemRef = useRef(null);
  const childMoveableRefs = useRef({});
  const isDraggingRef = useRef(false);
  const [movableTargets, setMovableTargets] = useState({});
  const noOfGrids = 43;
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

  // console.log('dragTarget => ', dragTarget);
  // const { setSelectedComponents } = useEditorActions();

  const hoveredComponent = useEditorStore((state) => state?.hoveredComponent, shallow);

  useEffect(() => {
    if (!moveableRef.current) {
      return;
    }
    console.log('Reloading....');
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
  }, [JSON.stringify(selectedComponents), JSON.stringify(boxes)]);
  // }, [JSON.stringify(selectedComponents), JSON.stringify(boxes), hoveredComponent]);

  useEffect(() => {
    setList(boxList);
    setTimeout(reloadGrid, 100);
  }, [currentLayout]);

  const reloadGrid = async () => {
    if (moveableRef.current) {
      moveableRef.current.updateRect();
      moveableRef.current.updateTarget();
      moveableRef.current.updateSelectors();
    }
    for (let refObj of Object.values(childMoveableRefs.current)) {
      if (refObj) {
        console.log('refObj -->', refObj);
        refObj.updateRect();
        refObj.updateTarget();
        refObj.updateSelectors();
      }
    }

    const selectedComponentsId = new Set(
      selectedComponents.map((component) => {
        return component.id;
      })
    );
    const selectedBoxs = boxes.filter((box) => selectedComponentsId.has(box.id));
    const parentId = selectedBoxs.find((comp) => comp.component.parent)?.component?.parent;

    // Get all elements with the old class name
    var elements = document.getElementsByClassName('selected-component');
    // Iterate through the elements and replace the old class with the new one
    for (var i = 0; i < elements.length; i++) {
      elements[i].className = 'moveable-control-box modal-moveable rCS1w3zcxh';
    }
    if (parentId) {
      // eslint-disable-next-line no-undef
      const childMoveableRef = childMoveableRefs.current[parentId];
      const controlBoxes = childMoveableRef?.moveable?.getMoveables();
      if (controlBoxes) {
        for (const element of controlBoxes) {
          if (selectedComponentsId.has(element?.props?.target?.id)) {
            element?.controlBox?.classList.add('selected-component', `sc-${element?.props?.target?.id}`);
          }
        }
      }
    } else {
      const controlBoxes = moveableRef?.current?.moveable?.getMoveables();
      if (controlBoxes) {
        for (const element of controlBoxes) {
          if (selectedComponentsId.has(element?.props?.target?.id)) {
            element?.controlBox?.classList.add('selected-component', `sc-${element?.props?.target?.id}`);
          }
        }
        // }
      }
    }
  };

  window.reloadGrid = reloadGrid;

  useEffect(() => {
    setList(boxList);
  }, [JSON.stringify(boxes)]);

  useEffect(() => {
    const groupedTargets = [...selectedComponents.map((component) => '.ele-' + component.id)];
    const newMovableTargets = groupedTargets.length ? [...groupedTargets] : [];
    if (hoveredComponent && groupedTargets?.length <= 1 && !groupedTargets.includes('.ele-' + hoveredComponent)) {
      newMovableTargets.push('.ele-' + hoveredComponent);
    }

    if (draggedTarget && !newMovableTargets.includes(`.ele-${draggedTarget}`)) {
      newMovableTargets.push('.ele-' + draggedTarget);
    }

    setMovableTargets(draggedSubContainer ? [] : draggedTarget ? ['.ele-' + draggedTarget] : newMovableTargets);
  }, [selectedComponents, hoveredComponent, draggedTarget, draggedSubContainer]);

  useEffect(() => {
    reloadGrid();
  }, [movableTargets]);

  const getDimensions = (id) => {
    const box = boxes.find((b) => b.id === id);
    const layoutData = box?.layouts?.[currentLayout];
    if (isEmpty(layoutData)) {
      return {};
    }
    // const width = (canvasWidth * layoutData.width) / NO_OF_GRIDS;
    const width = gridWidth * layoutData.width;

    return {
      width: width + 'px',
      height: layoutData.height + 'px',
      transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    };
  };

  console.log('selectedComponents =>', [...selectedComponents]);

  const groupedTargets = [
    ...findHighestLevelofSelection(selectedComponents)
      // .filter((component) => !component?.component?.parent)
      .map((component) => '.ele-' + component.id),
  ];

  console.log('groupedTargets-->', selectedComponents, groupedTargets);
  console.log(
    'groupedTargets-->target',
    draggedSubContainer || (groupedTargets.length < 2 && selectedComponents.length > 1)
      ? '.empty-widget'
      : groupedTargets.length > 1
      ? [...groupedTargets]
      : '.widget-target'
  );

  // Function to limit the resizing of element within the parent
  const setResizingLimit = (e, i) => {
    const elemLayout = widgets[e.target.id]?.layouts[currentLayout];
    const parentLayout = widgets[i.parent]?.layouts[currentLayout];
    let maxWidth = null,
      maxHeight = null,
      parentgW = subContainerWidths[i.parent] || gridWidth,
      elemSize = 0;

    const [leftRight, topBottom] = e.direction;
    if (leftRight === 0) {
      if (topBottom === -1) {
        //Resize with top handle
        elemSize = elemLayout?.top + elemLayout?.height;
      } else {
        //Resize with top handle
        const parentHeight = document.getElementById(`canvas-${i.parent}`)?.offsetHeight ?? parentLayout?.height;
        elemSize = parentHeight - elemLayout?.top;
      }
      maxHeight = elemSize;
    } else {
      if (leftRight === -1) {
        //Resize with left handle
        elemSize = (noOfGrids - (elemLayout?.left + elemLayout?.width)) * parentgW;
      } else {
        //Resize with right handle
        elemSize = elemLayout?.left * parentgW;
      }
      maxWidth = noOfGrids * parentgW - elemSize;
    }

    e.setMax([maxWidth, maxHeight]);
    e.setMin([gridWidth, 10]);
  };

  const updateNewPosition = (events, parent = null) => {
    const posWithParent = {
      events,
      parent,
    };
    lastDraggedEventsRef.current = posWithParent;
  };

  const debouncedOnDrag = debounce((events, parent = null) => updateNewPosition(events, parent), 100);

  console.log('hoveredComponent->' + hoveredComponent + '    draggedTarget->' + draggedTarget);
  console.log('onDrager----hoveredComponent', hoveredComponent);

  return mode === 'edit' ? (
    <>
      <Moveable
        dragTargetSelf={true}
        dragTarget={
          useGridStore.getState().isGroundHandleHoverd
            ? document.getElementById('multiple-components-config-handle')
            : undefined
          // `.widget-${hoveredComponent}`
        }
        ref={moveableRef}
        ables={[MouseCustomAble, DimensionViewable]}
        props={{
          mouseTest: selectedComponents.length < 2,
          dimensionViewable: selectedComponents.length > 1,
        }}
        flushSync={flushSync}
        // target={groupedTargets?.[0] ? groupedTargets?.[0] : `.ele-${draggedTarget ? draggedTarget : hoveredComponent}`}
        target={groupedTargets?.length > 1 ? groupedTargets : '.target'}
        origin={false}
        individualGroupable={selectedComponents.length <= 1}
        draggable={true}
        resizable={{
          edge: ['e', 'w', 'n', 's'],
          renderDirections: ['e', 'w', 'n', 's'],
        }}
        keepRatio={false}
        key={list.length}
        individualGroupableProps={(element) => {
          if (element?.classList.contains('target2')) {
            return {
              resizable: false,
            };
          }
        }}
        onResize={(e) => {
          console.log('onResize', e);
          console.log('onResize---', list, e.target.id, boxList);
          const currentLayout = list.find(({ id }) => id === e.target.id);
          const currentWidget = boxes.find(({ id }) => id === e.target.id);
          console.log('onResize---currentLayout', currentLayout);
          let _gridWidth = subContainerWidths[currentWidget.component?.parent] || gridWidth;
          const currentWidth = currentLayout.width * _gridWidth;
          const diffWidth = e.width - currentWidth;
          const diffHeight = e.height - currentLayout.height;
          console.log('onResize---currentLayout', currentWidth, e.width, diffWidth, e.direction);
          const isLeftChanged = e.direction[0] === -1;
          const isTopChanged = e.direction[1] === -1;

          console.log(
            'currentLayout transform',
            `translate(${currentLayout.left * _gridWidth}px, ${currentLayout.top}px)`,
            `translate(${currentLayout.left * _gridWidth - diffWidth}px, ${currentLayout.top}px)`
          );

          e.target.style.width = `${e.width}px`;
          e.target.style.height = `${e.height}px`;
          let transformX = currentLayout.left * _gridWidth;
          let transformY = currentLayout.top;
          console.log(
            'onResize---isLeftChanged',
            isLeftChanged,
            e.direction[0],
            currentLayout.left * _gridWidth - diffWidth
          );
          if (isLeftChanged) {
            transformX = currentLayout.left * _gridWidth - diffWidth;
          }
          if (isTopChanged) {
            transformY = currentLayout.top - diffHeight;
          }
          e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;

          // e.target.style.transform = e.drag.transform;
          // onResizeStop([
          //   {
          //     id: e.target.id,
          //     height: e.height,
          //     width: width,
          //     x: e.drag.translate[0],
          //     y: e.drag.translate[1],
          //   },
          // ]);
        }}
        onResizeEnd={(e) => {
          try {
            useGridStore.getState().actions.setResizingComponentId(null);
            setIsResizing(false);
            console.log('onResizeEnd>>>>>>>>>>>>>>', e);
            // const width = Math.round(e.lastEvent.width / gridWidth) * gridWidth;
            // e.target.style.width = `${width}px`;
            // e.target.style.height = `${e.lastEvent.height}px`;
            // e.target.style.transform = e.lastEvent.drag.transform;
            // onResizeStop([
            //   {
            //     id: e.target.id,
            //     height: e.lastEvent.height,
            //     width: width,
            //     x: e.lastEvent.drag.translate[0],
            //     y: e.lastEvent.drag.translate[1],
            //   },
            // ]);
            const currentWidget = boxes.find(({ id }) => {
              console.log('e.target.id', id, e, e.target.id);
              return id === e.target.id;
            });
            let _gridWidth = subContainerWidths[currentWidget.component?.parent] || gridWidth;
            const width = Math.round(e.lastEvent.width / _gridWidth) * _gridWidth;
            const height = Math.round(e.lastEvent.height / 10) * 10;

            const currentLayout = list.find(({ id }) => id === e.target.id);
            const currentWidth = currentLayout.width * _gridWidth;
            const diffWidth = e.lastEvent.width - currentWidth;
            const diffHeight = e.lastEvent.height - currentLayout.height;
            console.log('onResizeEnd data', currentWidth, e.width, diffWidth, e.direction, diffHeight);
            const isLeftChanged = e.lastEvent.direction[0] === -1;
            const isTopChanged = e.lastEvent.direction[1] === -1;

            console.log(
              'onResizeEnd => currentLayout transform',
              `translate(${currentLayout.left * _gridWidth}px, ${currentLayout.top}px)`,
              `translate(${currentLayout.left * _gridWidth - diffWidth}px, ${currentLayout.top}px)`
            );

            console.log('onResizeEnd---', {
              cleft: currentLayout.left,
              newLeft: currentLayout.left * _gridWidth,
              _gridWidth,
              currTransform: e.target.style.transform,
            });
            let transformX = currentLayout.left * _gridWidth;
            let transformY = currentLayout.top;
            if (isLeftChanged) {
              transformX = currentLayout.left * _gridWidth - diffWidth;
            }
            if (isTopChanged) {
              transformY = currentLayout.top - diffHeight;
            }

            // e.target.style.transform = e.drag.transform;
            e.target.style.width = `${width}px`;
            e.target.style.height = `${height}px`;
            e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
            console.log('onResizeEnd---Newtransform', `translate(${transformX}px, ${transformY}px)`);
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
            console.log('onResizeEnd---resizeData', resizeData);
            onResizeStop([resizeData]);
          } catch (error) {
            console.error('ResizeEnd error ->', error);
          }
        }}
        onResizeStart={(e) => {
          console.log('heree--- onResizeStart');
          useGridStore.getState().actions.setResizingComponentId(e.target.id);
          setIsResizing(true);
          e.setMin([gridWidth, 10]);
          // if (currentLayout === 'mobile' && autoComputeLayout) {
          //   turnOffAutoLayout();
          //   return false;
          // }
        }}
        // onResizeGroupStart={(e) => {
        //   console.log('heree--- onResizeGroupStart');
        //   if (currentLayout === 'mobile' && autoComputeLayout) {
        //     turnOffAutoLayout();
        //     return false;
        //   }
        // }}
        onResizeGroup={({ events }) => {
          console.log('heree--- onResizeGroup');
          const newBoxs = [];
          events.forEach((ev) => {
            ev.target.style.width = `${ev.width}px`;
            ev.target.style.height = `${ev.height}px`;
            ev.target.style.transform = ev.drag.transform;
            newBoxs.push({
              id: ev.target.id,
              height: ev.height,
              width: ev.width,
              x: ev.drag.translate[0],
              y: ev.drag.translate[1],
            });
          });
          onResizeStop(newBoxs);
        }}
        onResizeGroupEnd={({ events }) => console.log('here--- onResizeGroupEnd')}
        checkInput
        onDragStart={(e) => {
          console.log('On-drag start => ', e?.moveable?.getControlBoxElement());
          // if (currentLayout === 'mobile' && autoComputeLayout) {
          //   turnOffAutoLayout();
          //   return false;
          // }
          const box = boxes.find((box) => box.id === e.target.id);
          if (['RangeSlider', 'Container', 'BoundedBox'].includes(box?.component?.component)) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const isHandle = targetElems.find((ele) => ele.classList.contains('handle-content'));
            if (!isHandle) {
              return false;
            }
          }
          if (hoveredComponent !== e.target.id) {
            return false;
          }
          setDraggedTarget(e.target.id);
        }}
        // linePadding={10}
        onDragEnd={(e) => {
          const startTime = performance.now();
          try {
            if (isDraggingRef.current) {
              console.log('timeDifference0', performance.now() - startTime);
              useGridStore.getState().actions.setDraggingComponentId(null);
              console.log('timeDifference1.1', performance.now() - startTime);
              isDraggingRef.current = false;
              setIsDragging(false);
              console.log('timeDifference1.2', performance.now() - startTime);
            }
            console.log('timeDifference1', performance.now() - startTime);

            setDraggedTarget();
            if (draggedSubContainer) {
              return;
            }

            let draggedOverElemId;
            console.log('timeDifference2', performance.now() - startTime);
            if (document.elementFromPoint(e.clientX, e.clientY)) {
              const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
              const draggedOverElem = targetElems.find((ele) => {
                const isOwnChild = e.target.contains(ele); // if the hovered element is a child of actual draged element its not considered
                if (isOwnChild) return false;

                let isDroppable =
                  ele.id !== e.target.id &&
                  // ele.classList.contains('target') ||
                  (ele.classList.contains('nested-target') || ele.classList.contains('drag-container-parent'));
                if (isDroppable) {
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
            }
            console.log('timeDifference3', performance.now() - startTime);
            // console.log("draggedOverElemId", draggedOverElemId);

            console.log('draggedOverElemId->', draggedOverElemId);

            const parentElem = list.find(({ id }) => id === draggedOverElemId);
            const currentParentId = boxes.find(({ id: widgetId }) => e.target.id === widgetId)?.component?.parent;
            let left = e.lastEvent.translate[0];
            let top = e.lastEvent.translate[1];
            const currentWidget = boxes.find(({ id }) => id === e.target.id)?.component?.component;
            const parentWidget = parentElem
              ? boxes.find(({ id }) => id === parentElem.id)?.component?.component
              : undefined;
            const restrictedWidgets = restrictedWidgetsObj?.[parentWidget] || [];
            const isParentChangeAllowed = !restrictedWidgets.includes(currentWidget);
            if (draggedOverElemId !== currentParentId && isParentChangeAllowed) {
              let { left: _left, top: _top } = getMouseDistanceFromParentDiv(e, draggedOverElemId);
              left = _left;
              top = _top;
            } else {
              e.target.style.transform = `translate(${Math.round(left / gridWidth) * gridWidth}px, ${
                Math.round(top / 10) * 10
              }px)`;
            }
            console.log('timeDifference4', performance.now() - startTime);

            console.log('draggedOverElemId->', draggedOverElemId, currentParentId);
            onDrag([
              {
                id: e.target.id,
                x: left,
                y: Math.round(top / 10) * 10,
                parent: isParentChangeAllowed ? draggedOverElemId : undefined,
              },
            ]);
            const box = boxes.find((box) => box.id === e.target.id);
            console.log('timeDifference5', performance.now() - startTime);
            useEditorStore.getState().actions.setSelectedComponents([{ ...box }]);
            console.log('timeDifference6', performance.now() - startTime);
          } catch (error) {
            console.log('draggedOverElemId->error', error);
          }
          useGridStore.getState().actions.setDragTarget(null);
        }}
        onDrag={(e) => {
          console.log('onDrager----', e.target.id, hoveredComponent);
          if (!isDraggingRef.current) {
            useGridStore.getState().actions.setDraggingComponentId(e.target.id);
            isDraggingRef.current = true;
            setIsDragging(true);
          }
          if (draggedSubContainer) {
            return;
          }
          setDraggedTarget(e.target.id);
          // setDraggedTarget(e.target.id);
          if (!draggedSubContainer) {
            e.target.style.transform = `translate(${e.translate[0]}px, ${e.translate[1]}px)`;
            e.target.setAttribute(
              'widget-pos2',
              `translate: ${e.translate[0]} | Round: ${
                Math.round(e.translate[0] / gridWidth) * gridWidth
              } | ${gridWidth}`
            );
          }

          let draggedOverElemId;
          if (document.elementFromPoint(e.clientX, e.clientY)) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const draggedOverElements = targetElems.filter(
              (ele) =>
                ele.id !== e.target.id && (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
            );
            const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
            const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));
            // const draggedOverElem = targetElems.find(
            //   (ele) => ele.id !== e.target.id && ele.classList.contains('target')
            // );
            if (useGridStore.getState().dragTarget !== draggedOverElem?.id) {
              useGridStore.getState().actions.setDragTarget(draggedOverElem?.id);
            }
            // console.log('draggedOverElem =>', draggedOverElem?.id, dragTarget);
            draggedOverElemId = draggedOverElem?.id;
            if (
              draggedOverElemRef.current?.id !== draggedOverContainer?.id &&
              !draggedOverContainer.classList.contains('hide-grid')
            ) {
              draggedOverContainer.classList.add('show-grid');
              draggedOverElemRef.current && draggedOverElemRef.current.classList.remove('show-grid');
              draggedOverElemRef.current = draggedOverContainer;
            }
          }
          console.log('draggedOverElemId parent', draggedOverElemId, parent);
        }}
        onDragGroup={({ events }) => {
          events.forEach((ev) => {
            ev.target.style.transform = ev.transform;
          });
          debouncedOnDrag(events);
        }}
        // onDragGroupStart={() => {
        //   // if (currentLayout === 'mobile' && autoComputeLayout) {
        //   //   turnOffAutoLayout();
        //   //   return false;
        //   // }
        // }}
        onDragGroupEnd={(e) => {
          const { events } = e;
          const parentId = boxes.find((box) => (box.id = events[0]?.target?.id))?.component?.parent;
          onDrag(
            events.map((ev) => ({
              id: ev.target.id,
              x: ev.lastEvent.translate[0],
              y: ev.lastEvent.translate[1],
              parent: parentId,
            }))
          );
        }}
        //snap settgins
        snappable={true}
        snapDirections={{
          top: true,
          left: true,
          bottom: true,
          right: true,
          center: true,
          middle: true,
        }}
        elementSnapDirections={{
          top: true,
          left: true,
          bottom: true,
          right: true,
          center: true,
          middle: true,
        }}
        snapThreshold={5}
        elementGuidelines={list.map((l) => ({ element: `.ele-${l.id}`, className: 'grid-guide-lines' }))}
        isDisplaySnapDigit={false}
        // snapGridWidth={gridWidth}
        bounds={{ left: 0, top: 0, right: 0, bottom: 0, position: 'css' }}
      />
      {/* {removeDuplicates(list)
        .filter((i) => !isEmpty(i.parent))
        .map((i) => {
          let groupedTargets1 = [
            ...selectedComponents
              .filter((component) => {
                if (
                  component?.component?.parent === i.parent &&
                  !selectedComponents.some((comp) => comp.id === component?.component?.parent)
                ) {
                  console.log('selected===>' + i.parent, {
                    i: component?.id,
                    c: component?.component?.component,
                    sp: component?.component?.parent,
                    parent: i.parent,
                    selectedComponents: selectedComponents.map((c) => ({
                      i: c?.id,
                      c: c?.component?.component,
                    })),
                    r:
                      component?.component?.parent === i.parent &&
                      !selectedComponents.some((comp) => comp.id === component?.component?.parent),
                  });
                }
                return (
                  component?.component?.parent === i.parent &&
                  !selectedComponents.some((comp) => comp.id === component?.component?.parent)
                );
              })
              .map((component) => '.ele-' + component.id),
          ];
          groupedTargets1 = [...new Set(groupedTargets1)];
          console.log(
            'groupedTargets-->target ' + i.parent,
            selectedComponents,
            groupedTargets1.length ? groupedTargets1 : `.target-${i.parent}`
          );

          console.log('slects-2', i);

          return (
            <Moveable
              dragTargetSelf={true}
              dragTarget={
                useGridStore.getState().isGroundHandleHoverd
                  ? document.getElementById('multiple-components-config-handle-sub')
                  : undefined
              }
              flushSync={flushSync}
              key={i.parent}
              ref={(el) => (childMoveableRefs.current[i.parent] = el)}
              ables={[MouseCustomAble, DimensionViewableForSub]}
              props={{
                mouseTest: selectedComponents.length < 2,
                dimensionViewableForSub: selectedComponents.length > 1,
              }}
              target={
                // groupedTargets.length
                //   ? '.empty-widget'
                //   : groupedTargets1.length
                //   ? groupedTargets1
                //   : `.target-${i.parent}`
                groupedTargets1.length > 1 ? groupedTargets1 : `.target-${i.parent}`
              }
              draggable={true}
              resizable={{
                edge: ['e', 'w', 'n', 's'],
                renderDirections: ['e', 'w', 'n', 's'],
              }}
              // stopPropagation={true}
              origin={false}
              // individualGroupable={true}
              individualGroupable={groupedTargets1.length <= 1}
              onDragStart={(e) => {
                console.log('On-Drag start', e);
                // if (currentLayout === 'mobile' && autoComputeLayout) {
                //   turnOffAutoLayout();
                //   return false;
                // }
                const box = boxes.find((box) => box.id === e.target.id);
                if (['RangeSlider', 'Container', 'BoundedBox'].includes(box?.component?.component)) {
                  const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
                  const isHandle = targetElems.find((ele) => ele.classList.contains('handle-content'));
                  if (!isHandle) {
                    console.log('eeeeeeee', e.inputEvent);
                    // e.inputEvent.stopPropagation();
                    return false;
                  }
                }
              }}
              onDrag={(e) => {
                if (!isDraggingRef.current) {
                  setDraggingComponentId.getState().actions.setDraggingComponentId(e.target.id);
                  isDraggingRef.current = true;
                  setDraggedSubContainer(draggedSubContainer ? draggedSubContainer : i.parent);
                }
                console.log('Ondrag subcontainer', draggedSubContainer);
                if (draggedSubContainer === i.parent) {
                  e.target.style.transform = e.transform;
                }
                let draggedOverElemId = i.parent;
                if (document.elementFromPoint(e.clientX, e.clientY)) {
                  const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
                  const draggedOverElem = targetElems.find((ele) => {
                    const isOwnChild = e.target.contains(ele); // if the hovered element is a child of actual draged element its not considered
                    if (isOwnChild) return false;
                    return (
                      ele.id !== e.target.id &&
                      (ele.classList.contains('target') ||
                        ele.classList.contains('nested-target') ||
                        ele.classList.contains('drag-container-parent'))
                    );
                  });
                  draggedOverElemId = draggedOverElem?.getAttribute('component-id') || draggedOverElem?.id;
                  if (dragTarget !== draggedOverElemId) {
                    useGridStore.getState().actions.setDragTarget(draggedOverElemId ? draggedOverElemId : 'canvas');
                  }
                }
              }}
              onDragEnd={(e) => {
                if (isDraggingRef.current) {
                  setDraggingComponentId.getState().actions.setDraggingComponentId(null);
                  isDraggingRef.current = false;
                }
                if (draggedSubContainer !== i.parent) {
                  setDraggedSubContainer(false);
                  return;
                }
                setDraggedSubContainer(false);
                const { lastEvent, clientX, clientY } = e;
                if (!lastEvent) {
                  return;
                }
                let {
                  translate: [left, top],
                  width,
                } = lastEvent;

                if (top < 0) {
                  top = 0;
                }

                let draggedOverElemId = i.parent;
                const parentComponent = boxes.find((box) => box.id === i.parent);
                const parentComponentType = parentComponent?.component?.component;

                if (document.elementFromPoint(e.clientX, e.clientY) && parentComponentType !== 'Modal') {
                  const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
                  const draggedOverElem = targetElems.find((ele) => {
                    const isOwnChild = e.target.contains(ele); // if the hovered element is a child of actual draged element its not considered
                    if (isOwnChild) return false;
                    return (
                      ele.id !== e.target.id &&
                      (ele.classList.contains('target') ||
                        ele.classList.contains('nested-target') ||
                        ele.classList.contains('drag-container-parent'))
                    );
                  });
                  draggedOverElemId = draggedOverElem?.getAttribute('component-id') || draggedOverElem?.id;
                  console.log('draggedOverElem', draggedOverElem, draggedOverElemId);
                  if (draggedOverElemId && !subContainerWidths[draggedOverElemId]) {
                    draggedOverElemId = i.parent;
                  }
                  if (draggedOverElemId !== i.parent) {
                    const newParentElem = list[draggedOverElemId]?.layouts?.desktop;
                    let { left: _left, top: _top } = getMouseDistanceFromParentDiv(e, draggedOverElemId);
                    left = _left;
                    top = _top;
                  }
                }

                let _left = Math.round(left / subContainerWidths[draggedSubContainer]);
                let _width = Math.round(width / subContainerWidths[draggedSubContainer]);
                if (_width + _left > noOfGrids && draggedOverElemId === i.parent) {
                  _left = _left - (_width + _left - noOfGrids);
                  if (_left < 0) {
                    _left = 0;
                    _width = noOfGrids;
                  }
                  e.target.style.transform = `translate(${_left * subContainerWidths[i.parent]}px, ${
                    Math.round(top / 10) * 10
                  }px)`;
                } else if (_left < 0 && draggedOverElemId === i.parent) {
                  _left = 0;
                  if (_width > noOfGrids) {
                    _width = noOfGrids;
                  }
                  e.target.style.transform = `translate(${_left * subContainerWidths[i.parent]}px, ${
                    Math.round(top / 10) * 10
                  }px)`;
                } else {
                  e.target.style.transform = `translate(${
                    Math.round(left / subContainerWidths[i.parent]) * subContainerWidths[i.parent]
                  }px, ${Math.round(top / 10) * 10}px)`;
                }

                const _x = draggedOverElemId
                  ? Math.round(left / subContainerWidths[draggedOverElemId]) * subContainerWidths[draggedOverElemId]
                  : Math.round(left / gridWidth) * gridWidth;
                onDrag([
                  {
                    id: e.target.id,
                    x: _x,
                    y: Math.round(top / 10) * 10,
                    parent: draggedOverElemId,
                  },
                ]);
                const box = boxes.find((box) => box.id === e.target.id);
                useEditorStore.getState().actions.setSelectedComponents([{ ...box }]);
                useGridStore.getState().actions.setDragTarget(null);
              }}
              onDragGroup={({ events }) => {
                events.forEach((ev) => {
                  console.log('Grouped data=>', ev);
                  ev.target.style.transform = ev.transform;
                });
                debouncedOnDrag(events, i.parent);
              }}
              onResizeStart={(e) => {
                setDraggingComponentId.getState().actions.setResizingComponentId(e.target.id);
                setActiveGrid(i.parent);
                setResizingLimit(e, i);
                // if (currentLayout === 'mobile' && autoComputeLayout) {
                //   turnOffAutoLayout();
                //   return false;
                // }
              }}
              onResize={(e) => {
                const gridWidth = subContainerWidths[i.parent];
                const width = Math.round(e.width / gridWidth) * gridWidth;

                const currentLayout = list.find(({ id }) => id === e.target.id);
                const currentWidth = currentLayout.width * gridWidth;
                const diffWidth = e.width - currentWidth;
                const diffHeight = e.height - currentLayout.height;
                const isLeftChanged = e.direction[0] === -1;
                const isTopChanged = e.direction[1] === -1;

                e.target.style.width = `${e.width}px`;
                e.target.style.height = `${e.height}px`;
                let transformX = currentLayout.left * gridWidth;
                let transformY = currentLayout.top;
                if (isLeftChanged) {
                  transformX = currentLayout.left * gridWidth - diffWidth;
                }
                if (isTopChanged) {
                  transformY = currentLayout.top - diffHeight;
                }
                e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
              }}
              onResizeEnd={(e) => {
                setDraggingComponentId.getState().actions.setResizingComponentId(null);
                setActiveGrid(null);
                try {
                  const gridWidth = subContainerWidths[i.parent];

                  const width = Math.round(e.lastEvent.width / gridWidth) * gridWidth;
                  const height = Math.round(e.lastEvent.height / 10) * 10;

                  const currentLayout = list.find(({ id }) => id === e.target.id);
                  const currentWidth = currentLayout.width * gridWidth;
                  const diffWidth = e.lastEvent.width - currentWidth;
                  const diffHeight = e.lastEvent.height - currentLayout.height;
                  const isLeftChanged = e.lastEvent.direction[0] === -1;
                  const isTopChanged = e.lastEvent.direction[1] === -1;

                  let transformX = currentLayout.left * gridWidth;
                  let transformY = currentLayout.top;
                  if (isLeftChanged) {
                    transformX = currentLayout.left * gridWidth - diffWidth;
                  }
                  if (isTopChanged) {
                    transformY = currentLayout.top - diffHeight;
                  }

                  // e.target.style.transform = e.drag.transform;
                  e.target.style.width = `${width}px`;
                  e.target.style.height = `${height}px`;
                  e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
                  onResizeStop([
                    {
                      id: e.target.id,
                      height: height,
                      width: width,
                      x: transformX,
                      y: transformY,
                      gw: gridWidth,
                    },
                  ]);
                } catch (error) {
                  console.error('ResizeEnd error ->', error);
                }
              }}
              // onDragGroupStart={() => {
              //   if (currentLayout === 'mobile' && autoComputeLayout) {
              //     turnOffAutoLayout();
              //     return false;
              //   }
              // }}
              onDragGroupEnd={(e) => {
                debouncedOnDrag.cancel();
                const { events } = e;
                onDrag(
                  events.map((ev) => ({
                    id: ev.target.id,
                    x: ev.lastEvent.translate[0],
                    y: ev.lastEvent.translate[1],
                    parent: i.parent,
                  }))
                );
              }}
              onResizeGroupStart={(e) => {
                // if (currentLayout === 'mobile' && autoComputeLayout) {
                //   turnOffAutoLayout();
                //   return false;
                // }
              }}
              displayAroundControls={true}
              controlPadding={10}
              snappable={true}
              // snapDirections={{ top: true, left: true, bottom: true, right: true }}
              snapDirections={{
                top: true,
                left: true,
                bottom: true,
                right: true,
                center: true,
                middle: true,
              }}
              elementSnapDirections={{
                top: true,
                left: true,
                bottom: true,
                right: true,
                center: true,
                middle: true,
              }}
              snapThreshold={5}
              // passing checkInput param breaks
              // checkInput={true}
              {...(draggedSubContainer === i.parent ? {} : { checkInput: true })}
              // dragArea={false}
              elementGuidelines={list
                .filter((l) => l.parent === i.parent)
                .map((l) => ({ element: `.ele-${l.id}`, className: 'grid-guide-lines' }))}
              isDisplaySnapDigit={false}
              snapGridWidth={subContainerWidths[i.parent]}
            />
          );
        })} */}
    </>
  ) : (
    ''
  );
}

function getMouseDistanceFromParentDiv(event, id) {
  // Get the parent div element.
  const parentDiv = id ? document.getElementById(id) : document.getElementsByClassName('real-canvas')[0];

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

function removeDuplicates(arr) {
  const unique = arr
    .map((e) => e['parent'])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter((e) => arr[e])
    .map((e) => arr[e]);

  // debugger;
  return unique;
}

function extractWidgetClassOnHover(element) {
  var classes = element.className.split(' ');

  // Filter out the classes that match the format 'widget-{id}'
  var widgetClass = classes.find(function (c) {
    return c.startsWith('widget-');
  });

  return widgetClass.replace('widget-', '');
}

function findHighestLevelofSelection(selectedComponents) {
  const result = selectedComponents.filter(
    (widget) =>
      widget?.component?.parent !== undefined && !selectedComponents.some((e) => e.id === widget?.component?.parent)
  );
  console.log('groupedTargets-->result------', result, selectedComponents);
  return result;
}
