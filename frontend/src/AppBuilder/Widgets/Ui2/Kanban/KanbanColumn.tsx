import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Badge, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { KanbanCard, SECONDARY_TEXT } from './KanbanCard';
import type { KanbanLook } from './KanbanCard';
import type { BoardCard, BoardColumn } from './kanbanBoard';
import { ShowMore } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { isComposing, isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// Column title and count colours: the columnTitleColor and count styles, else the theme's.
const COLUMN_TITLE = 'tw-text-[color:var(--kb-col-title,var(--sc-foreground))]';
const COUNT_BADGE =
  'tw-bg-[color:var(--kb-count-bg,var(--sc-accent-soft))] tw-text-[color:var(--kb-count-fg,var(--sc-primary-ink))]';

// A board draws this many cards a column at first, then this many more per "Show more" click (10k cards froze the
// page); the board draws MAX_BOARD_COLUMNS columns at a time the same way (a 10k-item list bound as the columns).
const CARDS_PER_STEP = 100;
export const MAX_BOARD_COLUMNS = 50;

const BOTTOM_FADE = {
  maskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent)',
};

interface KanbanColumnProps {
  column: BoardColumn;
  renderBody: (card: BoardCard) => ReactNode;
  padding: string;
  look: KanbanLook;
  width?: string;
  collapsedHeight: unknown;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  compact: boolean;
  showCount: boolean;
  selectedKey?: string;
  draggable: boolean;
  emptyText: string;
  onSelect: (card: BoardCard) => void;
  onDelete?: (card: BoardCard) => void;
  onAdd?: (column: BoardColumn) => void;
  collapsed: boolean;
  onCollapse?: (columnId: string) => void;
  fixed: boolean;
  maxHeight?: number;
  minColumn?: number;
}

