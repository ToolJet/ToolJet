import React, { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { SubContainer } from '@/AppBuilder/Widgets/Ui2/_shared/SubContainer';
import { useFittedRowHeight } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Avatar, AvatarFallback, Badge, Progress, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { badgeLook, isSet, kanbanLook } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { cardClamp, cardDateLabel, cardDetails } from './kanbanBoard';
import type { BoardCard } from './kanbanBoard';

export type KanbanLook = ReturnType<typeof kanbanLook>;

/** The card fields the author maps (a field name, '' when unmapped). */
export interface CardFields {
  title: string;
  description: string;
  badge: string;
  tags: string;
  progress: string;
  avatar: string;
  meta: string;
  details: string;
}

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const BADGE_BY_WORD: Record<string, BadgeVariant> = {
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
export const SECONDARY_TEXT = 'tw-text-[color:var(--kb-card-text,var(--sc-muted-foreground))]';

const asTags = (value: unknown): string[] =>
  (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
    .map((tag) => String(tag?.label ?? tag).trim())
    .filter(Boolean);

// A detail longer than this takes the card's full width; shorter ones (an amount, a date) sit two to a row.
const SHORT_DETAIL = 22;

// A card's text: a stored ISO date or timestamp as a short date, anything else as written.
const shown = (value: unknown): string => cardDateLabel(value) ?? String(value);

interface CardBodyProps {
  card: BoardCard;
  fields: CardFields;
  compact: boolean;
  badgeColors: unknown;
  progressStyle: KanbanLook['progress'];
  expanded: boolean;
}

export const CardBody = ({ card, fields, compact, badgeColors, progressStyle, expanded }: CardBodyProps) => {
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
          'tw-pr-5 tw-font-medium tw-leading-snug tw-text-[color:var(--kb-card-title,var(--sc-card-foreground))]',
          compact ? 'tw-text-[13px]' : 'tw-text-ui2-sm'
        )}
      >
        {String(card[fields.title] ?? '')}
      </p>
      {fields.description && isSet(card[fields.description]) ? (
        <p className={cn('tw-line-clamp-2 tw-text-xs', SECONDARY_TEXT, compact ? 'tw-mt-0.5' : 'tw-mt-1')}>
          {shown(card[fields.description])}
        </p>
      ) : null}
      {tags.length ? (
        <div className={cn('tw-flex tw-flex-wrap tw-gap-1', compact ? 'tw-mt-1.5' : 'tw-mt-2')}>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="tw-px-1.5 tw-py-0 tw-text-[11px] tw-font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      {Number.isFinite(progress) ? (
        <div
          style={progressStyle}
          className={cn('tw-flex tw-items-center tw-gap-2', compact ? 'tw-mt-1.5' : 'tw-mt-2.5')}
        >
          <Progress value={Math.max(0, Math.min(100, progress))} className="tw-h-1.5" />
          <span className={cn('tw-text-[11px] tw-tabular-nums', SECONDARY_TEXT)}>{Math.round(progress)}%</span>
        </div>
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        // Wraps beside a wide badge, the meta moving whole to the next line, before the meta is cut ("28 Oct 2...").
        <div
          className={cn('tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1', compact ? 'tw-mt-2' : 'tw-mt-3')}
        >
          {isSet(badge) ? (
            badgeLook(badge, badgeColors) ? (
              <Badge
                variant="outline"
                style={badgeLook(badge, badgeColors) ?? undefined}
                className="tw-shrink-0 tw-border-transparent tw-bg-[color:var(--kb-badge-bg)] tw-text-[color:var(--kb-badge-fg)]"
              >
                {String(badge)}
              </Badge>
            ) : (
              <Badge variant={BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'} className="tw-shrink-0">
                {String(badge)}
              </Badge>
            )
          ) : null}
          {isSet(meta) ? (
            // One line: in a narrow column a date wrapped across lines; the whole text is in the tooltip.
            <span
              title={String(meta)}
              className={cn('tw-min-w-0 tw-truncate tw-whitespace-nowrap tw-text-xs', SECONDARY_TEXT)}
            >
              {shown(meta)}
            </span>
          ) : null}
          {isSet(avatar) ? (
            <Avatar className="tw-ml-auto tw-h-6 tw-w-6">
              <AvatarFallback className="tw-text-[10px]">{initials(avatar)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}
      {details.length ? (
        // The clicked card's details, under a hairline: short values two to a row, long ones (a note) full width.
        // mb-0 and font-normal: the app's global dl and dt styles (a bottom margin, bold terms) leak in otherwise.
        <dl
          className={cn(
            'tw-mb-0 tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-2 tw-border-t tw-border-[color:var(--sc-border)]',
            compact ? 'tw-mt-2 tw-pt-2' : 'tw-mt-3 tw-pt-2.5'
          )}
        >
          {details.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className={cn('tw-min-w-0', row.value.length > SHORT_DETAIL && 'tw-col-span-2')}
            >
              {row.label ? (
                <dt className={cn('tw-text-[11px] tw-font-normal tw-leading-4', SECONDARY_TEXT)}>{row.label}</dt>
              ) : null}
              <dd
                className={cn(
                  'tw-m-0 tw-break-words tw-text-[color:var(--kb-card-title,var(--sc-card-foreground))]',
                  row.value.length > SHORT_DETAIL
                    ? 'tw-whitespace-pre-line tw-text-xs tw-leading-relaxed'
                    : 'tw-text-[13px] tw-font-medium tw-tabular-nums'
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

/** A card's collapse: the collapsedHeight style, whether this card is expanded, and the toggle. */
export interface CardCollapse {
  height: unknown;
  expanded: boolean;
  onToggle: (key: string) => void;
}

interface KanbanCardProps {
  card: BoardCard;
  columnId: string;
  renderBody: (card: BoardCard) => ReactNode;
  padding: string;
  look: KanbanLook;
  collapse: CardCollapse;
  selected: boolean;
  draggable: boolean;
  onSelect: (card: BoardCard) => void;
  onDelete?: (card: BoardCard) => void;
}

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
}: KanbanCardProps) => {
  const data = { type: 'card', key: card.__key, columnId };
  const drag = useDraggable({ id: card.__key, data, disabled: !draggable });
  const drop = useDroppable({ id: `drop-${card.__key}`, data });
  // Collapsed height: the content's natural height decides whether the card collapses at all.
  const contentRef = useRef<HTMLDivElement>(null);
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
        'group/card tw-relative tw-overflow-hidden tw-border tw-text-ui2-card-foreground tw-transition-colors hover:tw-border-ui2-primary/40',
        padding,
        draggable && 'tw-cursor-grab active:tw-cursor-grabbing',
        selected && 'tw-border-ui2-primary tw-ring-1 tw-ring-ui2-primary',
        drop.isOver && 'tw-border-t-2 tw-border-t-ui2-primary',
        drag.isDragging && 'tw-opacity-40'
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
          className="tw-absolute tw-right-1.5 tw-top-1.5 tw-rounded-ui2-md tw-p-1 tw-text-ui2-muted-foreground tw-opacity-0 tw-transition-opacity hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground focus-visible:tw-opacity-100 group-hover/card:tw-opacity-100"
        >
          <X className="tw-h-3.5 tw-w-3.5" />
        </button>
      ) : null}
      <div
        className="tw-relative"
        style={clamp.collapsible ? { maxHeight: clamp.maxHeight, overflow: 'hidden' } : undefined}
      >
        <div ref={contentRef}>{renderBody(card)}</div>
        {clamp.maxHeight ? (
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-8"
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
          className="tw-absolute tw-bottom-1.5 tw-left-1/2 tw-flex -tw-translate-x-1/2 tw-items-center tw-gap-1 tw-rounded-full tw-border tw-bg-ui2-card tw-px-2 tw-py-0.5 tw-text-[11px] tw-text-ui2-muted-foreground tw-opacity-0 tw-shadow-sm tw-transition-opacity hover:tw-text-ui2-foreground focus-visible:tw-opacity-100 group-hover/card:tw-opacity-100"
        >
          {collapse.expanded ? <ChevronUp className="tw-h-3 tw-w-3" /> : <ChevronDown className="tw-h-3 tw-w-3" />}
          {collapse.expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
};

/** A custom card's canvas: the components on the board's card, laid out with this card's data. With dynamic height
 *  on (in an app) the card grows with them, so a long text or an opened accordion is not cut off at cardHeight. */
interface CustomCardBodyProps {
  id: string;
  index: number;
  card: BoardCard;
  width: number;
  height: number;
  fit: boolean;
  editing: boolean;
  currentLayout?: string;
  darkMode?: boolean;
}

export const CustomCardBody = ({
  id,
  index,
  card,
  width,
  height: cardHeight,
  fit,
  editing,
  currentLayout,
  darkMode,
}: CustomCardBodyProps) => {
  // Sized by the reflow as a list row is; a card with something hidden on it may also go below cardHeight.
  const height = useFittedRowHeight({ id, index, value: card, fit, height: cardHeight, currentLayout });
  return (
    // In the editor, a press inside the card edits its components instead of starting a card drag.
    <div data-card-canvas="" style={{ height }} onPointerDown={editing ? (e) => e.stopPropagation() : undefined}>
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
