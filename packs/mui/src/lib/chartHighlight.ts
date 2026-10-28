import { useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';

/** An item of an x-charts chart, as its highlight takes it: the series and the index in its data. */
export type Pin = { seriesId: string | number; dataIndex?: number };

const HELP = 'Keeps the clicked item highlighted (the rest faded) until Clear clicked point runs or another is clicked.';

/** The props of a highlight, given a pin and the item under the pointer: what x-charts' highlightedItem should be. */
export const highlightProps = (on: boolean, pin: Pin | null, hovered: Pin | null, setHovered: (p: Pin | null) => void) =>
  on
    ? {
        // Controlled while Highlight clicked point is on: the clicked item, else the hovered one (so hovering still
        // highlights before a click). Off, the chart keeps its own highlight, as before.
        highlightedItem: (pin ?? hovered ?? null) as never,
        onHighlightChange: (item: unknown) => setHovered((item as Pin | null) ?? null),
      }
    : {};

/**
 * UI 2.0's Highlight clicked point and Clear clicked point for MUI X charts: the highlightClicked prop, the clicked item
 * (pin), and the clearClickedPoint action, which unpins it and runs `onClear` (to empty the exposed clicked values).
 */
export const useHighlightPin = (onClear: () => void) => {
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: HELP, initialValue: false });
  const [pin, setPin] = useState<Pin | null>(null);
  const [hovered, setHovered] = useState<Pin | null>(null);
  const clear = useRef(onClear);
  clear.current = onClear;
  ToolJet.useAction({ name: 'clearClickedPoint', displayName: 'Clear clicked point' }, () => {
    setPin(null);
    clear.current();
  });
  const on = highlightClicked === true;
  return { on, pin, setPin, props: highlightProps(on, pin, hovered, setHovered) };
};
