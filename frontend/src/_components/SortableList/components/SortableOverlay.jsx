import React from 'react';
import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

export function SortableOverlay({ children }) {
  // dnd-kit's default overlay z-index (999) paints behind the fixed editor
  // sidebar (z-index 1041) — same fix as _ui/SortableTree/SortableTree.jsx.
  return (
    <DragOverlay dropAnimation={dropAnimationConfig} style={{ zIndex: 10000 }}>
      {children}
    </DragOverlay>
  );
}
