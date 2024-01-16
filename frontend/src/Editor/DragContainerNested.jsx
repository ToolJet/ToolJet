import React, { useState, useEffect } from 'react';
import './DragContainer.css';
import { isEmpty } from 'lodash';
const NO_OF_GRIDS = 43;

export default function DragContainerNested({
  boxes,
  renderWidget,
  canvasWidth,
  gridWidth,
  parent,
  currentLayout,
  readOnly,
}) {
  const boxList = boxes.map((box) => ({
    id: box.id,
    height: box?.layouts?.desktop?.height,
    left: box?.layouts?.desktop?.left,
    top: box?.layouts?.desktop?.top,
    width: box?.layouts?.desktop?.width,
  }));
  const [list, setList] = useState(boxList);

  useEffect(() => {
    setList(boxList);
  }, [boxes?.length]);

  const getDimensions = (id) => {
    const box = boxes.find((b) => b.id === id);
    const layoutData = box?.layouts?.[currentLayout];
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
      <div className={`container-fluid p-0 h-100 drag-container-parent`} component-id={parent}>
        {/* <button onClick={() => setList((list) => [...list, { id: new Date().getTime() }])}>Add</button> */}
        {list.map((i) => (
          <div
            className={
              readOnly
                ? `ele-${i.id} nested-target moveable-box`
                : `target-${parent} target1-${i.parent} ele-${i.id} nested-target moveable-box target`
            }
            key={i.id}
            id={i.id}
            style={{ transform: `translate(332px, -134px)`, ...getDimensions(i.id) }}
            widget-id={i.id}
            widgetid={i.id}
          >
            {/* Target {i.id} */}
            {renderWidget(i.id)}
          </div>
        ))}
      </div>
    </div>
  );
}
