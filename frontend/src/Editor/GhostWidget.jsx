import React from 'react';
import { isEmpty } from 'lodash';

export default function GhostWidget({ layouts, currentLayout, canvasWidth, gridWidth }) {
  let layoutStyle = {};
  if (!isEmpty(layouts?.[currentLayout] || layouts?.['desktop'])) {
    const layoutData = layouts?.[currentLayout] || layouts?.['desktop'];
    let width = (canvasWidth * layoutData.width) / 43;
    layoutStyle = {
      width: width + 'px',
      height: layoutData.height + 'px',
      transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
    };
  }
  return (
    <div
      className="resize-ghost-widget"
      style={{
        zIndex: 4,
        position: 'absolute',
        background: '#D9E2FC',
        opacity: '0.7',
        ...layoutStyle,
      }}
    ></div>
  );
}
