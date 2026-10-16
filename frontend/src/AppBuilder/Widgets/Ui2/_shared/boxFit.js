// shadcn/ui pack: whether a widget's box was sized for it. A grid-placed widget, or a fixed-width child of a flex
// container, sits in a box the author (or the model) sized on purpose, so a content-sized control such as a button
// fills it, the way ToolJet's own Button does: a Refresh button at the end of a row then ends where the row ends. A
// fill child of a flex container gets a share of the line instead, so there the control keeps its own width.
import { useLayoutEffect, useState } from 'react';

/** True for a grid box or a fixed-width flex child; false for a flex fill child (a row share, or a full-width column
 *  child). Reads the flex wrapper's inline sizing (useFlexWidgetLayout): fill children grow in a row and are 100%
 *  wide in a column. */
export const isSizedBox = (element) => {
  const wrapper = element?.closest?.('.flex-child-wrapper');
  if (!wrapper) return true;
  const { flexGrow, width } = wrapper.style;
  return flexGrow === '0' && width !== '100%';
};

/** isSizedBox for the element behind ref, kept current after each render (layout changes re-render the widget). */
export const useSizedBox = (ref) => {
  const [sized, setSized] = useState(false);
  useLayoutEffect(() => {
    const next = isSizedBox(ref.current);
    setSized((current) => (current === next ? current : next));
  });
  return sized;
};
