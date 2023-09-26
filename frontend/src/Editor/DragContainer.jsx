import React, { useState } from 'react';
import Moveable from 'react-moveable';
import './DragContainer.css';
import DragContainerNested from './DragContainerNested';
import { isEmpty } from 'lodash';

export default function DragContainer({ boxes }) {
  const boxList = boxes.map((box) => ({
    id: box.id,
    height: box?.layout?.desktop?.height,
    left: box?.layout?.desktop?.left,
    top: box?.layout?.desktop?.top,
    width: box?.layout?.desktop?.width,
  }));
  const [list, setList] = useState(boxList);
  const [isChildDragged, setIsChildDragged] = useState(false);
  return (
    <div className="root">
      <div className="container">
        <button onClick={() => setList((list) => [...list, { id: new Date().getTime() }])}>Add</button>
        {list.map((i) =>
          isEmpty(i.children) ? (
            <div className="target target1" key={i} style={{ transform: 'translate(332px, -134px)' }}>
              Target {i.id}
              <input type="text" />
            </div>
          ) : (
            <div key={i} className="target target1">
              <DragContainerNested setIsChildDragged={setIsChildDragged} />
            </div>
          )
        )}
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
        {/* <Moveable
          target={'.target'}
          individualGroupable={true}
          draggable={true}
          resizable={true}
          rotatable={true}
          key={list.length}
          individualGroupableProps={(element) => {
            if (element?.classList.contains('target2')) {
              return {
                resizable: false,
              };
            }
          }}
          // onRender={(e) => {
          //   if (isChildDragged) {
          //     return;
          //   }
          //   console.log('e.target.style', e.cssText);
          //   e.target.style.cssText += e.cssText;
          // }}
          checkInput
          onDrag={(e) => {
            console.log('event', e.clientX, e.clientY, e.transform, e.translate);
            console.log(e.target.style);
            if (!isChildDragged) {
              e.target.style.transform = `translate(${Math.round(e.translate[0] / 10) * 10}px, ${
                Math.round(e.translate[1] / 10) * 10
              }px)`;
            }
            if (document.elementFromPoint(e.clientX, e.clientY)) {
              console.log('Hoverover=>', document.elementsFromPoint(e.clientX, e.clientY));
            }
          }}
          //snap settgins
          snappable={true}
          snapDirections={{ top: true, left: true, bottom: true, right: true }}
          snapThreshold={5}
          verticalGuidelines={[50, 150, 250, 450, 550]}
          horizontalGuidelines={[0, 100, 200, 400, 500]}
        /> */}
      </div>
    </div>
  );
}
