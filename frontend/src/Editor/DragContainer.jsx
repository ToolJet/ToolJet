import React, { useEffect, useState, useRef } from 'react';
import Moveable from 'react-moveable';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import './DragContainer.css';
import DragContainerNested from './DragContainerNested';
import { isEmpty } from 'lodash';
const NO_OF_GRIDS = 43;

export default function DragContainer({
  boxes,
  renderWidget,
  canvasWidth,
  onResizeStop,
  onDrag,
  gridWidth,
  selectedComponents = [],
}) {
  const [dragTarget, setDragTarget] = useState();
  const [draggedTarget, setDraggedTarget] = useState();
  const moveableRef = useRef();
  const boxList = boxes.map((box) => ({
    id: box.id,
    height: box?.layouts?.desktop?.height,
    left: box?.layouts?.desktop?.left,
    top: box?.layouts?.desktop?.top,
    width: box?.layouts?.desktop?.width,
    parent: box.parent,
  }));
  const [list, setList] = useState(boxList);

  const hoveredComponent = useEditorStore((state) => state?.hoveredComponent, shallow);

  useEffect(() => {
    moveableRef.current.updateRect();
    window.moveableRef = moveableRef.current.updateRect;
  }, [selectedComponents.length]);

  useEffect(() => {
    setList(boxList);
  }, [boxes?.length]);

  const [isChildDragged, setIsChildDragged] = useState(false);

  const getDimensions = (id) => {
    const box = boxes.find((b) => b.id === id);
    const layoutData = box?.layouts?.desktop;
    if (isEmpty(layoutData)) {
      return {};
    }
    const width = (canvasWidth * layoutData.width) / NO_OF_GRIDS;

    return {
      width: width + 'px',
      height: layoutData.height + 'px',
      transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    };
  };

  const groupedTargets = [...selectedComponents.map((component) => '.ele-' + component.id)];
  const movableTargets = [groupedTargets];
  if (hoveredComponent && !groupedTargets?.length) {
    movableTargets.push('.ele-' + hoveredComponent);
  }

  if (draggedTarget && !movableTargets.includes(`.ele-${draggedTarget}`)) {
    movableTargets.push('.ele-' + draggedTarget);
  }

  //   console.log("movableTargets", movableTargets, hoveredComponent);

  return (
    <div className="root">
      <div className="container p-0">
        {list
          .filter((i) => isEmpty(i.parent))
          .map((i) => (
            <div
              className={`target widget-target target1 ele-${i.id}`}
              data-id={`${i.parent}`}
              key={i.id}
              id={i.id}
              widgetid={i.id}
              style={{ transform: `translate(332px, -134px)`, ...getDimensions(i.id) }}
            >
              {/* Target {i.id} */}
              {renderWidget(i.id, undefined, setIsChildDragged)}
            </div>
          ))}
        {/* <div className="target target1">
          <DragContainerNested setIsChildDragged={setIsChildDragged} />
        </div> */}
        {/* <div className="target target1">
          Target12
          <input type="text" />
        </div> */}
        {/* <div className="target target1">Target1</div>
        <div className="target target2">Target2</div>
        <div className="target target3">Target3</div> */}
        <Moveable
          ref={moveableRef}
          // target={'.target'}
          target={movableTargets}
          // hideChildMoveableDefaultLines={false}
          // individualGroupable={true}
          individualGroupable={selectedComponents.length <= 1}
          draggable={true}
          resizable={true}
          keepRatio={false}
          rotatable={true}
          key={list.length}
          individualGroupableProps={(element) => {
            if (element?.classList.contains('target2')) {
              return {
                resizable: false,
              };
            }
          }}
          onResize={(e) => {
            e.target.style.width = `${e.width}px`;
            e.target.style.height = `${e.height}px`;
            e.target.style.transform = e.drag.transform;
            onResizeStop([
              {
                id: e.target.id,
                height: e.height,
                width: e.width,
                x: e.drag.translate[0],
                y: e.drag.translate[1],
              },
            ]);
          }}
          onResizeGroup={({ events }) => {
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
          checkInput
          onDragEnd={(e) => {
            console.log('onDragEnd', e);
            setDraggedTarget();
            if (isChildDragged) {
              return;
            }

            // onDrag(e.target.id, e.translate[0], e.translate[1]);
            // console.log(e.target.style);
            // if (!isChildDragged) {
            //   e.target.style.transform = `translate(${Math.round(e.translate[0] / 10) * 10}px, ${
            //     Math.round(e.translate[1] / 10) * 10
            //   }px)`;
            // }

            let draggedOverElemId;
            if (document.elementFromPoint(e.clientX, e.clientY)) {
              const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
              // targetElems.forEach((e) => console.log('Element=>', { id: e.id, clist: e.classList, class: e.className }));
              const draggedOverElem = targetElems.find(
                (ele) => ele.id !== e.target.id && ele.classList.contains('target')
              );
              setDragTarget(draggedOverElem?.id);
              console.log('draggedOverElem =>', draggedOverElem?.id, dragTarget);
              draggedOverElemId = draggedOverElem?.id;
            }
            onDrag([
              { id: e.target.id, x: e.lastEvent.translate[0], y: e.lastEvent.translate[1], parent: draggedOverElemId },
            ]);
          }}
          onDrag={(e) => {
            if (isChildDragged) {
              return;
            }
            setDraggedTarget(e.target.id);
            // onDrag(e.target.id, e.translate[0], e.translate[1]);
            // console.log(e.target.style);
            if (!isChildDragged) {
              e.target.style.transform = `translate(${Math.round(e.translate[0] / gridWidth) * gridWidth}px, ${
                Math.round(e.translate[1] / 10) * 10
              }px)`;
            }

            // let draggedOverElemId;
            // if (document.elementFromPoint(e.clientX, e.clientY)) {
            //   const targetElems = document.elementsFromPoint(e.clientX, e.clientY);
            //   // targetElems.forEach((e) => console.log('Element=>', { id: e.id, clist: e.classList, class: e.className }));
            //   const draggedOverElem = targetElems.find(
            //     (ele) => ele.id !== e.target.id && ele.classList.contains('target')
            //   );
            //   setDragTarget(draggedOverElem?.id);
            //   console.log('draggedOverElem =>', draggedOverElem?.id, dragTarget);
            //   draggedOverElemId = draggedOverElem?.id;
            // }
            // onDrag([{ id: e.target.id, x: e.translate[0], y: e.translate[1], parent: draggedOverElemId }]);
          }}
          onDragGroup={({ events }) => {
            events.forEach((ev) => {
              console.log('Grouped data=>', ev);
              //   ev.target.style.transform = ev.transform;
            });
            onDrag(
              events.map((ev) => ({
                id: ev.target.id,
                x: ev.translate[0],
                y: ev.translate[1],
              }))
            );
          }}
          //snap settgins
          snappable={true}
          snapDirections={{ top: true, left: true, bottom: true, right: true }}
          snapThreshold={5}
          elementGuidelines={list.map((l) => ({ element: `.ele-${l.id}` }))}
          // verticalGuidelines={[50, 150, 250, 450, 550]}
          // horizontalGuidelines={[0, 100, 200, 400, 500]}
        />
      </div>
    </div>
  );
}
