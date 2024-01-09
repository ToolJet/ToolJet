import React, { useEffect, useState, useRef } from 'react';
import Moveable, { makeAble } from 'react-moveable';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import './DragContainer.css';
import DragContainerNested from './DragContainerNested';
import _, { isEmpty } from 'lodash';
import { flushSync } from 'react-dom';
import { restrictedWidgetsObj } from './WidgetManager/restrictedWidgetsConfig';
import { useGridStoreActions, useDragTarget, useNoOfGrid, useGridStore } from '@/_stores/gridStore';
const NO_OF_GRIDS = 43;

const DimensionViewable = {
  name: 'dimensionViewable',
  props: [],
  events: [],
  render(moveable) {
    const rect = moveable.getRect();

    return (
      <div
        className={'multiple-components-config-handle'}
        onMouseEnter={() => {
          useGridStore.getState().actions.setIsGroundHandleHoverd(true);
        }}
        // onMouseUp={() => {
        //   useGridStore.getState().actions.setIsGroundHandleHoverd(false);
        // }}
      >
        <span className="badge handle-content" id="multiple-components-config-handle" style={{ background: '#4d72fa' }}>
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
  },
};

const MouseCustomAble = {
  name: 'mouseTest',
  props: {},
  events: {},
  mouseEnter(e) {
    console.log('MouseCustomAble ENTER', e);
    const controlBoxes = document.getElementsByClassName('.moveable-control-box');
    for (const element of controlBoxes) {
      element.classList.remove('moveable-control-box-d-block');
    }
    e.controlBox.classList.add('moveable-control-box-d-block');
  },
  mouseLeave(e) {
    console.log('MouseCustomAble LEAVE', e);
    e.controlBox.classList.remove('moveable-control-box-d-block');
  },
};

const MouseEnterLeaveAble = makeAble('enterLeave', {
  mouseEnter(moveable) {
    console.log('enterLeave moveable', moveable);
    if (moveable.moveables) {
      // group
      moveable.moveables.forEach((child) => {
        console.log('enterLeave', child);
      });
    } else {
      // single
      // moveable.state.target.style.backgroundColor = '#e55';
    }
  },
  mouseLeave(moveable) {
    console.log('enterLeave moveable leave', moveable);
    if (moveable.moveables) {
      // group
      moveable.moveables.forEach((child) => {
        console.log('enterLeave', child);
      });
    } else {
      // single
      console.log('enterLeave e;se', moveable);
    }
  },
});

export default function DragContainer({
  boxes,
  mode,
  renderWidget,
  canvasWidth,
  onResizeStop,
  onDrag,
  gridWidth,
  selectedComponents = [],
  setIsDragging,
  setIsResizing,
  currentLayout,
  subContainerWidths,
  currentPageId,
  turnOffAutoLayout,
  autoComputeLayout,
  setDraggedSubContainer,
  draggedSubContainer,
}) {
  const [dragTarget, setDragTarget] = useDragTarget();
  const [draggedTarget, setDraggedTarget] = useState();
  const moveableRef = useRef();
  const draggedOverElemRef = useRef(null);
  const childMoveableRefs = useRef({});
  const isDraggingRef = useRef(false);
  const [movableTargets, setMovableTargets] = useState({});
  const [noOfGrids] = useNoOfGrid();
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

  console.log('dragTarget => ', dragTarget);

  const hoveredComponent = useEditorStore((state) => state?.hoveredComponent, shallow);
  const [count, setCount] = useState(0);
  const { setActiveGrid, setResizingComponentId, setDraggingComponentId } = useGridStoreActions();

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

    const selectedComponentsId = new Set(
      selectedComponents.map((component) => {
        console.log('here--- ', component.id, childMoveableRefs.current, childMoveableRefs.current[component.id]);
        return component.id;
      })
    );
    const parentId = selectedComponents.find((comp) => comp.component.parent)?.component?.parent;
    console.log('parentId--', parentId, selectedComponents);

    // Get all elements with the old class name
    var elements = document.getElementsByClassName('selected-component');
    // Iterate through the elements and replace the old class with the new one
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove('selected-component');
    }

    if (parentId) {
      // eslint-disable-next-line no-undef
      const childMoveableRef = childMoveableRefs.current[parentId];
      const controlBoxes = childMoveableRef?.moveable?.getMoveables();
      if (controlBoxes) {
        for (const element of controlBoxes) {
          if (selectedComponentsId.has(element?.props?.target?.id)) {
            element?.controlBox?.classList.add('selected-component');
          }
        }
      }
    } else {
      const controlBoxes = moveableRef?.current?.moveable?.getMoveables();
      if (controlBoxes) {
        for (const element of controlBoxes) {
          if (selectedComponentsId.has(element?.props?.target?.id)) {
            element?.controlBox?.classList.add('selected-component');
          }
        }
        // }
      }
    }
  }, [JSON.stringify(selectedComponents), JSON.stringify(boxes)]);

  useEffect(() => {
    setList(boxList);
    setTimeout(reloadGrid, 100);
  }, [currentLayout]);

  const reloadGrid = async () => {
    setCount((c) => c + 1);
    if (moveableRef.current) {
      moveableRef.current.updateRect();
      moveableRef.current.updateTarget();
      moveableRef.current.updateSelectors();
    }
    for (let refObj of Object.values(childMoveableRefs.current)) {
      if (refObj) {
        refObj.updateRect();
        refObj.updateTarget();
        refObj.updateSelectors();
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
    ...selectedComponents
      .filter((component) => !component?.component?.parent)
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

  console.log('selectedComponents.length--- ', selectedComponents.length);

  return (
    <div className="root">
      <div className="container-fluid rm-container p-0">
        {/* <div className={movableTargets.length == 0 ? `move-target` : ''} style={{ width: '1px' }}></div> */}
        {list
          .filter((i) => isEmpty(i.parent))
          .map((i) => (
            <div
              className={`target widget-target target1 ele-${i.id} moveable-box`}
              data-id={`${i.parent}`}
              key={i.id}
              id={i.id}
              widgetid={i.id}
              style={{
                transform: `translate(332px, -134px)`,
                ...getDimensions(i.id),
                ...(hoveredComponent === i.id ? { zIndex: 2 } : {}),
              }}
            >
              {renderWidget(i.id, undefined, (dragged) => {
                console.log('====> dragged <=====', dragged);
                setDraggedSubContainer(dragged);
              })}
            </div>
          ))}
        {mode === 'edit' && (
          <>
            <Moveable
              dragTargetSelf={true}
              dragTarget={
                useGridStore.getState().isGroundHandleHoverd
                  ? document.getElementById('multiple-components-config-handle')
                  : undefined
              }
              ref={moveableRef}
              ables={[MouseCustomAble, DimensionViewable]}
              props={{
                mouseTest: false,
                dimensionViewable: true,
              }}
              flushSync={flushSync}
              target={
                draggedSubContainer || (groupedTargets.length < 2 && selectedComponents.length > 1)
                  ? '.empty-widget'
                  : groupedTargets.length > 1
                  ? [...groupedTargets]
                  : '.widget-target'
              }
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
                const width = Math.round(e.width / gridWidth) * gridWidth;

                const currentLayout = list.find(({ id }) => id === e.target.id);
                const currentWidth = currentLayout.width * gridWidth;
                const diffWidth = e.width - currentWidth;
                const diffHeight = e.height - currentLayout.height;
                console.log('currentLayout width', currentWidth, e.width, diffWidth, e.direction);
                const isLeftChanged = e.direction[0] === -1;
                const isTopChanged = e.direction[1] === -1;

                console.log(
                  'currentLayout transform',
                  `translate(${currentLayout.left * gridWidth}px, ${currentLayout.top}px)`,
                  `translate(${currentLayout.left * gridWidth - diffWidth}px, ${currentLayout.top}px)`
                );

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
                  setResizingComponentId(null);
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

                  const width = Math.round(e.lastEvent.width / gridWidth) * gridWidth;
                  const height = Math.round(e.lastEvent.height / 10) * 10;

                  const currentLayout = list.find(({ id }) => id === e.target.id);
                  const currentWidth = currentLayout.width * gridWidth;
                  const diffWidth = e.lastEvent.width - currentWidth;
                  const diffHeight = e.lastEvent.height - currentLayout.height;
                  console.log('onResizeEnd data', currentWidth, e.width, diffWidth, e.direction, diffHeight);
                  const isLeftChanged = e.lastEvent.direction[0] === -1;
                  const isTopChanged = e.lastEvent.direction[1] === -1;

                  console.log(
                    'onResizeEnd => currentLayout transform',
                    `translate(${currentLayout.left * gridWidth}px, ${currentLayout.top}px)`,
                    `translate(${currentLayout.left * gridWidth - diffWidth}px, ${currentLayout.top}px)`
                  );

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
                    },
                  ]);
                } catch (error) {
                  console.error('ResizeEnd error ->', error);
                }
              }}
              onResizeStart={(e) => {
                console.log('heree--- onResizeStart');
                setResizingComponentId(e.target.id);
                setIsResizing(true);
                e.setMin([gridWidth, 10]);
                if (currentLayout === 'mobile' && autoComputeLayout) {
                  turnOffAutoLayout();
                  return false;
                }
              }}
              onResizeGroupStart={(e) => {
                console.log('heree--- onResizeGroupStart');
                if (currentLayout === 'mobile' && autoComputeLayout) {
                  turnOffAutoLayout();
                  return false;
                }
              }}
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
              onResizeGroupEnd={({ events }) => console.log('heree--- onResizeGroupEnd')}
              checkInput
              onDragStart={(e) => {
                console.log('On-drag start => ', e?.moveable?.getControlBoxElement());
                if (currentLayout === 'mobile' && autoComputeLayout) {
                  turnOffAutoLayout();
                  return false;
                }
                const box = boxes.find((box) => box.id === e.target.id);
                if (['RangeSlider', 'Container', 'BoundedBox'].includes(box?.component?.component)) {
                  const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
                  const isHandle = targetElems.find((ele) => ele.classList.contains('handle-content'));
                  if (!isHandle) {
                    return false;
                  }
                }
                setDraggedTarget(e.target.id);
              }}
              // linePadding={10}
              onDragEnd={(e) => {
                try {
                  if (isDraggingRef.current) {
                    setDraggingComponentId(null);
                    isDraggingRef.current = false;
                    setIsDragging(false);
                  }
                  setDraggedTarget();
                  if (draggedSubContainer) {
                    return;
                  }

                  let draggedOverElemId;
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
                  }
                  // console.log("draggedOverElemId", draggedOverElemId);
                  const parentElem = list.find(({ id }) => id === draggedOverElemId);
                  let left = e.lastEvent.translate[0];
                  let top = e.lastEvent.translate[1];
                  const currentWidget = boxes.find(({ id }) => id === e.target.id)?.component?.component;
                  const parentWidget = parentElem
                    ? boxes.find(({ id }) => id === parentElem.id)?.component?.component
                    : undefined;
                  const restrictedWidgets = restrictedWidgetsObj?.[parentWidget] || [];
                  const isParentChangeAllowed = !restrictedWidgets.includes(currentWidget);
                  if (draggedOverElemId && isParentChangeAllowed) {
                    let { left: _left, top: _top } = getMouseDistanceFromParentDiv(e, draggedOverElemId);
                    left = _left;
                    top = _top;
                  } else {
                    e.target.style.transform = `translate(${Math.round(left / gridWidth) * gridWidth}px, ${
                      Math.round(top / 10) * 10
                    }px)`;
                  }

                  onDrag([
                    {
                      id: e.target.id,
                      x: left,
                      y: Math.round(top / 10) * 10,
                      parent: isParentChangeAllowed ? draggedOverElemId : undefined,
                    },
                  ]);
                } catch (error) {
                  console.log('error', error);
                }
                setDragTarget(null);
              }}
              onDrag={(e) => {
                if (!isDraggingRef.current) {
                  setDraggingComponentId(e.target.id);
                  isDraggingRef.current = true;
                  setIsDragging(true);
                }
                if (draggedSubContainer) {
                  return;
                }
                setDraggedTarget(e.target.id);
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
                      ele.id !== e.target.id &&
                      (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
                  );
                  const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
                  const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));
                  // const draggedOverElem = targetElems.find(
                  //   (ele) => ele.id !== e.target.id && ele.classList.contains('target')
                  // );
                  if (dragTarget !== draggedOverElem?.id) {
                    setDragTarget(draggedOverElem?.id);
                  }
                  console.log('draggedOverElem =>', draggedOverElem?.id, dragTarget);
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
                // onDrag(
                //   events.map((ev) => ({
                //     id: ev.target.id,
                //     x: ev.translate[0],
                //     y: ev.translate[1],
                //   }))
                // );
              }}
              onDragGroupStart={() => {
                if (currentLayout === 'mobile' && autoComputeLayout) {
                  turnOffAutoLayout();
                  return false;
                }
              }}
              onDragGroupEnd={(e) => {
                const { events } = e;
                useGridStore.getState().actions.setIsGroundHandleHoverd(false);
                onDrag(
                  events.map((ev) => ({
                    id: ev.target.id,
                    x: ev.lastEvent.translate[0],
                    y: ev.lastEvent.translate[1],
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

            {removeDuplicates(list)
              .filter((i) => !isEmpty(i.parent))
              .map((i) => {
                let groupedTargets1 = [
                  ...selectedComponents
                    .filter((component) => {
                      const comp = list.find((l) => l.id === component.id);
                      comp?.component?.parent === i.parent;
                    })
                    .map((component) => '.ele-' + component.id),
                ];
                groupedTargets1 = [...new Set(groupedTargets1)];
                console.log(
                  'groupedTargets-->target ' + i.parent,
                  selectedComponents,
                  groupedTargets1.length ? groupedTargets1 : `.target-${i.parent}`
                );

                return (
                  <Moveable
                    dragTargetSelf={true}
                    dragTarget={document.getElementById('multiple-components-config-handle')}
                    flushSync={flushSync}
                    key={i.parent}
                    ref={(el) => (childMoveableRefs.current[i.parent] = el)}
                    ables={[DimensionViewable]}
                    props={{
                      mouseTest: true,
                      dimensionViewable: selectedComponents.length > 2,
                    }}
                    target={groupedTargets1.length ? groupedTargets1 : `.target-${i.parent}`}
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
                      if (currentLayout === 'mobile' && autoComputeLayout) {
                        turnOffAutoLayout();
                        return false;
                      }
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
                        setDraggingComponentId(e.target.id);
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
                          setDragTarget(draggedOverElemId ? draggedOverElemId : 'canvas');
                        }
                      }
                    }}
                    onDragEnd={(e) => {
                      if (isDraggingRef.current) {
                        setDraggingComponentId(null);
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
                        ? Math.round(left / subContainerWidths[draggedOverElemId]) *
                          subContainerWidths[draggedOverElemId]
                        : Math.round(left / gridWidth) * gridWidth;
                      onDrag([
                        {
                          id: e.target.id,
                          x: _x,
                          y: Math.round(top / 10) * 10,
                          parent: draggedOverElemId,
                        },
                      ]);
                      setDragTarget(null);
                    }}
                    onDragGroup={({ events }) => {
                      events.forEach((ev) => {
                        console.log('Grouped data=>', ev);
                        ev.target.style.transform = ev.transform;
                      });
                    }}
                    onResizeStart={(e) => {
                      setResizingComponentId(e.target.id);
                      setActiveGrid(i.parent);
                      e.setMin([gridWidth, 10]);
                      if (currentLayout === 'mobile' && autoComputeLayout) {
                        turnOffAutoLayout();
                        return false;
                      }
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
                      setResizingComponentId(null);
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
                    onDragGroupStart={() => {
                      if (currentLayout === 'mobile' && autoComputeLayout) {
                        turnOffAutoLayout();
                        return false;
                      }
                    }}
                    onResizeGroupStart={(e) => {
                      if (currentLayout === 'mobile' && autoComputeLayout) {
                        turnOffAutoLayout();
                        return false;
                      }
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
              })}
          </>
        )}
      </div>
    </div>
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
