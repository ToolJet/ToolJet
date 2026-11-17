---
to: <%= name %>/src/lib/portal.ts
---
import { useEffect, useState } from 'react';

/*
  Where Radix portals (Select, Dialog, Tooltip) should render. The component lives in a ToolJet shadow root, so
  document.body would put the popup outside the stylesheet; the host exposes a popup layer on the shadow root
  (`tjOverlay`) that shares the component's styles and sits above the canvas. Outside ToolJet (tests, storybook) the
  hook returns undefined and Radix falls back to document.body.
*/
export function usePortalContainer(anchor: React.RefObject<HTMLElement | null>): HTMLElement | undefined {
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  useEffect(() => {
    const root = anchor.current?.getRootNode();
    const overlay = root && 'tjOverlay' in root ? (root as ShadowRoot & { tjOverlay?: HTMLElement }).tjOverlay : undefined;
    if (overlay) {
      overlay.classList.add('app-root', 'app-popups');
      setContainer(overlay);
    }
  }, [anchor]);
  return container;
}
