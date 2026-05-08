import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const BAR = 3;

const FlexContainerDropIndicator = ({ flexContainerId, direction = 'column' }) => {
  const target = useStore(
    (state) =>
      state.flexContainerDropTarget?.flexContainerId === flexContainerId ? state.flexContainerDropTarget : null,
    shallow
  );
  if (!target) return null;

  const inner = document.querySelector(`[data-parentId="${flexContainerId}"]`);
  if (!inner) return null;

  const children = inner.querySelectorAll(':scope > .flex-child-wrapper');
  const isRow = direction === 'row';

  const baseStyle = {
    position: 'absolute',
    backgroundColor: '#4d72fa',
    borderRadius: '2px',
    pointerEvents: 'none',
    zIndex: 1000,
  };

  if (children.length === 0) {
    return <div style={{ ...baseStyle, left: 8, top: 8, width: isRow ? BAR : 24, height: isRow ? 24 : BAR }} />;
  }

  const idx = Math.min(target.index, children.length - 1);
  const child = children[idx];

  const style = isRow
    ? { left: child.offsetLeft - BAR / 2, top: child.offsetTop, bottom: 0, width: BAR }
    : { top: child.offsetTop - BAR / 2, left: child.offsetLeft, right: 0, height: BAR };

  return <div style={{ ...baseStyle, ...style }} />;
};

export { FlexContainerDropIndicator };
