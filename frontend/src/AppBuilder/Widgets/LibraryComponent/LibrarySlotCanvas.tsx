import React, { useLayoutEffect, useRef, useState } from 'react';

import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';

const SubContainerComponent = SubContainer as React.ComponentType<any>;

interface LibrarySlotCanvasProps {
  id: string;
  darkMode: boolean;
  isEditMode: boolean;
}

// The drop area for one ToolJet.Slot of a library component: an ordinary sub-canvas with id
// `<componentId>-<slotName>`, like a Tabs tab. Its size comes from the bundle's layout (the slot it is
// projected into), so the width the grid divides into columns is measured, not derived from the widget.
const LibrarySlotCanvas = ({ id, darkMode, isEditMode }: LibrarySlotCanvasProps) => {
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
    <div
      ref={ref}
      className={
        isEditMode ? 'tw-w-full tw-h-full tw-border tw-border-dashed tw-border-border-default' : 'tw-w-full tw-h-full'
      }
    >
      {width !== undefined && (
        <SubContainerComponent
          id={id}
          canvasWidth={width}
          allowContainerSelect={true}
          styles={{ overflow: 'hidden auto' }}
          darkMode={darkMode}
          componentType="LibraryComponent"
        />
      )}
    </div>
  );
};

export default LibrarySlotCanvas;
