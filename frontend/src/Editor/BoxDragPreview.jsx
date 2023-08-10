import React, { useEffect, useState, memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useEditorStore } from '@/_stores/editorStore';

export const BoxDragPreview = memo(function BoxDragPreview({ item, canvasWidth }) {
  const [tickTock, setTickTock] = useState(false);
  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
    }),
    shallow
  );
  useEffect(
    function subscribeToIntervalTick() {
      const interval = setInterval(() => setTickTock(!tickTock), 500);
      return () => clearInterval(interval);
    },
    [tickTock]
  );

  const layouts = item.layouts;
  let { width, height } = layouts ? item.layouts[currentLayout] : {};

  if (item.id === undefined) {
    width = item.component.defaultSize.width;
    height = item.component.defaultSize.height;
  }

  return (
    <div
      className="resizer-active draggable-box"
      style={{ height, width: (width * canvasWidth) / 43, border: 'solid 1px rgb(70, 165, 253)', padding: '2px' }}
    >
      <div
        style={{
          background: '#438fd7',
          opacity: '0.7',
          height: '100%',
          width: '100%',
        }}
      ></div>
    </div>
  );
});
