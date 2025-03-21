// // hooks.js

// import { useRef, useCallback } from 'react';
// import { useGridStore } from '@/_stores/gridStore';
// import { adjustWidth, getPositionForGroupDrag, hasParentWithClass } from './gridUtils';
// import toast from 'react-hot-toast';

// export function useHandleDrag(widgets, boxes, gridWidth, onDrag) {
//   const isDraggingRef = useRef(false);
//   const draggedOverElemRef = useRef(null);

//   const handleDragStart = useCallback(
//     (e) => {
//       if (isDraggingRef.current) return false;
//       isDraggingRef.current = true;
//       e?.moveable?.controlBox?.removeAttribute('data-off-screen');

//       const box = boxes.find((box) => box.id === e.target.id);
//       if (isInvalidDrag(e, box)) return false;

//       useGridStore.getState().actions.setDraggingComponentId(e.target.id);
//     },
//     [boxes]
//   );

//   const handleDrag = useCallback((e) => {
//     if (isDraggableSubContainer(e)) return;

//     updateDragPosition(e);
//     updateDraggedOverElement(e);
//     updateDragGhost(e);
//   }, []);

//   const handleDragEnd = useCallback(
//     (e) => {
//       isDraggingRef.current = false;
//       useGridStore.getState().actions.setDraggingComponentId(null);

//       if (isDraggableSubContainer(e) || !e.lastEvent) return;

//       const { draggedOverElemId, isParentChangeAllowed } = getDraggedOverInfo(e, widgets, boxes);
//       const _gridWidth = useGridStore.getState().subContainerWidths[draggedOverElemId] || gridWidth;

//       updateElementPosition(e, draggedOverElemId, isParentChangeAllowed, _gridWidth, onDrag);
//       cleanupDragEffects();
//     },
//     [widgets, boxes, gridWidth, onDrag]
//   );

//   return { handleDragStart, handleDrag, handleDragEnd };
// }

// export function useHandleResize(widgets, boxes, gridWidth, onResizeStop) {
//   const handleResizeStart = useCallback(
//     (e) => {
//       if (!isComponentVisible(e.target.id, widgets)) return false;
//       useGridStore.getState().actions.setResizingComponentId(e.target.id);
//       e.setMin([gridWidth, 10]);
//     },
//     [widgets, gridWidth]
//   );

//   const handleResize = useCallback(
//     (e) => {
//       const currentLayout = getCurrentLayout(e.target.id, boxes);
//       const currentWidget = getCurrentWidget(e.target.id, boxes);
//       const _gridWidth = getGridWidth(currentWidget, gridWidth);

//       updateResizeStyles(e, currentLayout, _gridWidth);
//     },
//     [boxes, gridWidth]
//   );

//   const handleResizeEnd = useCallback(
//     (e) => {
//       try {
//         useGridStore.getState().actions.setResizingComponentId(null);
//         const currentWidget = getCurrentWidget(e.target.id, boxes);
//         const _gridWidth = getGridWidth(currentWidget, gridWidth);

//         const resizeData = calculateResizeData(e, _gridWidth, currentWidget);
//         onResizeStop([resizeData]);
//       } catch (error) {
//         console.error('ResizeEnd error ->', error);
//       }
//       useGridStore.getState().actions.setDragTarget();
//     },
//     [boxes, gridWidth, onResizeStop]
//   );

//   return { handleResizeStart, handleResize, handleResizeEnd };
// }

// export function useHandleGroupActions(widgets, boxes, gridWidth, onDrag, onResizeStop) {
//   const groupResizeDataRef = useRef([]);

//   const handleGroupDragStart = useCallback(({ events }) => {
//     const parentElm = events[0]?.target?.closest('.real-canvas');
//     parentElm?.classList?.add('show-grid');
//   }, []);

//   const handleGroupDrag = useCallback(({ events }) => {
//     events.forEach((ev) => {
//       let posX = ev.translate[0];
//       let posY = ev.translate[1];
//       ev.target.style.transform = `translate(${posX}px, ${posY}px)`;
//     });
//   }, []);

//   const handleGroupDragEnd = useCallback(
//     (e) => {
//       const { events } = e;
//       const parentId = widgets[events[0]?.target?.id]?.component?.parent;
//       const parentElm = events[0].target.closest('.real-canvas');
//       parentElm.classList.remove('show-grid');

