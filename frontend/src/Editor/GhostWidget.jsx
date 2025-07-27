import React from 'react';
import { isEmpty } from 'lodash';
import { ReactPortal } from '../_components/Portal/ReactPortal';

export default function GhostWidget({
  layouts,
  currentLayout,
  canvasWidth,
  gridWidth,
  usePortal = false,
  absoluteLeft = 0,
  absoluteTop = 0,
}) {
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

  // If usePortal, override transform and use absolute positioning
  const portalStyle = usePortal
    ? {
        zIndex: 9999,
        position: 'absolute',
        left: absoluteLeft,
        top: absoluteTop,
        width: layoutStyle.width,
        height: layoutStyle.height,
        background: '#D9E2FC',
        opacity: '0.7',
      }
    : {
        zIndex: 4,
        position: 'absolute',
        background: '#D9E2FC',
        opacity: '0.7',
        ...layoutStyle,
      };

  const ghost = <div className="resize-ghost-widget" style={portalStyle}></div>;

  if (usePortal) {
    return <ReactPortal>{ghost}</ReactPortal>;
  }
  return ghost;
}
