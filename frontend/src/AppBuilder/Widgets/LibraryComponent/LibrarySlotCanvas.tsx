import React, { useLayoutEffect, useRef, useState } from 'react';

import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';

const SubContainerComponent = SubContainer as React.ComponentType<any>;

// The corner radius a native Container gives its body canvas by default, so the drag outline matches.
const SLOT_CANVAS_RADIUS = 6;

interface LibrarySlotCanvasProps {
  id: string;
  darkMode: boolean;
}

// The drop area for one ToolJet.Slot of a library component: an ordinary sub-canvas with id
// `<componentId>-<slotName>`, like a Tabs tab. Its size comes from the bundle's layout (the slot it is
// projected into), so the width the grid divides into columns is measured, not derived from the widget.
const LibrarySlotCanvas = ({ id, darkMode }: LibrarySlotCanvasProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // A hidden slot (closed section, inactive tab) measures 0: keep the last real width so the grid
    // doesn't lay its components out at zero width, and lays them out again when it is shown.
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // No frame of its own, like a native Container's body: while dragging, the sub-canvas draws its grid
    // and outline edge to edge, so a border here would sit 1px outside them as a second, offset frame.
    <div ref={ref} className="tw-w-full tw-h-full">
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
    </div>
  );
};

export default LibrarySlotCanvas;
