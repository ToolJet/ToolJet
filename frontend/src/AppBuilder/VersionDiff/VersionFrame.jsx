import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import cx from 'classnames';

// Renders one version of one page through the real viewer in a same-origin
// iframe, then marks changed components in place. Every widget in the viewer
// is wrapped in `.ele-<componentId>`, so outlines follow the real render:
// nested containers, flex rows, bindings and dynamic heights included.

const FRAME_CSS = `
  .viewer .header:has(.preview-chip) { display: none !important; }
  [data-vd] { --vd-c: #e08a00; }
  [data-vd="added"] { --vd-c: #12a150; }
  [data-vd="removed"] { --vd-c: #e5484d; }
  [data-vd]::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2147483000;
    border: 2px solid var(--vd-c); border-radius: 6px;
    background: color-mix(in srgb, var(--vd-c) 6%, transparent);
    transition: box-shadow 160ms ease, border-width 160ms ease, background 160ms ease;
  }
  [data-vd="removed"]::after {
    border-style: dashed;
    background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--vd-c) 12%, transparent) 0 5px, transparent 5px 11px);
  }
  [data-vd-weak]::after { border-width: 1.5px; border-style: dashed; background: none; }
  [data-vd-hover]::after { background: color-mix(in srgb, var(--vd-c) 12%, transparent); }
  [data-vd-selected]::after {
    border-width: 3px;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--vd-c) 28%, transparent);
    animation: vd-ping 1.4s cubic-bezier(.2,.7,.3,1) 2;
  }
  [data-vd-selected]::before {
    content: attr(data-vd-name); position: absolute; left: 0; top: 0; z-index: 2147483001;
    background: var(--vd-c); color: #fff; font: 600 11px/1 Inter, system-ui, sans-serif;
    padding: 4px 7px 5px; border-radius: 5px 0 6px 0; white-space: nowrap; pointer-events: none;
  }
  @keyframes vd-ping {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--vd-c) 55%, transparent); }
    100% { box-shadow: 0 0 0 14px color-mix(in srgb, var(--vd-c) 0%, transparent); }
  }
  @media (prefers-reduced-motion: reduce) { [data-vd-selected]::after { animation: none; } }
  * { cursor: default !important; }
  [data-vd] { cursor: pointer !important; }
`;

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
  className,
}) => {
  const wrapRef = useRef(null);
  const iframeRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);
  const [settled, setSettled] = useState(false);
  const applyingScroll = useRef(false);
  const callbacks = useRef({});
  callbacks.current = { onSelect, onHover, onFound, onScrollChange };

  const logicalWidth = viewport === 'mobile' ? 390 : 1280;
  const PHONE_HEIGHT = 844;
  // Desktop fits the width; a phone fits whichever side runs out first.
  const scale = !size.width
    ? 1
    : viewport === 'mobile'
    ? Math.min(1, (size.width - 24) / logicalWidth, (size.height - 28) / PHONE_HEIGHT)
    : Math.min(1, size.width / logicalWidth);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoaded(false);
    setSettled(false);
  }, [src]);

  const doc = useCallback(() => {
    try {
      return iframeRef.current?.contentDocument ?? null;
    } catch {
      return null;
    }
  }, []);

  // Widgets mount lazily and re-mount as queries resolve, so marking runs on
  // a short interval rather than once.
  const mark = useCallback(() => {
    const d = doc();
    if (!d?.body) return;
    if (!d.getElementById('vd-style')) {
      const style = d.createElement('style');
      style.id = 'vd-style';
      style.textContent = FRAME_CSS;
      d.head.appendChild(style);
    }
    const found = new Set();
    for (const highlight of highlights) {
      if (!highlight.id) continue;
      const elements = d.querySelectorAll(`.ele-${CSS.escape(highlight.id)}`);
      elements.forEach((element) => {
        if (element.getAttribute('data-vd') !== highlight.status) element.setAttribute('data-vd', highlight.status);
        element.setAttribute('data-vd-key', highlight.key);
        element.setAttribute('data-vd-name', highlight.name);
        if (highlight.weak !== element.hasAttribute('data-vd-weak'))
          highlight.weak ? element.setAttribute('data-vd-weak', '') : element.removeAttribute('data-vd-weak');
        if (d.defaultView.getComputedStyle(element).position === 'static') element.style.position = 'relative';
        const isSelected = highlight.key === selectedKey;
        if (isSelected !== element.hasAttribute('data-vd-selected'))
          isSelected ? element.setAttribute('data-vd-selected', '') : element.removeAttribute('data-vd-selected');
        const isHovered = highlight.key === hoveredKey;
        if (isHovered !== element.hasAttribute('data-vd-hover'))
          isHovered ? element.setAttribute('data-vd-hover', '') : element.removeAttribute('data-vd-hover');
      });
      if (elements.length) found.add(highlight.key);
    }
    callbacks.current.onFound?.(found);
    if (d.querySelector(PAGE_SCROLLER) || d.querySelector('[class*="ele-"]')) setSettled(true);
  }, [doc, highlights, selectedKey, hoveredKey]);

  useEffect(() => {
    if (!loaded) return;
    mark();
    const timer = setInterval(mark, 700);
    return () => clearInterval(timer);
  }, [loaded, mark]);

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
    const events = ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'submit', 'dragstart'];
    events.forEach((name) => d.addEventListener(name, block, true));
    d.addEventListener('click', click, true);
    d.addEventListener('mousemove', move, true);
    d.addEventListener('mouseleave', leave, true);
    d.addEventListener('scroll', scroll, true);
    return () => {
      events.forEach((name) => d.removeEventListener(name, block, true));
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
      {src && size.width > 0 && (
        <iframe
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
          onLoad={() => setLoaded(true)}
        />
      )}
      {!settled && (
        <div className="vd-frame__loading" aria-live="polite">
          <span className="vd-frame__shimmer" />
          <span>Rendering this version</span>
        </div>
      )}
    </div>
  );
};

export default VersionFrame;
