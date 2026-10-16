import React, { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { markFrame, markState } from './frameMarks';
import { useElementSize } from '@/_hooks/useElementSize';

// Renders one version of one page through the real viewer in a same-origin
// iframe, then marks changed components in place. Every widget in the viewer
// is wrapped in `.ele-<componentId>`, so outlines follow the real render:
// nested containers, flex rows, bindings and dynamic heights included.

// Outlines drawn inside the viewer. The colours are the editor's status tokens,
// read from the dialog (the viewer document has its own theme).
const frameCss = (colors) => `
  .viewer .header:has(.preview-chip) { display: none !important; }
  [data-vd] { --vd-c: ${colors.changed}; }
  [data-vd="added"] { --vd-c: ${colors.added}; }
  [data-vd="removed"] { --vd-c: ${colors.removed}; }
  [data-vd]::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2147483000;
    border: 1.5px solid var(--vd-c); border-radius: 4px;
    transition: box-shadow 120ms ease, background 120ms ease;
  }
  [data-vd="removed"]::after { border-style: dashed; }
  [data-vd-weak]::after { border-width: 1px; border-style: dashed; }
  [data-vd-hover]::after { background: color-mix(in srgb, var(--vd-c) 8%, transparent); }
  [data-vd-selected]::after {
    border-width: 2px;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-c) 22%, transparent);
  }
  [data-vd-selected]::before {
    content: attr(data-vd-name); position: absolute; left: -1px; top: -20px; z-index: 2147483001;
    background: var(--vd-c); color: #fff; font: 500 11px/18px Inter, system-ui, sans-serif;
    padding: 0 6px; border-radius: 4px; white-space: nowrap; pointer-events: none;
  }
  * { cursor: default !important; }
  [data-vd] { cursor: pointer !important; }
`;

const statusColors = (element) => {
  const style = element ? getComputedStyle(element) : null;
  const read = (name, fallback) => style?.getPropertyValue(name).trim() || fallback;
  return {
    added: read('--icon-success', '#1e823b'),
    changed: read('--icon-warning', '#bf4f03'),
    removed: read('--icon-danger', '#d72d39'),
  };
};

const PAGE_SCROLLER = '[class*="_tooljet-page-"]';

export const VersionFrame = ({
  src,
  viewport,
  highlights,
  selectedKey,
  hoveredKey,
  onSelect,
  onHover,
  onFound,
  syncScroll,
  onScrollChange,
  onEscape,
  onSettled,
  hold = false,
  className,
}) => {
  const wrapRef = useRef(null);
  const size = useElementSize(wrapRef);
  const iframeRef = useRef(null);
  // Counts documents loaded into the frame: the viewer can reload itself, and each new
  // document needs the read-only listeners again.
  const [loaded, setLoaded] = useState(0);
  const [settled, setSettled] = useState(false);
  const applyingScroll = useRef(false);
  const callbacks = useRef({});
  callbacks.current = { onSelect, onHover, onFound, onScrollChange, onEscape, onSettled };
  // A held frame waits to start loading; once started, it keeps its document even if held again.
  const frameKey = `${src}|${viewport}`;
  const [startedKey, setStartedKey] = useState(hold ? null : frameKey);
  const started = !hold || startedKey === frameKey;

  // Desktop renders at least 1280 wide, and at the frame's own width when it is wider.
  const logicalWidth = viewport === 'mobile' ? 390 : Math.max(1280, Math.floor(size.width));
  const PHONE_HEIGHT = 844;
  // Desktop fits the width; a phone fits whichever side runs out first.
  const scale = !size.width
    ? 1
    : viewport === 'mobile'
    ? Math.min(1, (size.width - 24) / logicalWidth, (size.height - 28) / PHONE_HEIGHT)
    : Math.min(1, size.width / logicalWidth);

  // The viewer picks its desktop or mobile layout once, when it loads, so a
  // change of screen size reloads the frame (the iframe is keyed by it).
  useEffect(() => {
    setLoaded(0);
    setSettled(false);
  }, [src, viewport]);

  useEffect(() => {
    if (!hold) setStartedKey(frameKey);
  }, [hold, frameKey]);

  useEffect(() => {
    if (settled) callbacks.current.onSettled?.();
  }, [settled]);

  const doc = useCallback(() => {
    try {
      return iframeRef.current?.contentDocument ?? null;
    } catch {
      return null;
    }
  }, []);

  // Hover and selection change often (every widget the pointer crosses): they live in a ref, so a
  // change moves two attributes (markState) instead of restarting the frame's marking.
  const stateRef = useRef({ selectedKey, hoveredKey });
  stateRef.current = { selectedKey, hoveredKey };

  const mark = useCallback(() => {
    const d = doc();
    if (!d?.body) return;
    if (!d.getElementById('vd-style')) {
      const style = d.createElement('style');
      style.id = 'vd-style';
      style.textContent = frameCss(statusColors(wrapRef.current));
      d.head.appendChild(style);
    }
    callbacks.current.onFound?.(markFrame(d, highlights, stateRef.current));
    if (d.querySelector(PAGE_SCROLLER) || d.querySelector('[class*="ele-"]')) setSettled(true);
  }, [doc, highlights]);

  useEffect(() => {
    const d = doc();
    if (loaded && d?.body) markState(d, selectedKey, hoveredKey);
  }, [loaded, doc, selectedKey, hoveredKey]);

  // Widgets mount lazily and re-mount as queries resolve, so marking follows the
  // frame's DOM: it re-runs (at most every 150 ms) only when elements are added or
  // removed, plus a slow sweep for anything that slips past. An idle frame costs nothing.
  useEffect(() => {
    if (!loaded) return;
    mark();
    const d = doc();
    let pending = null;
    const schedule = () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        mark();
      }, 150);
    };
    const observer = d?.body ? new MutationObserver(schedule) : null;
    observer?.observe(d.body, { childList: true, subtree: true });
    const sweep = setInterval(mark, 5000);
    return () => {
      observer?.disconnect();
      clearTimeout(pending);
      clearInterval(sweep);
    };
  }, [loaded, mark, doc]);

  // Bring the selected component into view inside the frame.
  useEffect(() => {
    if (!loaded || !selectedKey) return;
    const d = doc();
    const element = d?.querySelector(`[data-vd-key="${CSS.escape(selectedKey)}"]`);
    element?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, [loaded, selectedKey, doc, settled]);

  // The compare view is read-only: clicks select, they never reach the app.
  useEffect(() => {
    if (!loaded) return;
    const d = doc();
    if (!d) return;
    const block = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const click = (event) => {
      block(event);
      const target = event.target.closest?.('[data-vd-key]');
      callbacks.current.onSelect?.(target ? target.getAttribute('data-vd-key') : null);
    };
    const move = (event) => {
      const target = event.target.closest?.('[data-vd-key]');
      const rect = iframeRef.current.getBoundingClientRect();
      callbacks.current.onHover?.(target ? target.getAttribute('data-vd-key') : null, {
        x: rect.left + event.clientX * scale,
        y: rect.top + event.clientY * scale,
      });
    };
    const leave = () => callbacks.current.onHover?.(null);
    const scroll = (event) => {
      const target = event.target;
      if (applyingScroll.current || !target?.matches?.(PAGE_SCROLLER)) return;
      callbacks.current.onScrollChange?.({ top: target.scrollTop, left: target.scrollLeft });
    };
    // Nothing reaches the app: no clicks, no typing into its fields, no form submits.
    const events = [
      'mousedown',
      'mouseup',
      'pointerdown',
      'pointerup',
      'dblclick',
      'submit',
      'dragstart',
      'keyup',
      'keypress',
      'beforeinput',
      'input',
      'change',
    ];
    const key = (event) => {
      block(event);
      // Focus can land in the frame; Escape still closes the compare view.
      if (event.key === 'Escape') callbacks.current.onEscape?.();
    };
    events.forEach((name) => d.addEventListener(name, block, true));
    d.addEventListener('keydown', key, true);
    d.addEventListener('click', click, true);
    d.addEventListener('mousemove', move, true);
    d.addEventListener('mouseleave', leave, true);
    d.addEventListener('scroll', scroll, true);
    return () => {
      events.forEach((name) => d.removeEventListener(name, block, true));
      d.removeEventListener('keydown', key, true);
      d.removeEventListener('click', click, true);
      d.removeEventListener('mousemove', move, true);
      d.removeEventListener('mouseleave', leave, true);
      d.removeEventListener('scroll', scroll, true);
    };
  }, [loaded, doc, scale]);

  useEffect(() => {
    if (!loaded || !syncScroll) return;
    const scroller = doc()?.querySelector(PAGE_SCROLLER);
    if (!scroller || (scroller.scrollTop === syncScroll.top && scroller.scrollLeft === syncScroll.left)) return;
    applyingScroll.current = true;
    scroller.scrollTo({ top: syncScroll.top, left: syncScroll.left });
    requestAnimationFrame(() => (applyingScroll.current = false));
  }, [syncScroll, loaded, doc]);

  const frameHeight = size.height ? size.height / scale : 0;
  const isMobile = viewport === 'mobile';

  return (
    <div
      ref={wrapRef}
      className={cx('vd-frame', { 'vd-frame--mobile': isMobile, 'vd-frame--ready': settled }, className)}
    >
      {src && size.width > 0 && started && (
        <iframe
          key={viewport}
          ref={iframeRef}
          title="Version preview"
          src={src}
          className="vd-frame__iframe"
          style={{
            width: logicalWidth,
            height: isMobile ? PHONE_HEIGHT : frameHeight,
            transform: `scale(${scale})`,
            left: isMobile ? Math.max(0, (size.width - logicalWidth * scale) / 2) : 0,
          }}
          onLoad={() => setLoaded((n) => n + 1)}
        />
      )}
      {!settled && (
        <div className="vd-frame__loading" aria-live="polite">
          <span className="vd-frame__shimmer" />
          <span>{started ? 'Rendering this version' : 'Renders after the other version'}</span>
        </div>
      )}
    </div>
  );
};

export default VersionFrame;
