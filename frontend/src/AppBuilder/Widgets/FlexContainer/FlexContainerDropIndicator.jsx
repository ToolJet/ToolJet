import React, { useLayoutEffect, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const BAR = 3;

const FlexContainerDropIndicator = ({ flexContainerId, direction = 'column' }) => {
  const target = useStore(
    (state) =>
      state.flexContainerDropTarget?.flexContainerId === flexContainerId ? state.flexContainerDropTarget : null,
    shallow
  );

  const isRow = direction === 'row';

  const baseStyle = useMemo(
    () => ({
      position: 'absolute',
      backgroundColor: '#4d72fa',
      borderRadius: '2px',
      pointerEvents: 'none',
      zIndex: 1000,
    }),
    []
  );

  const [computedStyle, setComputedStyle] = useState(null);

  useLayoutEffect(() => {
    if (!target) {
      setComputedStyle(null);
      return;
    }

    if (typeof document === 'undefined') return;

    const inner = document.querySelector(`[data-parentId="${flexContainerId}"]`);
    if (!inner) {
      setComputedStyle(null);
      return;
    }

    const children = inner.querySelectorAll(':scope > .flex-child-wrapper');
    if (children.length === 0) {
      setComputedStyle({ left: 8, top: 8, width: isRow ? BAR : 24, height: isRow ? 24 : BAR });
      return;
    }

    const isAfterLast = target.index >= children.length;
    const idx = isAfterLast ? children.length - 1 : Math.max(target.index, 0);
    const child = children[idx];

    const next = isRow
      ? {
          left: child.offsetLeft + (isAfterLast ? child.offsetWidth : 0) - BAR / 2,
          top: child.offsetTop,
          bottom: 0,
          width: BAR,
        }
      : {
          top: child.offsetTop + (isAfterLast ? child.offsetHeight : 0) - BAR / 2,
          left: child.offsetLeft,
          right: 0,
          height: BAR,
        };

    setComputedStyle(next);
  }, [flexContainerId, isRow, target]);

  if (!target || !computedStyle) return null;

  return <div data-cy="flex-container-drop-indicator" style={{ ...baseStyle, ...computedStyle }} />;
};

export { FlexContainerDropIndicator };
