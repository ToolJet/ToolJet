import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import { appVersionService } from '@/_services';
import { typeLabel } from './ChangeList';

// Draws a page from its layout boxes alone, without running anything: used
// for the state before an AI turn (a snapshot cannot be rendered by the
// viewer) and for "Layout only", which compares versions without running
// their queries. Desktop boxes keep left and width in 1/43 of the parent
// canvas and top and height in pixels; flex containers lay their children out
// in child order. It is an outline of the page, not a picture of it.

const GRID = 43;
const PAD = 8;
const GAP = 8;
// Overlays (modals, dialogs, sheets, drawers, popovers) are not part of the page at rest.
const MODAL_TYPES = /(Modal|Dialog|Sheet|Drawer|Popover)/i;
const CONTAINER_TYPES = /(Container|Form|Tabs|Listview|ListView|Modal|Card|Kanban|Calendar)/;

const boxOf = (component, viewport) => component.layouts?.[viewport] ?? component.layouts?.desktop ?? null;

function layoutPage(components, viewport, width) {
  const byName = new Map(components.map((component) => [component.name, component]));
  const resolveParent = (parent) => {
    if (!parent) return { name: null, slot: null };
    if (byName.has(parent)) return { name: parent, slot: null };
    // Slotted parents are "<name>-<slot>" (a tab id, -header, -footer).
    const cut = parent.lastIndexOf('-');
    if (cut > 0 && byName.has(parent.slice(0, cut))) return { name: parent.slice(0, cut), slot: parent.slice(cut + 1) };
    // Ids of parents that no longer exist, or the canvas header/footer.
    return { name: null, slot: parent };
  };

  const children = new Map();
  for (const component of components) {
    const { name, slot } = resolveParent(component.parent);
    const key = name ?? '__page__';
    if (!children.has(key)) children.set(key, []);
    children.get(key).push({ component, slot });
  }

  const placed = [];
  const place = (parentName, rect, depth) => {
    let list = children.get(parentName ?? '__page__') ?? [];
    const parent = parentName ? byName.get(parentName) : null;
    if (parent && MODAL_TYPES.test(parent.type)) return;
    // Tabs and other slotted parents show one slot at a time; draw the first.
    const slots = [...new Set(list.map((item) => item.slot).filter(Boolean))];
    if (slots.length > 1 && !/header|footer/.test(slots[0]))
      list = list.filter((item) => item.slot === slots[0] || !item.slot);

    const inner = parent
      ? { x: rect.x + PAD, y: rect.y + (parent.label ? 28 : PAD), w: Math.max(rect.w - PAD * 2, 1) }
      : rect;

    if (parent?.flex) {
      const order = parent.flex.childOrder ?? [];
      const sorted = [...list]
        .filter(({ component }) => boxOf(component, viewport) && !MODAL_TYPES.test(component.type))
        .sort(
          (a, b) =>
            (order.indexOf(a.component.name) + 1 || 1e6) - (order.indexOf(b.component.name) + 1 || 1e6) ||
            (boxOf(a.component, viewport)?.left ?? 0) - (boxOf(b.component, viewport)?.left ?? 0)
        );
      const column = /column|vertical/i.test(String(parent.flex.direction));
      let y = inner.y;
      if (column) {
        // A column stacks its children at full width; each child grows to fit its own children.
        for (const { component } of sorted) {
          const box = boxOf(component, viewport);
          const r = { x: inner.x, y, w: inner.w, h: box.height };
          placed.push({ component, rect: r, depth });
          place(component.name, r, depth + 1);
          y += r.h + GAP;
        }
      } else {
        // A row gives fixed children their width and shares what is left among fill children.
        const fixedWidth = (box) => box.widthPx ?? (box.fillWidth || box.grow ? null : (box.width / GRID) * inner.w);
        const widths = sorted.map(({ component }) => fixedWidth(boxOf(component, viewport)));
        const fillCount = widths.filter((w) => w == null).length;
        const used = widths.reduce((sum, w) => sum + (w ?? 0), 0) + GAP * Math.max(sorted.length - 1, 0);
        const share = fillCount ? Math.max((inner.w - used) / fillCount, 40) : 0;
        let x = inner.x;
        let rowHeight = 0;
        sorted.forEach(({ component }, index) => {
          const box = boxOf(component, viewport);
          const r = { x, y, w: Math.min(widths[index] ?? share, inner.w), h: box.height };
          placed.push({ component, rect: r, depth });
          place(component.name, r, depth + 1);
          x += r.w + GAP;
          rowHeight = Math.max(rowHeight, r.h);
        });
        y += rowHeight + GAP;
      }
      // Flex containers size to their content (dynamic height).
      if (rect.h != null) rect.h = Math.max(rect.h, y - rect.y - GAP + PAD);
      return;
    }

    for (const { component } of list) {
      const box = boxOf(component, viewport);
      if (!box || MODAL_TYPES.test(component.type)) continue;
      const unit = inner.w / GRID;
      const r = {
        x: inner.x + box.left * unit,
        y: inner.y + box.top,
        w: box.widthPx ?? Math.max(box.width * unit, 12),
        h: box.height,
      };
      placed.push({ component, rect: r, depth });
      place(component.name, r, depth + 1);
    }
  };

  place(null, { x: 0, y: 0, w: width }, 0);
  const height = placed.reduce((max, item) => Math.max(max, item.rect.y + item.rect.h), 0) + 40;
  return { placed, height };
}