//       const { parentWidth, parentHeight } = getParentDimensions(parentElm);
//       const positions = getPositionForGroupDrag(events, parentWidth, parentHeight);
//       const _gridWidth = useGridStore.getState().subContainerWidths[parentId] || gridWidth;

//       const dragData = calculateGroupDragData(events, positions, _gridWidth, parentId);
//       onDrag(dragData);
//     },
//     [widgets, gridWidth, onDrag]
//   );

//   const handleGroupResizeStart = useCallback(({ events }) => {
//     const parentElm = events[0].target.closest('.real-canvas');
//     parentElm.classList.add('show-grid');
//   }, []);

//   const handleGroupResize = useCallback(({ events }) => {
//     const parentElm = events[0].target.closest('.real-canvas');
//     const { parentWidth, parentHeight } = getParentDimensions(parentElm);

//     const positions = getPositionForGroupDrag(events, parentWidth, parentHeight);
//     updateGroupResizeStyles(events, positions);

//     if (arePositionsValid(positions)) {
//       groupResizeDataRef.current = events;
//     }
//   }, []);

//   const handleGroupResizeEnd = useCallback(
//     (e) => {
//       const { events } = e;
//       const parentElm = events[0].target.closest('.real-canvas');
//       parentElm.classList.remove('show-grid');

//       if (groupResizeDataRef.current.length) {
//         const resizeData = calculateGroupResizeData(groupResizeDataRef.current, widgets, gridWidth);
//         onResizeStop(resizeData);
//       } else {
//         resetGroupStyles(events, widgets, gridWidth);
//       }

//       groupResizeDataRef.current = [];
//     },
//     [widgets, gridWidth, onResizeStop]
//   );

//   return {
//     handleGroupDragStart,
//     handleGroupDrag,
//     handleGroupDragEnd,
//     handleGroupResizeStart,
//     handleGroupResize,
//     handleGroupResizeEnd,
//   };
// }

// // Helper functions

// function isInvalidDrag(e, box) {
//   if (hasParentWithClass(e.inputEvent.target, 'react-datepicker-popper')) {
//     return true;
//   }

//   if (['RangeSlider', 'Container', 'BoundedBox', 'Kanban'].includes(box?.component?.component)) {
//     const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
//     const isHandle = targetElems.find((ele) => ele.classList.contains('handle-content'));
//     return !isHandle;
//   }

//   if (box?.component?.component === 'Table') {
//     const tableElem = e.target.querySelector('.jet-data-table');
//     return tableElem.contains(e.inputEvent.target);
//   }

//   return false;
// }

// function isDraggableSubContainer(e) {
//   // Implement based on your specific requirements
//   return false;
// }

// function updateDragPosition(e) {
//   const parentComponent = e.target.closest('.real-canvas');
//   let top = e.translate[1];
//   let left = e.translate[0];

//   if (parentComponent) {
//     const containerHeight = parentComponent.clientHeight;
//     const containerWidth = parentComponent.clientWidth;
//     const maxY = containerHeight - e.target.clientHeight;
//     const maxLeft = containerWidth - e.target.clientWidth;
//     top = Math.max(0, Math.min(top, maxY));
//     left = Math.max(0, Math.min(left, maxLeft));
//   }

//   e.target.style.transform = `translate(${left}px, ${top}px)`;
// }

// function updateDraggedOverElement(e) {
//   const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
//   const draggedOverElem = targetElems.find(
//     (ele) => ele.id !== e.target.id && (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
//   );

//   if (draggedOverElem && draggedOverElem !== draggedOverElemRef.current) {
//     draggedOverElem.classList.add('show-grid');
//     draggedOverElemRef.current && draggedOverElemRef.current.classList.remove('show-grid');
//     draggedOverElemRef.current = draggedOverElem;
//   }
// }

// function updateDragGhost(e) {
//   const ghostElement = document.getElementById('moveable-drag-ghost');
//   if (ghostElement) {
//     const offset = getOffset(e.target, document.querySelector('#real-canvas'));
//     ghostElement.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
//     ghostElement.style.width = `${e.target.clientWidth}px`;
//     ghostElement.style.height = `${e.target.clientHeight}px`;
//   }
// }

