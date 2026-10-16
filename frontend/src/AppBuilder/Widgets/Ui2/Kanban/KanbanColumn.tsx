import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Badge, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { KanbanCard, SECONDARY_TEXT } from './KanbanCard';
import type { KanbanLook } from './KanbanCard';
import type { BoardCard, BoardColumn } from './kanbanBoard';

// Column title and count colours: the columnTitleColor and count styles, else the theme's.
const COLUMN_TITLE = 'text-[color:var(--kb-col-title,var(--sc-foreground))]';
const COUNT_BADGE =
  'bg-[color:var(--kb-count-bg,var(--sc-secondary))] text-[color:var(--kb-count-fg,var(--sc-secondary-foreground))]';

// A board draws this many cards a column at first, then this many more per "Show more" click (10k cards froze the
// page); and at most MAX_BOARD_COLUMNS columns (a 10k-item list bound as the columns).
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
  // click opens it again.
  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        data-collapsed="true"
        role="button"
        tabIndex={0}
        title={`Expand ${column.title}`}
        aria-label={`Expand ${column.title}`}
        onClick={() => onCollapse?.(column.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCollapse?.(column.id)}
        style={{ ...look.column, width: 152, flex: '0 0 152px' }}
        className={cn(
          'group/col relative flex cursor-pointer flex-col gap-2 p-3 transition-shadow hover:ring-1 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          look.columnFramed && 'border border-[color:var(--kb-column-border)]',
          isOver && 'ring-1 ring-primary'
        )}
      >
        {/* A folded lane keeps its title across, with the count on the open columns' header line: a 44px sliver of
            vertical text read as a broken column in reviews. */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn('truncate text-sm font-semibold', COLUMN_TITLE)}>{column.title}</span>
          {showCount ? (
            <Badge variant="secondary" className={cn('shrink-0 px-1.5 tabular-nums', COUNT_BADGE)}>
              {column.cards.length}
            </Badge>
          ) : null}
        </div>
        <span className={cn('flex items-center gap-1 text-xs group-hover/col:text-foreground', SECONDARY_TEXT)}>
          <ChevronRight className="h-3.5 w-3.5" />
          Show cards
        </span>
      </div>
    );
  }
  return (
    <div
      ref={setNodeRef}
      data-collapsed="false"
      // A set column width is the preferred width: columns shrink to fit the board (down to the minimum, or the set
      // width if narrower) before it scrolls; five 245px stages clipped their last column. Without one the columns
      // share the board, at least the minimum each: 200px, or 160px on a board of six or more stages (a seventh
      // stage was cut off at the right edge of a full-width board). Columns grow to fill a wider board, as table
      // columns do: four 250px stages left a 165px empty strip at the right of a full-width board (2026-10-14).
      style={{
        ...(width
          ? { ...look.column, width, flex: `1 1 ${width}`, minWidth: `min(${width}, ${minColumn}px)` }
          : { ...look.column, minWidth: `${minColumn}px` }),
        ...(!fixed && maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
      }}
      className={cn(
        'group/col flex flex-col p-3 transition-shadow',
        look.columnFramed && 'border border-[color:var(--kb-column-border)]',
        scrolls && 'min-h-0 overflow-hidden',
        !width && 'flex-1',
        compact ? 'gap-1.5' : 'gap-2',
        isOver && 'ring-1 ring-border'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className={cn('truncate text-sm font-semibold', COLUMN_TITLE)}>{column.title}</span>
        <div className="flex shrink-0 items-center gap-1">
          {showCount ? (
            <Badge variant="secondary" className={cn('tabular-nums', COUNT_BADGE)}>
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
              className="rounded-md p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/col:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={listRef}
        style={scrolls && moreBelow ? BOTTOM_FADE : undefined}
        className={cn(
          'flex flex-col',
          compact ? 'gap-1.5' : 'gap-2',
          scrolls && '-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [&>*]:shrink-0'
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
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
        ) : (
          <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        )}
        {hiddenCards > 0 ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShownCards((n) => n + CARDS_PER_STEP)}
            className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {`Show ${Math.min(hiddenCards, CARDS_PER_STEP)} more of ${hiddenCards}`}
          </button>
        ) : null}
        {onAdd ? (
          <button
            type="button"
            onClick={() => onAdd(column)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add card
          </button>
        ) : null}
      </div>
    </div>
  );
};
