import React, { useState, useEffect, useRef } from 'react';
import Moveable from 'react-moveable';
import './DragContainer.css';
import { isEmpty } from 'lodash';
const NO_OF_GRIDS = 43;

export default function DragContainer({
  boxes,
  renderWidget,
  canvasWidth,
  onResizeStop,
  onDrag,
  gridWidth,
  setIsChildDragged,
  parent,
  parentLayout,
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
  }, [...Object.values(parentLayout)]);

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
          individualGroupable={true}
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
            console.log('e._dragTarget.id', e.target, e.target.id, e.drag);
            e.target.style.width = `${e.width}px`;
            e.target.style.height = `${e.height}px`;
            e.target.style.transform = e.drag.transform;
            onResizeStop(e.target.id, e.height, e.width, e.drag.translate[0], e.drag.translate[1]);
          }}
          checkInput
          onDrag={(e) => {
            setIsChildDragged(true);
            onDrag(e.target.id, e.translate[0], e.translate[1]);
            // if (!isChildDragged) {
            e.target.style.transform = `translate(${Math.round(e.translate[0] / gridWidth) * gridWidth}px, ${
              Math.round(e.translate[1] / 10) * 10
            }px)`;
            // }

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
            // onDrag(e.target.id, e.translate[0], e.translate[1], draggedOverElemId);
          }}
          //snap settgins
          snappable={true}
          onDragEnd={() => setIsChildDragged(false)}
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
