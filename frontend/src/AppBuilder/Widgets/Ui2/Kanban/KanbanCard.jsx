import React, { useLayoutEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Avatar, AvatarFallback, Badge, Progress, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { useCanvasFit } from '@/AppBuilder/Widgets/Ui2/_shared/canvasFit';
import { badgeLook, isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { cardClamp, cardDateLabel, cardDetails } from './kanbanBoard';

const BADGE_BY_WORD = {
  critical: 'destructive',
  urgent: 'destructive',
  high: 'destructive',
  blocked: 'destructive',
  medium: 'warning',
  normal: 'secondary',
  low: 'secondary',
  done: 'success',
};

// A card's secondary text (description, meta, progress): the cardTextColor style, else the theme's muted text.
export const SECONDARY_TEXT = 'text-[color:var(--kb-card-text,var(--sc-muted-foreground))]';

const asTags = (value) =>
  (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
    .map((tag) => String(tag?.label ?? tag).trim())
    .filter(Boolean);

// A detail longer than this takes the card's full width; shorter ones (an amount, a date) sit two to a row.
const SHORT_DETAIL = 22;

// A card's text: a stored ISO date or timestamp as a short date, anything else as written.
const shown = (value) => cardDateLabel(value) ?? String(value);

export const CardBody = ({ card, fields, compact, badgeColors, progressStyle, expanded }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress ? Number(card[fields.progress]) : NaN;
  const details = expanded && fields.details ? cardDetails(card[fields.details]) : [];
  return (
    <>
      <p
        className={cn(
          'pr-5 font-medium leading-snug text-[color:var(--kb-card-title,var(--sc-card-foreground))]',
          compact ? 'text-[13px]' : 'text-sm'
        )}
      >
        {String(card[fields.title] ?? '')}
      </p>
      {fields.description && isSet(card[fields.description]) ? (
        <p className={cn('line-clamp-2 text-xs', SECONDARY_TEXT, compact ? 'mt-0.5' : 'mt-1')}>
          {shown(card[fields.description])}
        </p>
      ) : null}
      {tags.length ? (
        <div className={cn('flex flex-wrap gap-1', compact ? 'mt-1.5' : 'mt-2')}>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      {Number.isFinite(progress) ? (
        <div style={progressStyle} className={cn('flex items-center gap-2', compact ? 'mt-1.5' : 'mt-2.5')}>
          <Progress value={Math.max(0, Math.min(100, progress))} className="h-1.5" />
          <span className={cn('text-[11px] tabular-nums', SECONDARY_TEXT)}>{Math.round(progress)}%</span>
        </div>
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        // Wraps beside a wide badge, the meta moving whole to the next line, before the meta is cut ("28 Oct 2...").
        <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', compact ? 'mt-2' : 'mt-3')}>
          {isSet(badge) ? (
            badgeLook(badge, badgeColors) ? (
              <Badge
                variant="outline"
                style={badgeLook(badge, badgeColors)}
                className="shrink-0 border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]"
              >
                {String(badge)}
              </Badge>
            ) : (
              <Badge variant={BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'} className="shrink-0">
                {String(badge)}
              </Badge>
            )
          ) : null}
          {isSet(meta) ? (
            // One line: in a narrow column a date wrapped across lines; the whole text is in the tooltip.
            <span title={String(meta)} className={cn('min-w-0 truncate whitespace-nowrap text-xs', SECONDARY_TEXT)}>
              {shown(meta)}
            </span>
          ) : null}
          {isSet(avatar) ? (
            <Avatar className="ml-auto h-6 w-6">
              <AvatarFallback className="text-[10px]">{initials(avatar)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}
      {details.length ? (
        // The clicked card's details, under a hairline: short values two to a row, long ones (a note) full width.
        // mb-0 and font-normal: the app's global dl and dt styles (a bottom margin, bold terms) leak in otherwise.
        <dl
          className={cn(
            'mb-0 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[color:var(--sc-border)]',
            compact ? 'mt-2 pt-2' : 'mt-3 pt-2.5'
          )}
        >
          {details.map((row, i) => (
            <div key={`${row.label}-${i}`} className={cn('min-w-0', row.value.length > SHORT_DETAIL && 'col-span-2')}>
              {row.label ? (
                <dt className={cn('text-[11px] font-normal leading-4', SECONDARY_TEXT)}>{row.label}</dt>
              ) : null}
              <dd
                className={cn(
                  'm-0 break-words text-[color:var(--kb-card-title,var(--sc-card-foreground))]',
                  row.value.length > SHORT_DETAIL
                    ? 'whitespace-pre-line text-xs leading-relaxed'
                    : 'text-[13px] font-medium tabular-nums'
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
};

export const KanbanCard = ({
  card,
  columnId,
  renderBody,
  padding,
  look,
  collapse,
  selected,
  draggable,
  onSelect,
  onDelete,
}) => {
  const data = { type: 'card', key: card.__key, columnId };
  const drag = useDraggable({ id: card.__key, data, disabled: !draggable });
  const drop = useDroppable({ id: `drop-${card.__key}`, data });
  // Collapsed height: the content's natural height decides whether the card collapses at all.
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!isSet(collapse.height) || !el) return undefined;
    const measure = () => setContentHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapse.height]);
  const clamp = cardClamp(collapse.height, contentHeight, collapse.expanded);
  return (
    <div
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      {...drag.attributes}
      {...drag.listeners}
      // In the editor a drag that starts on a card moves the card, not the whole board (the canvas skips it).
      data-tj-inner-drag=""
      onClick={() => onSelect(card)}
      // Enter activates the card as a click does (select it, onCardClicked, its details); Space picks it up to move
      // (KANBAN_KEYS). While a card is being moved, Enter drops it instead.
      onKeyDown={(e) => {
        drag.listeners?.onKeyDown?.(e);
        if (e.key === 'Enter' && !drag.isDragging && e.target === e.currentTarget) {
          e.preventDefault();
          onSelect(card);
        }
      }}
      style={look.card}
      className={cn(
        'group/card relative overflow-hidden border text-card-foreground transition-colors hover:border-primary/40',
        padding,
        draggable && 'cursor-grab active:cursor-grabbing',
        selected && 'border-primary ring-1 ring-primary',
        drop.isOver && 'border-t-2 border-t-primary',
        drag.isDragging && 'opacity-40'
      )}
    >
      {onDelete ? (
        <button
          type="button"
          aria-label="Delete card"
          title="Delete card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card);
          }}
          className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/card:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <div
        className="relative"
        style={clamp.collapsible ? { maxHeight: clamp.maxHeight, overflow: 'hidden' } : undefined}
      >
        <div ref={contentRef}>{renderBody(card)}</div>
        {clamp.maxHeight ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
            style={{ background: `linear-gradient(to bottom, transparent, ${look.card.background})` }}
          />
        ) : null}
      </div>
      {clamp.collapsible ? (
        // Shown on hover (or keyboard focus) only, over the card's bottom edge, so it takes no room at rest.
        <button
          type="button"
          aria-expanded={collapse.expanded}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            collapse.onToggle(card.__key);
          }}
          className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[11px] text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/card:opacity-100"
        >
          {collapse.expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {collapse.expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
};

/** A custom card's canvas: the components on the board's card, laid out with this card's data. With dynamic height
 *  on (in an app) the card grows with them, so a long text or an opened accordion is not cut off at cardHeight. */
export const CustomCardBody = ({ id, index, width, height: cardHeight, fit, editing, darkMode }) => {
  const [ref, height] = useCanvasFit(fit, cardHeight, '[data-card-canvas]', { shrink: true });
  return (
    // In the editor, a press inside the card edits its components instead of starting a card drag.
    <div
      ref={ref}
      data-card-canvas=""
      style={{ height }}
      onPointerDown={editing ? (e) => e.stopPropagation() : undefined}
    >
      {width > 0 ? (
        <SubContainer
          id={id}
          index={index}
          canvasWidth={width}
          canvasHeight={height}
          componentType="ShadKanban"
          styles={{ backgroundColor: 'transparent' }}
          darkMode={darkMode}
        />
      ) : null}
    </div>
  );
};
