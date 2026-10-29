import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { iconFor } from '../lib/icons';
import { formatDate, statusColor, timelineItems } from '../lib/ui2/nav/model';
import type { TimelineItem } from '../lib/ui2/nav/model';
import { isSet, lookVars } from '../lib/ui2/nav/look';
import { useStable } from '../lib/ui2/nav/hooks';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { TimelineSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

const MAX_ITEMS = 500;
// The title's line height, which the marker centres on.
const LINE_HEIGHT = 20;

// UI 2.0 Timeline: an activity feed with dot or icon markers coloured by status, times beside or above the title.
export const Timeline = () => {
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description:
      'Array of { title, description, time, status, color, icon }. status: a word such as done, pending, error or current (coloured by statusColors, else the theme).',
    initialValue: [
      {
        title: 'Order placed',
        description: 'Ada Lovelace placed order #1024',
        time: '09:12',
        status: 'done',
        icon: 'shopping-cart',
      },
      {
        title: 'Payment confirmed',
        description: 'Card ending 4242',
        time: '09:14',
        status: 'done',
        icon: 'credit-card',
      },
      {
        title: 'Packed',
        description: 'Warehouse B is packing the order',
        time: '11:30',
        status: 'current',
        icon: 'package',
      },
      { title: 'Shipped', description: 'Waiting for pickup', time: '', status: 'pending', icon: 'truck' },
    ],
  });
  const [marker] = ToolJet.useStateEnumeration({
    name: 'marker',
    label: 'Marker',
    enumDefinition: ['dot', 'icon'],
    enumLabels: { dot: 'Dot', icon: 'Icon' },
    initialValue: 'dot',
    inspector: 'switch',
  });
  const [density] = ToolJet.useStateEnumeration({
    name: 'density',
    label: 'Density',
    enumDefinition: ['comfortable', 'compact'],
    enumLabels: { comfortable: 'Comfortable', compact: 'Compact' },
    initialValue: 'comfortable',
    inspector: 'switch',
  });
  const [newestFirst] = ToolJet.useStateBoolean({
    name: 'newestFirst',
    label: 'Newest first (reverse)',
    initialValue: false,
  });
  const [timePosition] = ToolJet.useStateEnumeration({
    name: 'timePosition',
    label: 'Time',
    enumDefinition: ['right', 'top'],
    enumLabels: { right: 'Right', top: 'Top' },
    initialValue: 'right',
    inspector: 'switch',
  });
  const [dateFormat] = ToolJet.useStateString({
    name: 'dateFormat',
    label: 'Date format for ISO times (empty: as given)',
    description: 'dayjs tokens, e.g. D MMM, HH:mm.',
    initialValue: '',
  });
  const [statusColors] = ToolJet.useStateObject({
    name: 'statusColors',
    label: 'Colours by status',
    description: '{ "shipped": "#16a34a" }: a status word to a colour.',
    initialValue: {},
  });
  const [, setLastClickedItem] = ToolJet.useStateObject({
    name: 'lastClickedItem',
    initialValue: {},
    inspector: 'hidden',
  });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  // UI 2.0's name only: the pack's earlier onItemClick fired alongside it.
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { disabled } = ToolJet.useControlState();
  const markerColor = useThemeColor('markerColor', 'Marker color (items without status)', TOKEN.brand);
  const lineColor = useThemeColor('lineColor', 'Connecting line color', TOKEN.border);
  const titleColor = useThemeColor('titleColor', 'Title color', TOKEN.text);
  const descriptionColor = useThemeColor('descriptionColor', 'Description color', TOKEN.mutedText);
  const timeColor = useThemeColor('timeColor', 'Time color', TOKEN.mutedText);
  const accent = useThemeColor('accentColor', 'Accent (current items)', TOKEN.brand);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'timeline', fit: true, loading: 'own', defaultWidth: 12, defaultHeight: 36 });

  const source = useStable(rawItems);
  const [shownCount, setShownCount] = useState(MAX_ITEMS);
  const items = useMemo(
    () => timelineItems(source, newestFirst === true, shownCount),
    [source, newestFirst, shownCount]
  );
  const total = Array.isArray(source) ? source.length : 0;
  const compact = density === 'compact';
  const icons = marker === 'icon';
  const size = icons ? (compact ? 24 : 28) : compact ? 8 : 10;
  const markerTop = Math.max(0, (LINE_HEIGHT - size) / 2);
  const contentTop = Math.max(0, (size - LINE_HEIGHT) / 2);
  const column = Math.max(size, 12);
  // The selected item's content (without its key and position), to find it again when the items change.
  const selected = useRef<string | null>(null);
  const contentOf = ({ key, index, ...rest }: TimelineItem) => JSON.stringify(rest); // eslint-disable-line @typescript-eslint/no-unused-vars
  const click = (item: TimelineItem) => {
    if (disabled) return;
    const { key, ...rest } = item; // eslint-disable-line @typescript-eslint/no-unused-vars
    selected.current = contentOf(item);
    setLastClickedItem(rest);
    setSelectedItem(rest);
    onItemClicked();
  };
  const clearSelection = () => {
    selected.current = null;
    setSelectedItem({});
  };
  // A selected item that leaves the data is no longer selected; one that moved is exposed at its new place (team
  // testing, 2026-10-29: selectedItem kept a record the data no longer had).
  useEffect(() => {
    if (selected.current === null) return;
    const now = timelineItems(source).find((item) => contentOf(item) === selected.current);
    if (!now) return clearSelection();
    const { key, ...rest } = now; // eslint-disable-line @typescript-eslint/no-unused-vars
    setSelectedItem(rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => clearSelection());
  const vars = lookVars([
    [markerColor, '--lk-marker'],
    [lineColor, '--lk-line'],
    [titleColor, '--lk-title'],
    [descriptionColor, '--lk-fg'],
    [timeColor, '--lk-time'],
    [accent, '--ui-primary'],
  ]);

  if (!items.length) {
    return (
      <LoadingFrame loading={ld.loading} minHeight={120} look={ld.skeleton ? <TimelineSkel /> : <LoadingBox />}>
        <div className="ui" style={vars}>
          <p className="n2-empty" style={{ textAlign: 'center', padding: '16px 0' }}>
            No activity yet
          </p>
        </div>
      </LoadingFrame>
    );
  }
  return (
    <LoadingFrame loading={ld.loading} minHeight={120} look={ld.skeleton ? <TimelineSkel /> : <LoadingBox />}>
      <div className="ui n2-timeline-wrap" style={vars}>
        <ol className={cn('n2-timeline', compact && 'is-compact')}>
          {items.map((item, index) => {
            const colour =
              (isSet(item.color) ? item.color : statusColor(item.status, statusColors)) ||
              'var(--lk-marker, var(--ui-primary))';
            const Glyph = icons && item.icon ? iconFor(item.icon) : null;
            const time = formatDate(item.time, dateFormat);
            const isLast = index === items.length - 1;
            const timeNode = time ? (
              <span className={cn('n2-timeline-time', timePosition === 'top' && 'is-top')}>{time}</span>
            ) : null;
            return (
              <li
                key={`${item.key}-${index}`}
                className={cn('n2-timeline-item', !disabled && 'is-interactive')}
                style={{ ['--tl-c' as string]: colour }}
                onClick={() => click(item)}
              >
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="n2-timeline-line"
                    style={{ left: column / 2 - 0.5, top: markerTop + size + 4, bottom: 4 - markerTop }}
                  />
                ) : null}
                <div
                  role={disabled ? undefined : 'button'}
                  tabIndex={disabled ? undefined : 0}
                  onKeyDown={(e) => {
                    if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
                    e.preventDefault();
                    click(item);
                  }}
                  className="n2-timeline-row"
                >
                  <span className="n2-timeline-col" style={{ width: column, paddingTop: markerTop }}>
                    {icons ? (
                      <span className="n2-timeline-badge" style={{ width: size, height: size }}>
                        {Glyph ? (
                          <Glyph size={compact ? 12 : 14} strokeWidth={2.25} aria-hidden="true" />
                        ) : (
                          <span className="n2-timeline-badge-dot" />
                        )}
                      </span>
                    ) : (
                      <span className="n2-timeline-dot" style={{ width: size, height: size }} />
                    )}
                  </span>
                  <div className="n2-timeline-content" style={{ paddingTop: contentTop }}>
                    {timePosition === 'top' ? timeNode : null}
                    <div className="n2-timeline-head">
                      <span className="n2-timeline-title">{item.title}</span>
                      {timePosition !== 'top' ? timeNode : null}
                    </div>
                    {item.description ? <p className="n2-timeline-desc">{item.description}</p> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {total > shownCount ? (
          <button type="button" className="n2-show-more" onClick={() => setShownCount((n) => n + MAX_ITEMS)}>
            Show {Math.min(MAX_ITEMS, total - shownCount)} more
          </button>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
