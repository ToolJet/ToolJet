import React, { useEffect, useState, useRef } from 'react';
import Moveable, { makeAble } from 'react-moveable';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import './DragContainer.css';
import _, { isEmpty, debounce } from 'lodash';
import { flushSync } from 'react-dom';
import { restrictedWidgetsObj } from './WidgetManager/restrictedWidgetsConfig';
import { useGridStore, useIsGroupHandleHoverd, useOpenModalWidgetId } from '@/_stores/gridStore';
import toast from 'react-hot-toast';

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
  const lastDraggedEventsRef = useRef(null);
  const boxes = Object.keys(widgets).map((key) => ({ ...widgets[key], id: key }));
  console.log('boxes===>', boxes);
  const isGroupHandleHoverd = useIsGroupHandleHoverd();
  const openModalWidgetId = useOpenModalWidgetId();
  console.log('openModalWidgetId--->', openModalWidgetId);
  const configHandleForMultiple = (id) => {
    return (
      <div
        className={'multiple-components-config-handle'}
        onMouseUpCapture={() => {
          if (lastDraggedEventsRef.current) {
            const preant = boxes.find((box) => box.id == lastDraggedEventsRef.current.events[0].target.id)?.component
              ?.parent;
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
          console.log('components>>>onMouseDownCapture');
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
      console.log('MouseCustomAble ENTER', e._dragTarget);
      for (const element of controlBoxes) {
        element.classList.remove('moveable-control-box-d-block');
      }
      e.props.target.classList.add('hovered');
      e.controlBox.classList.add('moveable-control-box-d-block');
    },
    mouseLeave(e) {
      console.log('MouseCustomAble LEAVE', e._dragTarget);
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

    try {
      // for (let key in widgets) {
      //   const box = widgets[key];
      //   const boxEle = document.getElementById(key);
      //   console.log('boxEle->', boxEle, box);
      //   if (boxEle) {
      //     boxEle.addEventListener('scrollend', (event) => {
      //       alert('Scrolled..');
      //     });
      //   }
      // }

      const boxes = document.querySelectorAll('.jet-container');
      var timer;
      boxes.forEach((box) => {
        box.addEventListener('scroll', function handleClick(event) {
          console.log('timer---->', timer);
          if (timer) {
            clearTimeout(timer);
          }

          console.log('timer---->Setting up the timer', timer);
          timer = setTimeout(function () {
            console.log('timer----> triggered');
            reloadGrid();
          }, 250); //Threshold is 100ms
        });
      });
    } catch (error) {
      console.error('Error---->', error);
    }
  }, [JSON.stringify(selectedComponents), JSON.stringify(boxes), hoveredComponent]);
  // }, [JSON.stringify(selectedComponents), JSON.stringify(boxes), hoveredComponent]);

  useEffect(() => {
    setList(boxList);
    setTimeout(reloadGrid, 100);
  }, [currentLayout]);

  useEffect(() => {
    const controlBoxes = document.querySelectorAll('.moveable-control-box[target-id]');
    controlBoxes.forEach((box) => {
      box.style.display = '';
    });
    console.log('openModalWidgetId', openModalWidgetId, selectedComponents);
    if (openModalWidgetId) {
      const children = findChildrenAndGrandchildren(openModalWidgetId, boxes);
      const controlBoxes = document.querySelectorAll('.moveable-control-box[target-id]');
      const childElems = children.map((childId) => ({ ...widgets[childId], id: childId }));
      console.log(childElems);
      console.log('controlBoxes', controlBoxes, children);
      controlBoxes.forEach((box) => {
        const id = box.getAttribute('target-id');
        if (!children.includes(id)) {
          box.style.display = 'none';
        }
      });
    }
  }, [openModalWidgetId, selectedComponents]);

  const reloadGrid = async () => {
    if (moveableRef.current) {
      moveableRef.current.updateRect();
      moveableRef.current.updateTarget();
      moveableRef.current.updateSelectors();
    }
    console.log('moveableRef-->', moveableRef.current?.moveable?.moveables);
    Array.isArray(moveableRef.current?.moveable?.moveables) &&
      moveableRef.current?.moveable?.moveables.forEach((moveable) => {
        const {
          props: { target },
          controlBox,
        } = moveable;
        console.log('moveableRef--> 2', target, controlBox);
        controlBox.setAttribute('target-id', target.id);
      });

    const selectedComponentsId = new Set(
      selectedComponents.map((component) => {
        return component.id;
      })
    );
    console.log('selectedComponentsId->', selectedComponentsId);
    const selectedBoxs = boxes.filter((box) => selectedComponentsId.has(box.id));
    console.log('selectedComponentsId->selectedBoxs', selectedBoxs);
    const parentId = selectedBoxs.find((comp) => comp.component.parent)?.component?.parent;

    // Get all elements with the old class name
    var elements = document.getElementsByClassName('selected-component');
    // Iterate through the elements and replace the old class with the new one
    for (var i = 0; i < elements.length; i++) {
      elements[i].className = 'moveable-control-box modal-moveable rCS1w3zcxh';
    }
    // if (parentId) {
    //   // eslint-disable-next-line no-undef
    //   const childMoveableRef = childMoveableRefs.current[parentId];
    //   const controlBoxes = childMoveableRef?.moveable?.getMoveables();
    //   if (controlBoxes) {
    //     for (const element of controlBoxes) {
    //       if (selectedComponentsId.has(element?.props?.target?.id)) {
    //         element?.controlBox?.classList.add('selected-component', `sc-${element?.props?.target?.id}`);
    //       }
    //     }
    //   }
    // } else {
    //   const controlBoxes = moveableRef?.current?.moveable?.getMoveables();
    //   if (controlBoxes) {
    //     for (const element of controlBoxes) {
    //       if (selectedComponentsId.has(element?.props?.target?.id)) {
    //         element?.controlBox?.classList.add('selected-component', `sc-${element?.props?.target?.id}`);
    //       }
    //     }
    //     // }
    //   }
    const controlBoxes = moveableRef?.current?.moveable?.getMoveables();
    if (controlBoxes) {
      for (const element of controlBoxes) {
        if (selectedComponentsId.has(element?.props?.target?.id)) {
          element?.controlBox?.classList.add('selected-component', `sc-${element?.props?.target?.id}`);
        }
      }
    }
  };

  window.reloadGrid = reloadGrid;

  useEffect(() => {
    setList(boxList);
  }, [JSON.stringify(boxes)]);

  // useEffect(() => {
  //   const groupedTargets = [...selectedComponents.map((component) => '.ele-' + component.id)];
  //   const newMovableTargets = groupedTargets.length ? [...groupedTargets] : [];
  //   if (hoveredComponent && groupedTargets?.length <= 1 && !groupedTargets.includes('.ele-' + hoveredComponent)) {
  //     newMovableTargets.push('.ele-' + hoveredComponent);
  //   }

  //   if (draggedTarget && !newMovableTargets.includes(`.ele-${draggedTarget}`)) {
  //     newMovableTargets.push('.ele-' + draggedTarget);
  //   }

  //   setMovableTargets(draggedSubContainer ? [] : draggedTarget ? ['.ele-' + draggedTarget] : newMovableTargets);
  // }, [selectedComponents, draggedTarget, draggedSubContainer]);

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

  useEffect(() => {
    reloadGrid();
  }, [selectedComponents, openModalWidgetId]);

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
          isGroupHandleHoverd ? document.getElementById('multiple-components-config-handle') : undefined
          // `.widget-${hoveredComponent}`
        }
        ref={moveableRef}
        ables={[MouseCustomAble, DimensionViewable]}
        props={{
          mouseTest: groupedTargets.length < 2,
          dimensionViewable: groupedTargets.length > 1,
        }}
        flushSync={flushSync}
        // target={groupedTargets?.[0] ? groupedTargets?.[0] : `.ele-${draggedTarget ? draggedTarget : hoveredComponent}`}
        target={
          // groupedTargets?.length > 1 ? groupedTargets : groupedTargets?.length === 1 ? groupedTargets[0] : '.target'
          groupedTargets?.length > 1 ? groupedTargets : '.target'
        }
        origin={false}
        individualGroupable={groupedTargets.length <= 1}
        draggable={true}
        resizable={{
          edge: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
          renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
          // edge: ['e', 'w', 'n', 's'],
          // renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
        }}
        keepRatio={false}
        // key={list.length}
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
          document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.add('show-grid');
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

          const elemContainer = e.target.closest('.real-canvas');
          const containerHeight = elemContainer.clientHeight;
          const containerWidth = elemContainer.clientWidth;
          const maxY = containerHeight - e.target.clientHeight;
          const maxLeft = containerWidth - e.target.clientWidth;
          const maxWidthHit = transformX < 0 || transformX >= maxLeft;
          const maxHeightHit = transformY < 0 || transformY >= maxY;
          transformY = transformY < 0 ? 0 : transformY > maxY ? maxY : transformY;
          transformX = transformX < 0 ? 0 : transformX > maxLeft ? maxLeft : transformX;
          console.log('e.target.style.transform', `translate(${transformX}px, ${transformY}px)`);

          if (!maxWidthHit || e.width < e.target.clientWidth) {
            e.target.style.width = `${e.width}px`;
          }
          if (!maxHeightHit || e.height < e.target.clientHeight) {
            e.target.style.height = `${e.height}px`;
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
            document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.remove('show-grid');
            let _gridWidth = subContainerWidths[currentWidget.component?.parent] || gridWidth;
            let width = Math.round(e.lastEvent.width / _gridWidth) * _gridWidth;
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
            width = adjustWidth(width, transformX, _gridWidth);
            // e.target.style.width = `${width}px`;
            // e.target.style.height = `${height}px`;
            const elemContainer = e.target.closest('.real-canvas');
            const containerHeight = elemContainer.clientHeight;
            const containerWidth = elemContainer.clientWidth;
            const maxY = containerHeight - e.target.clientHeight;
            const maxLeft = containerWidth - e.target.clientWidth;
            const maxWidthHit = transformX < 0 || transformX >= maxLeft;
            const maxHeightHit = transformY < 0 || transformY >= maxY;
            transformY = transformY < 0 ? 0 : transformY > maxY ? maxY : transformY;
            transformX = transformX < 0 ? 0 : transformX > maxLeft ? maxLeft : transformX;

            e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
            if (!maxWidthHit || e.width < e.target.clientWidth) {
              e.target.style.width = `${Math.round(e.lastEvent.width / _gridWidth) * _gridWidth}px`;
            }
            if (!maxHeightHit || e.height < e.target.clientHeight) {
              e.target.style.height = `${Math.round(e.lastEvent.height / 10) * 10}px`;
            }
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
        onResizeGroupStart={({ events }) => {
          const parentElm = events[0].target.closest('.real-canvas');
          parentElm.classList.add('show-grid');
        }}
        onResizeGroup={({ events }) => {
          console.log('heree--- onResizeGroup');
          const newBoxs = [];
          events.forEach((ev) => {
            ev.target.style.width = `${ev.width}px`;
            ev.target.style.height = `${ev.height}px`;
            ev.target.style.transform = ev.drag.transform;
            // newBoxs.push({
            //   id: ev.target.id,
            //   height: ev.height,
            //   width: ev.width,
            //   x: ev.drag.translate[0],
            //   y: ev.drag.translate[1],
            // });
          });
          // onResizeStop(newBoxs);
        }}
        onResizeGroupEnd={({ events }) => {
          try {
            console.log('onResizeGroup---', events);
            const newBoxs = [];

            const parentElm = events[0].target.closest('.real-canvas');
            parentElm.classList.remove('show-grid');

            events.forEach((ev) => {
              console.log('resizeevents', events);
              const currentWidget = boxes.find(({ id }) => {
                return id === ev.target.id;
              });
              let _gridWidth = subContainerWidths[currentWidget.component?.parent] || gridWidth;
              let width = Math.round(ev.lastEvent.width / _gridWidth) * _gridWidth;
              width = width < _gridWidth ? _gridWidth : width;
              let posX = Math.round(ev.lastEvent.drag.translate[0] / _gridWidth) * _gridWidth;
              let posY = Math.round(ev.lastEvent.drag.translate[1] / 10) * 10;
              let height = Math.round(ev.lastEvent.height / 10) * 10;
              height = height < 10 ? 10 : height;

              ev.target.style.width = `${width}px`;
              ev.target.style.height = `${height}px`;
              // ev.target.style.transform = ev.lastEvent.drag.transform;
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
            onResizeStop(newBoxs);
          } catch (error) {
            console.error('Error resizing group', error);
          }
        }}
        checkInput
        onDragStart={(e) => {
          console.log('On-drag start => ', e?.moveable?.getControlBoxElement());
          // if (currentLayout === 'mobile' && autoComputeLayout) {
          //   turnOffAutoLayout();
          //   return false;
          // }
          const box = boxes.find((box) => box.id === e.target.id);
          if (['RangeSlider', 'Container', 'BoundedBox', 'Kanban'].includes(box?.component?.component)) {
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

            console.log('timeDifference2', performance.now() - startTime);
            let draggedOverElemId = widgets[e.target.id]?.component?.parent;
            let draggedOverElemIdType;
            const parentComponent = widgets[widgets[e.target.id]?.component?.parent];
            let draggedOverElem;
            if (document.elementFromPoint(e.clientX, e.clientY) && parentComponent?.component?.component !== 'Modal') {
              const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
              draggedOverElem = targetElems.find((ele) => {
                const isOwnChild = e.target.contains(ele); // if the hovered element is a child of actual draged element its not considered
                if (isOwnChild) return false;

                let isDroppable =
                  ele.id !== e.target.id &&
                  // ele.classList.contains('target') ||
                  // (ele.classList.contains('nested-target') || ele.classList.contains('drag-container-parent'));
                  ele.classList.contains('drag-container-parent');
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
            // console.log("draggedOverElemId", draggedOverElemId);

            const _gridWidth = subContainerWidths[draggedOverElemId] || gridWidth;
            const parentElem = list.find(({ id }) => id === draggedOverElemId);
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
                  draggedOverWidget?.component?.component === 'Kanban' ? draggedOverElem : draggedOverElemId
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
            } else {
              // const elemContainer = e.target.closest('.real-canvas');
              // const containerHeight = elemContainer.clientHeight;
              // const containerWidth = elemContainer.clientWidth;
              // const maxY = containerHeight - e.target.clientHeight;
              // const maxLeft = containerWidth - e.target.clientWidth;
              // top = top < 0 ? 0 : top > maxY ? maxY : top;
              // left = left < 0 ? 0 : left > maxLeft ? maxLeft : left;
              // e.target.style.transform = `translate(${Math.round(left / _gridWidth) * _gridWidth}px, ${
              //   Math.round(top / 10) * 10
              // }px)`;

              e.target.style.transform = `translate(${Math.round(left / _gridWidth) * _gridWidth}px, ${
                Math.round(top / 10) * 10
              }px)`;
            }

            console.log('timeDifference4', performance.now() - startTime);

            console.log('draggedOverElemId->', draggedOverElemId, currentParentId);
            if (draggedOverElemId === currentParentId || isParentChangeAllowed) {
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
            console.log('timeDifference5', performance.now() - startTime);
            useEditorStore.getState().actions.setSelectedComponents([{ ...box }]);
            console.log('timeDifference6', performance.now() - startTime);
          } catch (error) {
            console.log('draggedOverElemId->error', error);
          }
          // runAsync(() => useGridStore.getState().actions.setDragTarget(null));
          var canvasElms = document.getElementsByClassName('sub-canvas');
          var elementsArray = Array.from(canvasElms);
          elementsArray.forEach(function (element) {
            element.classList.remove('show-grid');
            element.classList.add('hide-grid');
          });
        }}
        onDrag={(e) => {
          const startTime = performance.now();
          console.log('onDrager----', e.target.id, hoveredComponent);
          if (!isDraggingRef.current) {
            console.log('timeDiff->1', performance.now() - startTime);
            useGridStore.getState().actions.setDraggingComponentId(e.target.id);
            console.log('timeDiff->2', performance.now() - startTime);
            isDraggingRef.current = true;
            setIsDragging(true);
            console.log('timeDiff->3', performance.now() - startTime);
          }
          if (draggedSubContainer) {
            return;
          }
          if (e.target.id !== draggedTarget) {
            console.log('timeDiff->4', performance.now() - startTime);
            setDraggedTarget(e.target.id);
            console.log('timeDiff->5', performance.now() - startTime);
          }
          // setDraggedTarget(e.target.id);
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

          let draggedOverElemId;
          if (document.elementFromPoint(e.clientX, e.clientY)) {
            const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            const draggedOverElements = targetElems.filter(
              (ele) =>
                ele.id !== e.target.id && (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
            );
            const draggedOverElem = draggedOverElements.find((ele) => ele.classList.contains('target'));
            const draggedOverContainer = draggedOverElements.find((ele) => ele.classList.contains('real-canvas'));

            // if (useGridStore.getState().dragTarget !== draggedOverElem?.id) {
            //   runAsync(() => useGridStore.getState().actions.setDragTarget(draggedOverElem?.id));
            // }
            var canvasElms = document.getElementsByClassName('sub-canvas');
            var elementsArray = Array.from(canvasElms);
            elementsArray.forEach(function (element) {
              element.classList.remove('show-grid');
              element.classList.add('hide-grid');
            });
            const parentWidgetId = draggedOverContainer.getAttribute('data-parent') || draggedOverElem?.id;
            console.log('parentWidgetId-->', draggedOverContainer, parentWidgetId);
            document.getElementById('canvas-' + parentWidgetId)?.classList.add('show-grid');

            draggedOverElemId = draggedOverElem?.id;
            console.log(
              'draggedOverElemRef=>',
              draggedOverContainer,
              draggedOverElemRef.current?.id !== draggedOverContainer?.id,
              !draggedOverContainer.classList.contains('hide-grid')
            );
            if (
              draggedOverElemRef.current?.id !== draggedOverContainer?.id &&
              !draggedOverContainer.classList.contains('hide-grid')
            ) {
              draggedOverContainer.classList.add('show-grid');
              draggedOverElemRef.current && draggedOverElemRef.current.classList.remove('show-grid');
              draggedOverElemRef.current = draggedOverContainer;
            }
          }
          console.log('timeDiff->6', performance.now() - startTime);
          console.log('draggedOverElemId parent', draggedOverElemId, parent);
        }}
        onDragGroup={({ events }) => {
          events.forEach((ev) => {
            ev.target.style.transform = ev.transform;
          });
          debouncedOnDrag(events);
        }}
        onDragGroupStart={({ events }) => {
          const parentElm = events[0]?.target?.closest('.real-canvas');
          parentElm?.classList?.add('show-grid');
        }}
        onDragGroupEnd={(e) => {
          try {
            const { events } = e;
            const parentId = widgets[events[0]?.target?.id]?.component?.parent;
            // setIsDragging(false);

            const parentElm = events[0].target.closest('.real-canvas');
            parentElm.classList.remove('show-grid');

            onDrag(
              events.map((ev) => ({
                id: ev.target.id,
                x: ev.lastEvent.translate[0],
                y: ev.lastEvent.translate[1],
                parent: parentId,
              }))
            );
          } catch (error) {
            console.error('Error dragging group', error);
          }
        }}
        //snap settgins
        snappable={true}
        // snapDirections={{
        //   top: true,
        //   left: true,
        //   bottom: true,
        //   right: true,
        //   center: true,
        //   middle: true,
        // }}
        // elementSnapDirections={{
        //   top: true,
        //   left: true,
        //   bottom: true,
        //   right: true,
        //   center: true,
        //   middle: true,
        // }}
        snapThreshold={10}
        // elementGuidelines={list.map((l) => ({ element: `.ele-${l.id}`, className: 'grid-guide-lines' }))}
        isDisplaySnapDigit={false}
        // snapGridWidth={gridWidth}
        bounds={{ left: 0, top: 0, right: 0, bottom: 0, position: 'css' }}
        displayAroundControls={true}
        controlPadding={20}
        // hideDefaultLines
      />
    </>
  ) : (
    ''
  );
}

function getMouseDistanceFromParentDiv(event, id) {
  // Get the parent div element.
  const parentDiv = id
    ? typeof id === 'string'
      ? document.getElementById(id)
      : id
    : document.getElementsByClassName('real-canvas')[0];

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

export function findHighestLevelofSelection(selectedComponents) {
  let result = [...selectedComponents];
  if (selectedComponents.some((widget) => !widget?.component?.parent)) {
    result = selectedComponents.filter((widget) => !widget?.component?.parent);
  } else {
    result = selectedComponents.filter(
      (widget) => widget?.component?.parent === selectedComponents[0]?.component?.parent
    );
  }
  // const result = selectedComponents.filter((widget) => {
  //   console.log(
  //     'groupedTargets-->result------>',
  //     widget?.component?.parent,
  //     selectedComponents,
  //     selectedComponents.some((e) => e.id === widget?.component?.parent)
  //   );
  //   return (
  //     widget?.component?.parent !== undefined && !selectedComponents.some((e) => e.id === widget?.component?.parent)
  //   );
  // });
  console.log('groupedTargets-->result------', result, selectedComponents);
  return result;
}

async function runAsync(fn) {
  // console.log('Executing_ssetState==>' + fn);
  // setImmediate(() => {
  fn();
  // });
}

function findChildrenAndGrandchildren(parentId, widgets) {
  if (isEmpty(widgets)) {
    return [];
  }
  console.log('findChildrenAndGrandchildren', parentId, widgets);
  const type = widgets.find(({ id }) => id === parentId)?.component?.component;
  let pid = parentId;
  console.log(
    'findChildrenAndGrandchildren ->type',
    type,
    widgets.find(({ id }) => id === parentId)
  );
  if (type === 'Kanban') {
    pid = pid + '-modal';
  }
  console.log(
    'findChildrenAndGrandchildren => pid',
    pid,
    widgets.map((w) => w?.component?.parent)
  );
  const children = widgets.filter((widget) => widget?.component?.parent === pid);
  let result = [];
  for (const child of children) {
    result.push(child.id);
    result = result.concat(...findChildrenAndGrandchildren(child.id));
  }
  console.log(
    'findChildrenAndGrandchildren => result',
    widgets.filter((r) => result.includes(r.id))
  );
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
