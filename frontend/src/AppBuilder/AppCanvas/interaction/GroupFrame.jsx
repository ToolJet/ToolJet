import React, { Suspense, lazy, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import ConfigHandleButton from '@/_components/ConfigHandleButton';
import { Handles } from './ComponentFrame';
import { componentElement } from './dom';
import { findHighestLevelofSelection } from '../selection';

const MentionComponentInChat = lazy(() => import('../ConfigHandle/MentionComponentInChat'));

/**
 * The frame around several selected components that share a canvas: drawn on that canvas's grid around all of
 * them, with grips to resize them together and a label to drag them by.
 */
export default function GroupFrame({ moduleId }) {
  const selected = useStore((state) => state.selectedComponents, shallow);
  const components = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const layoutKey = useStore((state) => state.currentLayout);
  const canvasUpdater = useStore((state) => state.triggerCanvasUpdater);
  const resizable = useStore(
    (state) =>
      !state.getShouldFreeze(false, false) &&
      !(state.currentLayout === 'mobile' && state.getIsAutoMobileLayout(moduleId))
  );
  const columnWidths = useGridStore((state) => state.subContainerWidths, shallow);
  const [frame, setFrame] = useState(null);

  // The selected components on the topmost selected canvas, as the engine moves them.
  const group = useMemo(
    () =>
      findHighestLevelofSelection(
        selected.filter((id) => components?.[id]).map((id) => ({ ...components[id], id }))
      ).map(({ id }) => id),
    [selected, components]
  );

  useLayoutEffect(() => {
    const root = document.getElementById('main-editor-canvas');
    const members = group
      .map((id) => ({ id, el: root && componentElement(root, id), layout: components[id]?.layouts?.[layoutKey] }))
      .filter((m) => m.el && m.layout);
    if (members.length < 2) {
      setFrame(null);
      return;
    }
    // Measured as drawn (a dynamic-height reflow can draw a component below its saved top).
    const layer = members[0].el.parentElement;
    const origin = layer.getBoundingClientRect();
    const rects = members.map(({ el }) => el.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left)) - origin.left;
    const top = Math.min(...rects.map((r) => r.top)) - origin.top;
    const right = Math.max(...rects.map((r) => r.right)) - origin.left;
    const bottom = Math.max(...rects.map((r) => r.bottom)) - origin.top;
    setFrame({
      layer,
      style: {
        width: `${right - left + 1}px`,
        height: `${bottom - top + 1}px`,
        transform: `translate(${left}px, ${top}px)`,
      },
    });
  }, [group, components, layoutKey, canvasUpdater, columnWidths]);

  if (!frame) return null;
  return createPortal(
    <div className="tj-group-frame" style={frame.style}>
      <div className="tj-group-frame-grip multiple-components-config-handle" id="multiple-components-config-handle">
        <span>
          <ConfigHandleButton className="no-hover">Components</ConfigHandleButton>
          <Suspense fallback={null}>
            <MentionComponentInChat componentIds={selected} currentPageComponents={components} />
          </Suspense>
        </span>
      </div>
      {resizable && <Handles group />}
    </div>,
    frame.layer
  );
}
