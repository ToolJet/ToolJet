import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const FlexContainerDropIndicator = ({ flexContainerId, direction = 'column' }) => {
  const target = useStore(
    (state) =>
      state.flexContainerDropTarget?.flexContainerId === flexContainerId ? state.flexContainerDropTarget : null,
    shallow
  );

  if (!target) return null;

  const inner = document.querySelector(`[data-parentId="${flexContainerId}"]`);
  if (!inner) return null;

  const children = Array.from(inner.querySelectorAll(':scope > .flex-child-wrapper'));
  const containerRect = inner.getBoundingClientRect();
  const isRow = direction === 'row';

  let linePos;
  if (isRow) {
    if (children.length === 0) {
      linePos = 8;
    } else if (target.index >= children.length) {
      const last = children[children.length - 1].getBoundingClientRect();
      linePos = last.right - containerRect.left + inner.scrollLeft;
    } else {
      const child = children[target.index].getBoundingClientRect();
      linePos = child.left - containerRect.left + inner.scrollLeft;
    }
  } else {
    if (children.length === 0) {
      linePos = 8;
    } else if (target.index >= children.length) {
      const last = children[children.length - 1].getBoundingClientRect();
      linePos = last.bottom - containerRect.top + inner.scrollTop;
    } else {
      const child = children[target.index].getBoundingClientRect();
      linePos = child.top - containerRect.top + inner.scrollTop;
    }
  }

  const lineStyle = isRow
    ? { top: 0, bottom: 0, left: `${linePos}px`, width: '2px' }
    : { left: 0, right: 0, top: `${linePos}px`, height: '2px' };

  const capStartStyle = isRow
    ? { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4d72fa', marginTop: '-4px', flexShrink: 0 }
    : {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#4d72fa',
        marginLeft: '-4px',
        flexShrink: 0,
      };

  const capEndStyle = isRow
    ? {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#4d72fa',
        marginBottom: '-4px',
        flexShrink: 0,
      }
    : {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#4d72fa',
        marginRight: '-4px',
        flexShrink: 0,
      };

  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: '#4d72fa',
        pointerEvents: 'none',
        zIndex: 1000,
        display: 'flex',
        flexDirection: isRow ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...lineStyle,
      }}
    >
      <div style={capStartStyle} />
      <div style={capEndStyle} />
    </div>
  );
};

export { FlexContainerDropIndicator };
