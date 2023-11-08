import React, { useState, useEffect, useRef } from 'react';
import Moveable, { makeAble } from 'react-moveable';
import './DragContainer.css';
import { isEmpty } from 'lodash';
const NO_OF_GRIDS = 24;

const MouseEnterLeaveAble = makeAble('enterLeave', {
  mouseEnter(moveable) {
    console.log('moveable', moveable);
  },
  mouseLeave(moveable) {
    console.log('moveable2', moveable);
  },
});

export default function NestedDragContainer({
  boxes,
  renderWidget,
  canvasWidth,
  onResizeStop,
  onDrag,
  gridWidth,
  setIsChildDragged,
  parent,
  parentLayout,
  parentGridWidth,
  allComponents,
}) {
  const [dragTarget, setDragTarget] = useState();
  const boxList = boxes.map((box) => ({
    id: box.id,
    height: box?.layouts?.desktop?.height,
    left: box?.layouts?.desktop?.left,
    top: box?.layouts?.desktop?.top,
    width: box?.layouts?.desktop?.width,
  }));
  const [list, setList] = useState(boxList);
  const moveableRef = useRef();

  useEffect(() => {
    setList(boxList);
  }, [boxes?.length]);

  useEffect(() => {
    moveableRef.current.updateRect();
  }, [...Object.values(parentLayout), boxes?.length]);

  // const [isChildDragged, setIsChildDragged] = useState(false);

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

  return (
    <div className="root h-100">
      <div className="container p-0 h-100">
        {/* <button onClick={() => setList((list) => [...list, { id: new Date().getTime() }])}>Add</button> */}
        {list.map((i) => (
          <div
            className={`target-${parent} target1-${i.parent} ele-${i.id} nested-target`}
            key={i.id}
            id={i.id}
            style={{ transform: `translate(332px, -134px)`, ...getDimensions(i.id) }}
            widget-id={i.id}
          >
            {/* Target {i.id} */}
            {renderWidget(i.id)}
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
          target={`.target-${parent}`}
          origin={false}
          ables={[MouseEnterLeaveAble]}
          props={{
            enterLeave: true,
          }}
          individualGroupable={true}
          draggable={true}
          resizable={true}
          keepRatio={false}
          rotatable={false}
          key={list.length}
          individualGroupableProps={(element) => {
            if (element?.classList.contains('target2')) {
              return {
                resizable: false,
              };
            }
          }}
          onResize={(e) => {
            console.log('e._dragTarget.id', e.target, e.target.id, e.drag);
            e.target.style.width = `${e.width}px`;
            e.target.style.height = `${e.height}px`;
            e.target.style.transform = e.drag.transform;
            onResizeStop(e.target.id, e.height, e.width, e.drag.translate[0], e.drag.translate[1]);
          }}
          checkInput
          onDragStart={() => setIsChildDragged(true)}
          onDrag={(e) => {
            setIsChildDragged(true);
            // if (!isChildDragged) {
            e.target.style.transform = `translate(${Math.round(e.translate[0] / gridWidth) * gridWidth}px, ${
              Math.round(e.translate[1] / 10) * 10
            }px)`;
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
            console.log('draggedOverElemId child', draggedOverElemId, parent);

            // onDrag(e.target.id, e.translate[0], e.translate[1], draggedOverElemId);
          }}
          //snap settgins
          snappable={true}
          onDragEnd={(e) => {
            setIsChildDragged(false);
            // if (!isChildDragged) {
            // e.target.style.transform = `translate(${Math.round(e.translate[0] / gridWidth) * gridWidth}px, ${
            //   Math.round(e.translate[1] / 10) * 10
            // }px)`;
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
            let left = e.lastEvent.translate[0];
            let top = e.lastEvent.translate[1];
            console.log('draggedOverElemId child', draggedOverElemId, parent);
            // if (!draggedOverElemId) {
            //   left = left + parentLayout.left * (parentGridWidth / 24);
            //   top = top + parentLayout.top;
            // }

            if (draggedOverElemId !== parent) {
              left = left + parentLayout.left * parentGridWidth;
              top = top + parentLayout.top;
              if (draggedOverElemId) {
                const newParentElem = allComponents[draggedOverElemId]?.layouts?.desktop;
                let { left: _left, top: _top } = getMouseDistanceFromParentDiv(e, draggedOverElemId);
                // left = left - newParentElem.left * parentGridWidth;
                // top = top - newParentElem.top;
                left = _left;
                top = _top;
              }
            }

            onDrag(e.target.id, left, top, draggedOverElemId);
          }}
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

function getMouseDistanceFromParentDiv(event, id) {
  // Get the parent div element.
  const parentDiv = document.getElementById(id);

  // Get the bounding rectangle of the parent div.
  const parentDivRect = parentDiv.getBoundingClientRect();

  // Get the mouse position relative to the parent div.
  const mouseX = event.clientX - parentDivRect.left;
  const mouseY = event.clientY - parentDivRect.top;

  // Calculate the distance from the mouse pointer to the top and left edges of the parent div.
  const top = mouseY;
  const left = mouseX;

  return { top, left };
}

// export default function DragContainer({ setIsChildDragged }) {
//   const [list, setList] = useState([1, 2, 3]);
//   return (
//     <div className="root">
//       <div className="container">
//         <button onClick={() => setList((list) => [...list, new Date().getTime()])}>Add</button>
//         {list.map((i) => (
//           <div className="nested-target nested-target1" key={i} style={{ transform: 'translate(332px, -134px)' }}>
//             Target1
//           </div>
//         ))}
//         <div className="nested-target">Target1</div>
//         {/* <div className="target target1">Target1</div>
//         <div className="target target2">Target2</div>
//         <div className="target target3">Target3</div> */}
//         <Moveable
//           target={'.nested-target'}
//           individualGroupable={true}
//           draggable={true}
//           resizable={true}
//           rotatable={true}
//           key={list.length}
//           individualGroupableProps={(element) => {
//             if (element?.classList.contains('target2')) {
//               return {
//                 resizable: false,
//               };
//             }
//           }}
//           onDragEnd={() => setIsChildDragged(false)}
//           onRender={(e) => {
//             console.log('e.target.style', e.cssText);
//             setIsChildDragged(true);
//             e.target.style.cssText += e.cssText;
//           }}
//           //snap settgins
//           snappable={true}
//           snapDirections={{ top: true, left: true, bottom: true, right: true }}
//           snapThreshold={5}
//           verticalGuidelines={[50, 150, 250, 450, 550]}
//           horizontalGuidelines={[0, 100, 200, 400, 500]}
//         />
//       </div>
//     </div>
//   );
// }
