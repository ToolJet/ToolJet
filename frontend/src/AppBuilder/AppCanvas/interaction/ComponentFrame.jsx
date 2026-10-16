import React, { memo } from 'react';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import useTransientStore from '@/AppBuilder/_stores/transientStore';

const EDGES = ['n', 's', 'e', 'w'];
const CORNERS = ['nw', 'ne', 'sw', 'se'];

/** Resize grips: invisible edges centred on the border and four corner squares inside the frame. */
export const Handles = ({ group = false }) => (
  <>
    {EDGES.map((dir) => (
      <div
        key={dir}
        className={`tj-handle tj-handle-edge tj-handle-${dir}`}
        data-tj-handle={dir}
        data-tj-group={group || undefined}
      />
    ))}
    {CORNERS.map((dir) => (
      <div
        key={dir}
        className={`tj-handle tj-handle-corner tj-handle-${dir}`}
        data-tj-handle={dir}
        data-tj-group={group || undefined}
      />
    ))}
  </>
);

/**
 * A component's frame in the editor: one 1px line on its grid cell's boundary lines (shared with neighbours and the
 * canvas edge), shown while it is selected or hovered, with resize grips when it can be resized on its own (not while
 * hidden, on a frozen version, or under mobile auto layout).
 */
const ComponentFrame = memo(({ id, moduleId, canResize = true, isDynamicHeight }) => {
  const selected = useStore((state) => state.selectedComponents.includes(id));
  const onlySelected = useStore((state) => state.selectedComponents.length === 1 && state.selectedComponents[0] === id);
  const hovered = useTransientStore((state) => state.hoveredComponentForGrid === id);
  const resizable = useStore(
    (state) =>
      canResize &&
      !state.getShouldFreeze(false, false) &&
      !(state.currentLayout === 'mobile' && state.getIsAutoMobileLayout(moduleId))
  );
  if (!selected && !hovered) return null;
  const withHandles = resizable && (onlySelected || (hovered && !selected));
  return (
    <div className={cx('tj-frame', { 'is-selected': selected, 'is-dynamic-height': isDynamicHeight })}>
      {withHandles && <Handles />}
    </div>
  );
});

ComponentFrame.displayName = 'ComponentFrame';

export default ComponentFrame;
