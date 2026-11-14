import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// A layout effect in the browser, a plain effect on the server: the pack build renders every component once on the
// server to record its manifest, and a server-side useLayoutEffect makes React render the tree twice (every hook
// recorded twice).
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// React derives onMouseEnter/onPointerEnter from mouseover/pointerover and skips an over event whose relatedTarget is a
// node React manages, counting on the matching out event to have dispatched the enter. Across shadow roots that out
// event never does: the browser retargets its relatedTarget to the other root's host. A menu in the popup layer saw the
// pointer come from the widget's host element (rendered by ToolJet's React), so React dropped the enter, Ant's hover
// Dropdown and Menu submenus closed 0.1 s after the pointer left their trigger, and a trigger entered straight from
// the canvas never opened. An over event coming from outside the root is told it came from outside the page, which
// React does dispatch (an enter on the target and its ancestors).
const OVER_EVENTS = ['mouseover', 'pointerover'] as const;
const crossRootOver = new WeakSet<ShadowRoot>();
export const enterAcrossRoots = (root: ShadowRoot) => {
  if (crossRootOver.has(root)) return;
  crossRootOver.add(root);
  const onOver = (e: Event) => {
    const related = (e as MouseEvent).relatedTarget;
    if (!(related instanceof Node) || root.contains(related)) return;
    // A slotted child of the host (a drop area's widgets) is outside the root too, but the out event React saw there
    // had the real node, so its over is left alone.
    if (related !== root.host && root.host.contains(related)) return;
    // React reads the legacy fromElement too (Chrome sets it on mouseover).
    Object.defineProperty(e, 'relatedTarget', { value: null, configurable: true });
    Object.defineProperty(e, 'fromElement', { value: null, configurable: true });
  };
  // Capture on the root: before React's own listener on the mount and portal containers inside it.
  OVER_EVENTS.forEach((type) => root.addEventListener(type, onOver, true));
};

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
      const overlay =
        (root as ShadowRoot & { tjOverlay?: HTMLElement }).tjOverlay ??
        root.querySelector<HTMLElement>('.tj-cc-overlay') ??
        (root.lastElementChild as HTMLElement);
      enterAcrossRoots(root);
      const layer = overlay?.getRootNode();
      if (layer instanceof ShadowRoot) enterAcrossRoots(layer);
      setContainer(overlay);
    } else {
      setContainer(anchor.ownerDocument.body);
    }
  }, []);

  return [anchorRef, container] as const;
};