// function getDraggedOverInfo(e, widgets, boxes) {
//   const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
//   const draggedOverElem = targetElems.find(
//     (ele) => ele.id !== e.target.id && (ele.classList.contains('target') || ele.classList.contains('real-canvas'))
//   );

//   const draggedOverElemId = draggedOverElem?.getAttribute('component-id') || draggedOverElem?.id;
//   const currentParentId = boxes.find(({ id }) => e.target.id === id)?.component?.parent;

//   const currentWidget = boxes.find(({ id }) => id === e.target.id)?.component?.component;
//   const parentWidget = widgets[draggedOverElemId]?.component?.component;

//   const restrictedWidgets = ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container', 'Table'];
//   const isParentChangeAllowed = restrictedWidgets.includes(parentWidget) && draggedOverElemId !== currentParentId;

//   return { draggedOverElemId, isParentChangeAllowed };
// }

// function updateElementPosition(e, draggedOverElemId, isParentChangeAllowed, gridWidth, onDrag) {
//   let left = e.lastEvent?.translate[0];
//   let top = e.lastEvent?.translate[1];

//   if (['Listview', 'Kanban'].includes(widgets[draggedOverElemId]?.component?.component)) {
//     const elemContainer = e.target.closest('.real-canvas');
//     const containerHeight = elemContainer.clientHeight;
//     const maxY = containerHeight - e.target.clientHeight;
//     top = Math.min(top, maxY);
//   }

//   const roundedLeft = Math.round(left / gridWidth) * gridWidth;
//   const roundedTop = Math.round(top / 10) * 10;

//   e.target.style.transform = `translate(${roundedLeft}px, ${roundedTop}px)`;

//   onDrag([
//     {
//       id: e.target.id,
//       x: roundedLeft,
//       y: roundedTop,
//       parent: isParentChangeAllowed ? draggedOverElemId : undefined,
//     },
//   ]);
// }

// function cleanupDragEffects() {
//   const canvasElms = document.getElementsByClassName('sub-canvas');
//   Array.from(canvasElms).forEach((element) => {
//     element.classList.remove('show-grid');
//     element.classList.add('hide-grid');
//   });
// }

// function isComponentVisible(id, widgets) {
//   const widget = widgets[id];
//   if (!widget) return false;

//   const visibility =
//     widget.component?.definition?.properties?.visibility?.value ??
//     widget.component?.definition?.styles?.visibility?.value ??
//     null;
//   return visibility !== false;
// }

// function getCurrentLayout(id, boxes) {
//   return boxes.find((box) => box.id === id)?.layouts?.current;
// }

// function getCurrentWidget(id, boxes) {
//   return boxes.find((box) => box.id === id);
// }

// function getGridWidth(widget, defaultGridWidth) {
//   return useGridStore.getState().subContainerWidths[widget?.component?.parent] || defaultGridWidth;
// }

// function updateResizeStyles(e, currentLayout, gridWidth) {
//   const { width, height, direction } = e;
//   const [isLeftChanged, isTopChanged] = direction;

//   let transformX = currentLayout.left * gridWidth;
//   let transformY = currentLayout.top;

//   if (isLeftChanged) transformX -= width - currentLayout.width * gridWidth;
//   if (isTopChanged) transformY -= height - currentLayout.height;

//   const elemContainer = e.target.closest('.real-canvas');
//   const containerHeight = elemContainer.clientHeight;
//   const containerWidth = elemContainer.clientWidth;
//   const maxY = containerHeight - height;
//   const maxLeft = containerWidth - width;

//   transformY = Math.max(0, Math.min(transformY, maxY));
//   transformX = Math.max(0, Math.min(transformX, maxLeft));

//   e.target.style.width = `${width}px`;
//   e.target.style.height = `${height}px`;
//   e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
// }

// function calculateResizeData(e, gridWidth, widget) {
//   const width = Math.round(e.lastEvent.width / gridWidth) * gridWidth;
//   const height = Math.round(e.lastEvent.height / 10) * 10;
//   const transformX = Math.round(e.lastEvent.drag.beforeTranslate[0] / gridWidth) * gridWidth;
//   const transformY = Math.round(e.lastEvent.drag.beforeTranslate[1] / 10) * 10;

