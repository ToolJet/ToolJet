import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// A layout effect in the browser, a plain effect on the server: the pack build renders every component once on the
// server to record its manifest, and a server-side useLayoutEffect makes React render the tree twice (every hook
// recorded twice).
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Where antd popups (select lists, pickers, modals) should portal to. Inline in ToolJet the component
// lives in a shadow root whose CSS does not reach document.body, so the runtime provides a popup layer
// (its own shadow root on the page, with this library's CSS) as `shadowRoot.tjOverlay`. In the
// sandboxed iframe it is that iframe's own body.
// Render a portal only once the container is known: antd falls back to document.body when it is null.
export const usePortalContainer = <T extends HTMLElement = HTMLDivElement>() => {
  const anchorRef = useRef<T>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const root = anchor.getRootNode();
    if (root instanceof ShadowRoot) {
      const overlay = (root as ShadowRoot & { tjOverlay?: HTMLElement }).tjOverlay;
      setContainer(overlay ?? root.querySelector<HTMLElement>('.tj-cc-overlay') ?? (root.lastElementChild as HTMLElement));
    } else {
      setContainer(anchor.ownerDocument.body);
    }
  }, []);

  return [anchorRef, container] as const;
};