export const KanbanColumn = ({
  column,
  renderBody,
  padding,
  look,
  width,
  collapsedHeight,
  expandedKeys,
  onToggle,
  compact,
  showCount,
  selectedKey,
  draggable,
  emptyText,
  onSelect,
  onDelete,
  onAdd,
  collapsed,
  onCollapse,
  fixed,
  maxHeight,
  minColumn = 200,
}: KanbanColumnProps) => {
  // A board that fits its content still stops at its drawn height (maxHeight): past it the column scrolls like a
  // fixed board's. Without the cap, 40 loans stood a board 2,274px tall (2026-10-13).
  const scrolls = fixed || !!maxHeight;
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  const [shownCards, setShownCards] = useState(CARDS_PER_STEP);
  const hiddenCards = column.cards.length - shownCards;
  // On a board with a fixed height the cards scroll inside their column, fading out at the bottom while more are
  // below (Trello-like); a board that fits its content grows instead.
  const listRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!scrolls || !el) return undefined;
    const check = () => setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [scrolls, column.cards.length, shownCards]);
  // A collapsed column is a narrow strip: title read sideways and the count. It still takes dropped cards, and a
  // click opens it again. Both looks are one element around one card list, which a folded column keeps mounted and out
  // of sight: drawn as another element, the strip unmounted the cards, and a custom card's components lost what was
  // typed in them.
  const toggle = () => onCollapse?.(column.id);
  return (
    <div
      ref={setNodeRef}
      data-collapsed={collapsed ? 'true' : 'false'}
      {...(collapsed
        ? {
            role: 'button',
            tabIndex: 0,
            title: `Expand ${column.title}`,
            'aria-label': `Expand ${column.title}`,
            onClick: toggle,
            onKeyDown: (e: React.KeyboardEvent) => (isEnter(e) || (e.key === ' ' && !isComposing(e))) && toggle(),
          }
        : {})}
      // A set column width is the preferred width: columns shrink to fit the board (down to the minimum, or the set
      // width if narrower) before it scrolls; five 245px stages clipped their last column. Without one the columns
      // share the board, at least the minimum each: 200px, or 160px on a board of six or more stages (a seventh
      // stage was cut off at the right edge of a full-width board). Columns grow to fill a wider board, as table
      // columns do: four 250px stages left a 165px empty strip at the right of a full-width board (2026-10-14).
      style={
        collapsed
          ? { ...look.column, width: 152, flex: '0 0 152px' }
          : {
              ...(width
                ? { ...look.column, width, flex: `1 1 ${width}`, minWidth: `min(${width}, ${minColumn}px)` }
                : { ...look.column, minWidth: `${minColumn}px` }),
              ...(!fixed && maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
            }
      }
      className={
        collapsed
          ? cn(
              'group/col tw-relative tw-flex tw-cursor-pointer tw-flex-col tw-gap-2 tw-p-3 tw-transition-shadow hover:tw-ring-1 hover:tw-ring-ui2-border focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring',
              look.columnFramed && 'tw-border tw-border-[color:var(--kb-column-border)]',
              isOver && 'tw-ring-1 tw-ring-ui2-primary'
            )
          : cn(
              'group/col tw-flex tw-flex-col tw-p-3 tw-transition-shadow',
              look.columnFramed && 'tw-border tw-border-[color:var(--kb-column-border)]',
              scrolls && 'tw-min-h-0 tw-overflow-hidden',
              !width && 'tw-flex-1',
              compact ? 'tw-gap-1.5' : 'tw-gap-2',
              isOver && 'tw-ring-1 tw-ring-ui2-border'
            )
      }
    >
      {collapsed ? (
        // A folded lane keeps its title across, with the count on the open columns' header line: a 44px sliver of
        // vertical text read as a broken column in reviews.
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <span className={cn('tw-truncate tw-text-ui2-sm tw-font-semibold', COLUMN_TITLE)}>{column.title}</span>
          {showCount ? (
            <Badge variant="secondary" className={cn('tw-shrink-0 tw-px-1.5 tw-tabular-nums', COUNT_BADGE)}>
              {column.cards.length}
            </Badge>
          ) : null}
        </div>
      ) : (
        <div className="tw-mb-1 tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-1">
          <span className={cn('tw-truncate tw-text-ui2-sm tw-font-semibold', COLUMN_TITLE)}>{column.title}</span>
          <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
            {showCount ? (
              <Badge variant="secondary" className={cn('tw-tabular-nums', COUNT_BADGE)}>
                {column.cards.length}
              </Badge>
            ) : null}
            {onCollapse ? (
              <button
                type="button"
                title={`Collapse ${column.title}`}
                aria-label={`Collapse ${column.title}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onCollapse(column.id)}
                className="tw-rounded-ui2-md tw-p-0.5 tw-text-ui2-muted-foreground tw-opacity-0 tw-transition hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring group-hover/col:tw-opacity-100"
              >
                <ChevronLeft className="tw-h-4 tw-w-4" />
              </button>
            ) : null}
          </div>
        </div>
      )}
      <div
        ref={listRef}
        style={collapsed ? { display: 'none' } : scrolls && moreBelow ? BOTTOM_FADE : undefined}
        className={cn(
          'tw-flex tw-flex-col',
          compact ? 'tw-gap-1.5' : 'tw-gap-2',
          // The selected card's ring draws outside it: the scrolling list keeps a 4px margin on every side so it does
          // not clip the first or last card's ring.
          scrolls && '-tw-m-1 tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-1 [&>*]:tw-shrink-0'
        )}
      >
        {column.cards.length ? (
          column.cards
            .slice(0, shownCards)
            .map((card) => (
              <KanbanCard
                key={card.__key}
                card={card}
                columnId={column.id}
                renderBody={renderBody}
                padding={padding}
                look={look}
                collapse={{ height: collapsedHeight, expanded: expandedKeys.has(card.__key), onToggle }}
                selected={card.__key === selectedKey}
                draggable={draggable}
                hidden={collapsed}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
        ) : (
          <div className="tw-rounded-ui2-lg tw-border tw-border-dashed tw-px-3 tw-py-6 tw-text-center tw-text-xs tw-text-ui2-muted-foreground">
            {emptyText}
          </div>
        )}
        <ShowMore
          remaining={hiddenCards}
          step={CARDS_PER_STEP}
          onMore={() => setShownCards((n) => n + CARDS_PER_STEP)}
          onPointerDown={(e) => e.stopPropagation()}
          className="tw-rounded-ui2-md tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-text-ui2-muted-foreground tw-transition-colors hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground"
        />
        {onAdd ? (
          <button
            type="button"
            onClick={() => onAdd(column)}
            className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-ui2-md tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-text-ui2-muted-foreground tw-transition-colors hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground"
          >
            <Plus className="tw-h-4 tw-w-4" />
            Add card
          </button>
        ) : null}
      </div>
      {collapsed ? (
        <span
          className={cn(
            'tw-flex tw-items-center tw-gap-1 tw-text-xs group-hover/col:tw-text-ui2-foreground',
            SECONDARY_TEXT
          )}
        >
          <ChevronRight className="tw-h-3.5 tw-w-3.5" />
          Show cards
        </span>
      ) : null}
    </div>
  );
};
