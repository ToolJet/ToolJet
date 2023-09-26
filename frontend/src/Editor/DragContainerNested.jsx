import React, { useState } from 'react';
import Moveable from 'react-moveable';
import './DragContainer.css';

export default function DragContainer({ setIsChildDragged }) {
  const [list, setList] = useState([1, 2, 3]);
  return (
    <div className="root">
      <div className="container">
        <button onClick={() => setList((list) => [...list, new Date().getTime()])}>Add</button>
        {list.map((i) => (
          <div className="nested-target nested-target1" key={i} style={{ transform: 'translate(332px, -134px)' }}>
            Target1
          </div>
        ))}
        <div className="nested-target">Target1</div>
        {/* <div className="target target1">Target1</div>
        <div className="target target2">Target2</div>
        <div className="target target3">Target3</div> */}
        <Moveable
          target={'.nested-target'}
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
          onDragEnd={() => setIsChildDragged(false)}
          onRender={(e) => {
            console.log('e.target.style', e.cssText);
            setIsChildDragged(true);
            e.target.style.cssText += e.cssText;
          }}
          //snap settgins
          snappable={true}
          snapDirections={{ top: true, left: true, bottom: true, right: true }}
          snapThreshold={5}
          verticalGuidelines={[50, 150, 250, 450, 550]}
          horizontalGuidelines={[0, 100, 200, 400, 500]}
        />
      </div>
    </div>
  );
}