//   return {
//     id: e.target.id,
//     height,
//     width,
//     x: transformX,
//     y: transformY,
//     gw: widget.component?.parent ? gridWidth : undefined,
//   };
// }

// function getParentDimensions(parentElm) {
//   return {
//     parentWidth: parentElm.clientWidth,
//     parentHeight: parentElm.clientHeight,
//   };
// }

// function calculateGroupDragData(events, positions, gridWidth, parentId) {
//   return events.map((ev) => {
//     let posX = ev.lastEvent.translate[0];
//     let posY = ev.lastEvent.translate[1];

//     if (positions.posLeft < 0) posX -= positions.posLeft;
//     if (positions.posTop < 0) posY -= positions.posTop;
//     if (positions.posRight < 0) posX += positions.posRight;
//     if (positions.posBottom < 0) posY += positions.posBottom;

//     const roundedPosX = Math.round(posX / gridWidth) * gridWidth;
//     const roundedPosY = Math.round(posY / 10) * 10;

//     ev.target.style.transform = `translate(${roundedPosX}px, ${roundedPosY}px)`;

//     return {
//       id: ev.target.id,
//       x: roundedPosX,
//       y: roundedPosY,
//       parent: parentId,
//     };
//   });
// }

// function updateGroupResizeStyles(events, positions) {
//   events.forEach((ev) => {
//     const { width, height } = ev;
//     let posX = ev.drag.translate[0];
//     let posY = ev.drag.translate[1];

//     if (positions.posLeft < 0) posX -= positions.posLeft;
//     if (positions.posTop < 0) posY -= positions.posTop;
//     if (positions.posRight < 0) posX += positions.posRight;
//     if (positions.posBottom < 0) posY += positions.posBottom;

//     ev.target.style.width = `${width}px`;
//     ev.target.style.height = `${height}px`;
//     ev.target.style.transform = `translate(${posX}px, ${posY}px)`;
//   });
// }

// function arePositionsValid(positions) {
//   return !(positions.posLeft < 0 || positions.posTop < 0 || positions.posRight < 0 || positions.posBottom < 0);
// }

// function calculateGroupResizeData(events, widgets, gridWidth) {
//   return events.map((ev) => {
//     const currentWidget = widgets[ev.target.id];
//     const _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;

//     let width = Math.round(ev.width / _gridWidth) * _gridWidth;
//     width = Math.max(_gridWidth, width);

//     let posX = Math.round(ev.drag.translate[0] / _gridWidth) * _gridWidth;
//     let posY = Math.round(ev.drag.translate[1] / 10) * 10;
//     let height = Math.round(ev.height / 10) * 10;
//     height = Math.max(10, height);

//     ev.target.style.width = `${width}px`;
//     ev.target.style.height = `${height}px`;
//     ev.target.style.transform = `translate(${posX}px, ${posY}px)`;

//     return {
//       id: ev.target.id,
//       height,
//       width,
//       x: posX,
//       y: posY,
//       gw: _gridWidth,
//     };
//   });
// }

// function resetGroupStyles(events, widgets, gridWidth) {
//   events.forEach((ev) => {
//     const currentWidget = widgets[ev.target.id];
//     const _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
//     const layout =
//       currentWidget.layouts[currentWidget.component?.definition?.others?.currentLayout?.value || 'desktop'];

//     const width = layout.width * _gridWidth;
//     const posX = layout.left * _gridWidth;
//     const posY = layout.top;
//     const height = layout.height;

//     ev.target.style.width = `${width}px`;
//     ev.target.style.height = `${height}px`;
//     ev.target.style.transform = `translate(${posX}px, ${posY}px)`;
//   });
// }

// // Utility functions

// function getOffset(childElement, grandparentElement) {
//   if (!childElement || !grandparentElement) return { x: 0, y: 0 };

//   const childRect = childElement.getBoundingClientRect();
//   const grandparentRect = grandparentElement.getBoundingClientRect();

//   return {
//     x: childRect.left - grandparentRect.left,
//     y: childRect.top - grandparentRect.top,
//   };
// }
