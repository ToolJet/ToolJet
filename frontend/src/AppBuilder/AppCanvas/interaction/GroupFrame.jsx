import React, { Suspense, lazy, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import ConfigHandleButton from '@/_components/ConfigHandleButton';
import { Handles } from './ComponentFrame';
import { componentElement } from './dom';
import { findHighestLevelofSelection } from '../selection';

const MentionComponentInChat = lazy(() => import('../ConfigHandle/MentionComponentInChat'));

/**
 * Where the frame goes: the box around the members as they are drawn, relative to the layer they are drawn in (the
 * frame is portalled into that same layer). Relative, so scrolling the canvas moves the frame with the members
 * without measuring again.
 */
const measureFrame = (members) => {
  const layer = members[0].el.parentElement;
  const origin = layer.getBoundingClientRect();
  const rects = members.map(({ el }) => el.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left)) - origin.left;
  const top = Math.min(...rects.map((r) => r.top)) - origin.top;
  const right = Math.max(...rects.map((r) => r.right)) - origin.left;
  const bottom = Math.max(...rects.map((r) => r.bottom)) - origin.top;
  return {
    layer,
    key: `${left}:${top}:${right}:${bottom}`,
    style: {
      width: `${right - left + 1}px`,
      height: `${bottom - top + 1}px`,
      transform: `translate(${left}px, ${top}px)`,
    },
  };
};

/**
 * The frame around several selected components that share a canvas: drawn on that canvas's grid around all of
 * them, with grips to resize them together and a label to drag them by.
 *
 * It never goes stale: it is measured when the selection or the page's components change, and again (next frame)
 * whenever a member's box or its layer resizes (ResizeObserver: canvas width, dynamic height, content) or a member's
 * inline style or class changes (MutationObserver: position, size, visibility, any re-render that moves it). Nothing
 * outside has to ask it to re-measure.
 */
export default function GroupFrame({ moduleId }) {
  const selected = useStore((state) => state.selectedComponents, shallow);
  const components = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const layoutKey = useStore((state) => state.currentLayout);
  const resizable = useStore(
    (state) =>
      !state.getShouldFreeze(false, false) &&
      !(state.currentLayout === 'mobile' && state.getIsAutoMobileLayout(moduleId))
  );
  const [frame, setFrame] = useState(null);

  // The selected components on the topmost selected canvas, as the engine moves them.
  const group = useMemo(
    () =>
      findHighestLevelofSelection(
        selected.filter((id) => components?.[id]).map((id) => ({ ...components[id], id }))
      ).map(({ id }) => id),
    [selected, components]
  );

  const findMembers = useCallback(() => {
    const root = document.getElementById('main-editor-canvas');
    return group
      .map((id) => ({ id, el: root && componentElement(root, id), layout: components?.[id]?.layouts?.[layoutKey] }))
      .filter((m) => m.el && m.layout);
  }, [group, components, layoutKey]);

  useLayoutEffect(() => {
    const members = findMembers();
    if (members.length < 2) {
      setFrame(null);
      return undefined;
    }
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (!members.every((m) => m.el.isConnected)) return;
      const next = measureFrame(members);
      setFrame((current) => (current?.key === next.key && current.layer === next.layer ? current : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();

    const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    resizes?.observe(members[0].el.parentElement);
    const mutations = new MutationObserver(schedule);
    for (const { el } of members) {
      resizes?.observe(el);
      mutations.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      resizes?.disconnect();
      mutations.disconnect();
    };
  }, [findMembers]);

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