export const BlueprintFrame = ({
  appId,
  source,
  pageKey,
  viewport,
  highlights,
  selectedKey,
  hoveredKey,
  onSelect,
  onHover,
  onFound,
  note,
}) => {
  const wrapRef = useRef(null);
  const scrollRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState(null);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    setError(null);
    appVersionService
      .getLayout(appId, source, pageKey)
      .then((result) => !cancelled && setLayout(result))
      .catch((err) => !cancelled && setError(err?.error ?? 'The layout could not be loaded'));
    return () => {
      cancelled = true;
    };
  }, [appId, source?.versionId, source?.snapshotId, pageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const logicalWidth = viewport === 'mobile' ? 390 : Math.max(1280, Math.floor(size.width));
  const scale = size.width ? Math.min(1, (size.width - (viewport === 'mobile' ? 24 : 0)) / logicalWidth) : 1;
  const drawn = useMemo(
    () => (layout ? layoutPage(layout.components, viewport, logicalWidth) : null),
    [layout, viewport, logicalWidth]
  );
  const statusByKey = useMemo(() => new Map(highlights.map((item) => [item.key, item])), [highlights]);

  useEffect(() => {
    if (!drawn) return;
    const found = new Set(drawn.placed.map((item) => item.component.key).filter((key) => statusByKey.has(key)));
    onFound?.(found);
  }, [drawn, statusByKey, onFound]);

  useEffect(() => {
    if (!selectedKey || !drawn || !scrollRef.current) return;
    const item = drawn.placed.find((entry) => entry.component.key === selectedKey);
    if (item) scrollRef.current.scrollTo({ top: Math.max(0, item.rect.y * scale - 120), behavior: 'smooth' });
  }, [selectedKey, drawn, scale]);

  return (
    <div ref={wrapRef} className={cx('vd-frame vd-frame--ready vd-bp', { 'vd-bp--mobile': viewport === 'mobile' })}>
      {note && <span className="vd-bp__note">{note}</span>}
      {error && <div className="vd-frame__loading">{String(error)}</div>}
      {!drawn && !error && (
        <div className="vd-frame__loading">
          <span className="vd-frame__shimmer" />
          <span>Drawing the layout</span>
        </div>
      )}
      {drawn && (
        <div ref={scrollRef} className="vd-bp__scroll vd-scroll" onMouseLeave={() => onHover?.(null)}>
          <div
            className="vd-bp__canvas"
            style={{
              width: logicalWidth,
              height: drawn.height,
              transform: `scale(${scale})`,
              marginLeft: viewport === 'mobile' ? Math.max(0, (size.width - logicalWidth * scale) / 2) : 0,
              marginBottom: drawn.height * (scale - 1),
            }}
          >
            {drawn.placed.map(({ component, rect, depth }) => {
              const highlight = statusByKey.get(component.key);
              const isContainer = CONTAINER_TYPES.test(component.type) || !!component.flex;
              return (
                <div
                  key={component.key}
                  className={cx('vd-bp__box', {
                    'vd-bp__box--container': isContainer,
                    'vd-bp__box--hidden': component.hidden,
                  })}
                  style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: depth + 1 }}
                  data-vd={highlight?.status}
                  data-vd-weak={highlight?.weak ? '' : undefined}
                  data-vd-selected={highlight && component.key === selectedKey ? '' : undefined}
                  data-vd-hover={highlight && component.key === hoveredKey ? '' : undefined}
                  data-vd-name={component.name}
                  onMouseMove={(event) => {
                    event.stopPropagation();
                    onHover?.(highlight ? component.key : null, { x: event.clientX, y: event.clientY });
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect?.(highlight ? component.key : null);
                  }}
                >
                  <span className="vd-bp__name">
                    {component.name}
                    <em>{typeLabel(component.type)}</em>
                  </span>
                  {!isContainer && component.label && <span className="vd-bp__label">{component.label}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlueprintFrame;
