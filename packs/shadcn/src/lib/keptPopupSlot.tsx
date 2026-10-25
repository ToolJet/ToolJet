import React from 'react';
import { createPortal } from 'react-dom';
import { ToolJet } from '@tooljet/custom-component-sdk';

// A popup's drop area whose components outlive the popup (BN-01). ToolJet.PopupSlot registers its canvas while it is
// mounted and releases it on unmount, which unmounts the components dropped in it: a Radix Dialog unmounts its
// content on close, so a closed and reopened dialog lost the draft typed in its body (Ant's forceRender and MUI's
// keepMounted keep theirs). Keeping Radix's content mounted instead would keep its focus trap, scroll lock and
// aria-hidden on the page, so the slot lives in a node of its own, mounted for the widget's life: `place` moves that
// node into the popup while it is open, and out of the page when the popup unmounts. Out of the page the <slot>
// assigns nothing, so the components stay mounted in the host's light DOM but are not drawn, focusable or announced.
export const useKeptPopupSlot = (
  name: string,
  { enabled = true, style }: { enabled?: boolean; style?: React.CSSProperties } = {}
): [keeper: React.ReactNode, place: React.ReactNode] => {
  const [home] = React.useState(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.style.display = 'contents';
    return el;
  });
  const placeRef = React.useCallback(
    (spot: HTMLDivElement | null) => {
      if (!home) return;
      if (spot) spot.appendChild(home);
      else home.remove();
    },
    [home]
  );
  if (!enabled || !home) return [null, null];
  return [
    createPortal(<ToolJet.PopupSlot name={name} style={style} />, home),
    <div ref={placeRef} style={{ display: 'contents' }} />,
  ];
};
