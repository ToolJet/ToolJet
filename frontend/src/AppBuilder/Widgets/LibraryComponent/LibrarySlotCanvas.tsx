import React, { RefObject, useEffect, useRef, useState } from 'react';
import { useDragLayer } from 'react-dnd';

import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { useMeasuredWidth } from './useMeasuredWidth';

const SubContainerComponent = SubContainer as React.ComponentType<any>;

// The corner radius a native Container gives its body canvas by default, so the drag outline matches.
const SLOT_CANVAS_RADIUS = 6;

// The editor's landing box: a drop from the Components panel, or a move of a widget already on the canvas.
const LANDING_BOX_IDS = ['moveable-virtual-ghost-element', 'moveable-ghost-widget'];

interface LibrarySlotCanvasProps {
  id: string;
  darkMode: boolean;
}

type Box = { left: number; top: number; width: number; height: number };

const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height);

// The editor draws the landing box in the main canvas, which a pack popup (a Rocket Dialog) covers, so a drop area
// in the popup layer draws a copy of it over itself while a drag is on.
const usePopupLandingBox = (ref: RefObject<HTMLDivElement>): Box | null => {
  const panelDrag = useDragLayer((monitor) => monitor.isDragging());
  const canvasDrag = useStore((state: { draggingComponentId?: string | null }) => !!state.draggingComponentId);
  const [box, setBox] = useState<Box | null>(null);
  const dragging = panelDrag || canvasDrag;

  useEffect(() => {
    const area = ref.current;
    if (!dragging || !area?.closest('.tj-cc-popup-host')) {
      setBox(null);
      return;
    }
    let frame = 0;
    const follow = () => {
      const landing = LANDING_BOX_IDS.map((boxId) => document.getElementById(boxId)).find(Boolean);
      const at = landing?.getBoundingClientRect();
      const own = area.getBoundingClientRect();
      const over =
        !!at &&
        at.width > 0 &&
        at.left < own.right &&
        at.right > own.left &&
        at.top < own.bottom &&
        at.bottom > own.top;
      const next = over
        ? { left: at.left - own.left, top: at.top - own.top, width: at.width, height: at.height }
        : null;
      setBox((prev) => (sameBox(prev, next) ? prev : next));
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [dragging, ref]);

  return box;
};

// The drop area for one ToolJet.Slot of a library component: an ordinary sub-canvas with id
// `<componentId>-<slotName>`, like a Tabs tab. Its size comes from the bundle's layout (the slot it is
// projected into), so the width the grid divides into columns is measured, not derived from the widget.
const LibrarySlotCanvas = ({ id, darkMode }: LibrarySlotCanvasProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const width = useMeasuredWidth(ref);
  const landingBox = usePopupLandingBox(ref);

  return (
    // No frame of its own, like a native Container's body: while dragging, the sub-canvas draws its grid
    // and outline edge to edge, so a border here would sit 1px outside them as a second, offset frame.
    <div ref={ref} className="tw-w-full tw-h-full tw-relative">
      {width !== undefined && (
        <SubContainerComponent
          id={id}
          canvasWidth={width}
          allowContainerSelect={true}
          styles={{ overflow: 'hidden auto', borderRadius: `${SLOT_CANVAS_RADIUS}px` }}
          darkMode={darkMode}
          componentType="LibraryComponent"
        />
      )}
      {landingBox && (
        <div
          data-cy="popup-drop-ghost"
          className="tw-absolute tw-pointer-events-none tw-box-border"
          style={{
            ...landingBox,
            left: `${landingBox.left}px`,
            top: `${landingBox.top}px`,
            width: `${landingBox.width}px`,
            height: `${landingBox.height}px`,
            zIndex: 1,
            opacity: 0.7,
            background: 'var(--interactive-selected)',
            border: '1px solid var(--border-accent-strong)',
          }}
        />
      )}
    </div>
  );
};

export default LibrarySlotCanvas;
