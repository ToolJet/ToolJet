import React, { useId, useRef } from 'react';
import { Avatar, Box, Button, Card, Chip, IconButton, LinearProgress, Skeleton, Typography } from '@mui/material';
import type { ChipProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import Add from '@mui/icons-material/Add';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Close from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { SAMPLE } from '../lib/samples';
import { cardClamp, cardDateLabel, cardDetails, type BoardCard } from '../lib/ui2/display/kanban/board';
import { BADGE_BY_WORD, badgeLook, initials, isSet } from '../lib/ui2/display/kanban/look';
import {
  asTags,
  isImage,
  KEYBOARD_HELP,
  SHORT_DETAIL,
  strip,
  useContentHeight,
  useKanban,
  useMoreAhead,
  type CardFields,
  type KanbanModel,
} from '../lib/ui2/display/kanban/useKanban';

// The shadcn pack's Kanban (UI 2.0's) in MUI parts: columns of outlined Cards with a count Chip, Chips for the badge and
// tags, a determinate LinearProgress, an Avatar, IconButtons and text Buttons. The board's behaviour (fields or custom
// cards, drag and keyboard moves, collapsible columns, details, actions and events) is the shared useKanban.

const cls = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ');
// A card's text: a stored ISO date or timestamp as a short date, anything else as written.
const shown = (value: unknown): string => cardDateLabel(value) ?? String(value);
const BADGE_COLOR: Record<string, ChipProps['color']> = { destructive: 'error', warning: 'warning', success: 'success' };

const CardBody = ({ card, fields, badgeColors, expanded }: { card: BoardCard; fields: CardFields; badgeColors: unknown; expanded: boolean }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress && isSet(card[fields.progress]) ? Number(card[fields.progress]) : NaN;
  const details = expanded && fields.details ? cardDetails(card[fields.details]) : [];
  const mapped = isSet(badge) ? badgeLook(badge, badgeColors) : null;
  const word = isSet(badge) ? BADGE_BY_WORD[String(badge).toLowerCase()] : undefined;
  return (
    <>
      <Typography variant="body2" className="tj-mui-kb-card-title">
        {String(card[fields.title] ?? '')}
      </Typography>
      {fields.description && isSet(card[fields.description]) ? (
        <Typography variant="caption" component="p" className="tj-mui-kb-card-text">
          {shown(card[fields.description])}
        </Typography>
      ) : null}
      {tags.length ? (
        <div className="tj-mui-kb-tags">
          {tags.map((tag) => (
            <Chip key={tag} size="small" variant="outlined" label={tag} />
          ))}
        </div>
      ) : null}
      {Number.isFinite(progress) ? (
        <div className="tj-mui-kb-progress">
          <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, progress))} aria-label="Progress" />
          <Typography variant="caption" className="tj-mui-kb-pct">
            {Math.round(progress)}%
          </Typography>
        </div>
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        <div className="tj-mui-kb-foot">
          {isSet(badge) ? (
            <Chip
              size="small"
              label={String(badge)}
              className={mapped ? 'tj-mui-kb-badge is-mapped' : 'tj-mui-kb-badge'}
              style={mapped ?? undefined}
              color={mapped ? 'default' : BADGE_COLOR[word ?? ''] ?? 'default'}
              variant={mapped || word === 'secondary' ? 'filled' : 'outlined'}
            />
          ) : null}
          {isSet(meta) ? (
            <Typography variant="caption" noWrap className="tj-mui-kb-meta" title={String(meta)}>
              {shown(meta)}
            </Typography>
          ) : null}
          {isSet(avatar) ? (
            <Avatar className="tj-mui-kb-avatar" src={isImage(avatar) ? String(avatar) : undefined} title={isImage(avatar) ? undefined : String(avatar)}>
              {isImage(avatar) ? null : initials(avatar)}
            </Avatar>
          ) : null}
        </div>
      ) : null}
      {details.length ? (
        <dl className="tj-mui-kb-details">
          {details.map((row, i) => (
            <div key={`${row.label}-${i}`} className={row.value.length > SHORT_DETAIL ? 'is-long' : undefined}>
              {row.label ? (
                <Typography variant="caption" component="dt">
                  {row.label}
                </Typography>
              ) : null}
              <Typography variant="body2" component="dd">
                {row.value}
              </Typography>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
};

const KanbanCard = ({ kb, card, columnId, helpId }: { kb: KanbanModel; card: BoardCard; columnId: string; helpId: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const contentHeight = useContentHeight(contentRef, kb.collapsedHeight);
  const expanded = kb.expandedKeys.has(card.__key);
  const clamp = kb.custom ? { collapsible: false, maxHeight: undefined } : cardClamp(kb.collapsedHeight, contentHeight, expanded);
  const draggable = kb.draggable && !kb.picked;
  return (
    <Card
      variant="outlined"
      role="button"
      tabIndex={0}
      aria-roledescription="Draggable card"
      data-kb-card={card.__key}
      aria-describedby={helpId}
      aria-pressed={card.__key === kb.selectedKey}
      // In the editor a drag that starts on a card moves the card, not the whole widget.
      data-tj-inner-drag=""
      draggable={draggable}
      className={cls(
        'tj-mui-kb-card',
        kb.custom && 'is-custom',
        draggable && 'is-draggable',
        card.__key === kb.selectedKey && 'is-selected',
        kb.dragKey === card.__key && 'is-dragging',
        kb.picked === card.__key && 'is-picked'
      )}
      onClick={() => kb.select(card)}
      onKeyDown={(e) => kb.onCardKey(e, card, columnId)}
      onDragStart={(e) => kb.onCardDragStart(e, card.__key)}
      onDragEnd={kb.endDrag}
      onDragOver={(e) => kb.onDragOverCard(e, columnId, card.__key)}
    >
      {kb.allowDelete ? (
        <IconButton
          size="small"
          className="tj-mui-kb-del"
          aria-label="Delete card"
          title="Delete card"
          onClick={(e) => {
            e.stopPropagation();
            kb.doDelete(card.__key);
          }}
        >
          <Close fontSize="inherit" />
        </IconButton>
      ) : null}
      <div className={cls('tj-mui-kb-clamp', !!clamp.maxHeight && 'is-clamped')} style={clamp.collapsible ? { maxHeight: clamp.maxHeight } : undefined}>
        <div ref={contentRef}>
          {kb.custom ? (
            <ToolJet.RowSlot name="card" index={kb.order.get(card.__key) ?? 0} item={strip(card)} />
          ) : (
            <CardBody card={card} fields={kb.fields} badgeColors={kb.badgeColors} expanded={card.__key === kb.openKey} />
          )}
        </div>
      </div>
      {clamp.collapsible ? (
        <Chip
          size="small"
          variant="outlined"
          clickable
          className="tj-mui-kb-more"
          aria-expanded={expanded}
          icon={expanded ? <ExpandLess /> : <ExpandMore />}
          label={expanded ? 'Show less' : 'Show more'}
          onClick={(e) => {
            e.stopPropagation();
            kb.toggleExpanded(card.__key);
          }}
        />
      ) : null}
    </Card>
  );
};

/** A column's card list: scrolls inside the board, fading out at the bottom while more cards are below. */
const CardList = ({ collapsed, depsKey, children }: { collapsed: boolean; depsKey: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const moreBelow = useMoreAhead(ref, 'y', [depsKey, collapsed]);
  return (
    <div ref={ref} className={cls('tj-mui-kb-list', moreBelow && 'has-more-below')} style={collapsed ? { display: 'none' } : undefined}>
      {children}
    </div>
  );
};

/** Three columns of card Skeletons, the board's first load. */
const BoardSkeleton = () => (
  <Box className="tj-mui-kb" sx={boardSx} aria-busy>
    {[3, 2, 1].map((n, c) => (
      <section key={c} className="tj-mui-kb-col is-fill">
        <Skeleton width="40%" height={24} />
        {Array.from({ length: n }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </section>
    ))}
  </Box>
);

// The board's look from the MUI theme; each Kanban style (a --kb-* variable) replaces its theme value.
const boardSx = (t: Theme) => {
  const primary = t.palette.primary.main;
  const text2 = t.palette.text.secondary;
  const radius = Number(t.shape.borderRadius) || 4;
  const cardBorder = `var(--kb-card-border, ${t.palette.divider})`;
  const cardBg = `var(--kb-card-bg, ${t.palette.background.paper})`;
  return {
    '--ui-fg': t.palette.text.primary,
    position: 'relative',
    display: 'flex',
    gap: 'var(--kb-col-gap, 16px)',
    alignItems: 'stretch',
    height: '100%',
    overflowX: 'auto',
    paddingBottom: '4px',
    fontFamily: t.typography.fontFamily,
    '&.has-more-right': { maskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)' },
    '& .tj-mui-kb-col': {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minHeight: 0,
      padding: '12px',
      // A tint of the text colour shows on any page background (ToolJet's canvas is close to MUI's grey 100).
      border: `1px solid var(--kb-col-border, ${t.palette.divider})`,
      borderRadius: `var(--kb-col-radius, ${radius * 2}px)`,
      background: `var(--kb-col-bg, ${alpha(t.palette.text.primary, 0.04)})`,
      overflow: 'hidden',
      transition: t.transitions.create('box-shadow', { duration: t.transitions.duration.shorter }),
      '&.is-fill': { flex: '1 1 0' },
      // Inset: the board scrolls, and an outer ring was cut at its edges (the first column's left side).
      '&.is-over': { boxShadow: `inset 0 0 0 1px ${alpha(primary, 0.5)}` },
      '&.is-collapsed': { flex: '0 0 152px', width: 152, cursor: 'pointer' },
      '&.is-collapsed:hover': { boxShadow: `inset 0 0 0 1px ${t.palette.divider}` },
      '&:focus-visible': { outline: 'none', boxShadow: `inset 0 0 0 2px ${alpha(primary, 0.4)}` },
    },
    '&.is-compact .tj-mui-kb-col, &.is-compact .tj-mui-kb-list': { gap: '6px' },
    '& .tj-mui-kb-head': { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: 28, padding: '0 4px' },
    '& .tj-mui-kb-col.is-collapsed .tj-mui-kb-head': { padding: 0 },
    '& .tj-mui-kb-title': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      minWidth: 0,
      color: `var(--kb-col-title, ${t.palette.text.primary})`,
      '& > span:last-child': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    },
    '& .tj-mui-kb-dot': { flexShrink: 0, width: 8, height: 8, borderRadius: '50%' },
    '& .tj-mui-kb-head-end': { display: 'flex', flexShrink: 0, alignItems: 'center', gap: '2px' },
    '& .tj-mui-kb-count': {
      height: 20,
      fontWeight: 500,
      fontVariantNumeric: 'tabular-nums',
      background: `var(--kb-count-bg, ${alpha(primary, 0.12)})`,
      color: `var(--kb-count-fg, ${t.palette.primary.dark})`,
      ...(t.palette.mode === 'dark' ? { color: `var(--kb-count-fg, ${t.palette.primary.light})` } : {}),
    },
    '& .tj-mui-kb-fold': { color: text2, opacity: 0, transition: t.transitions.create('opacity') },
    '& .tj-mui-kb-col:hover .tj-mui-kb-fold, & .tj-mui-kb-fold:focus-visible': { opacity: 1 },
    '@media (hover: none)': { '& .tj-mui-kb-fold': { opacity: 1 } },
    '& .tj-mui-kb-show': { display: 'flex', alignItems: 'center', gap: '4px', color: `var(--kb-card-text, ${text2})` },
    '& .tj-mui-kb-list': {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      gap: '8px',
      minHeight: 0,
      margin: '-4px',
      padding: '4px',
      overflowY: 'auto',
      '& > *': { flexShrink: 0 },
      '&.has-more-below': { maskImage: 'linear-gradient(to bottom, #000 calc(100% - 48px), transparent)' },
    },
    '& .tj-mui-kb-empty': {
      padding: '24px 12px',
      border: `1px dashed ${t.palette.divider}`,
      borderRadius: `${radius * 1.5}px`,
      color: text2,
      textAlign: 'center',
    },
    '& .tj-mui-kb-btn': { justifyContent: 'flex-start', color: text2, flexShrink: 0 },
    // Card
    '& .tj-mui-kb-card': {
      position: 'relative',
      flexShrink: 0,
      padding: '12px',
      borderColor: cardBorder,
      borderRadius: `var(--kb-card-radius, ${radius}px)`,
      background: cardBg,
      boxShadow: 'var(--kb-card-shadow)',
      overflow: 'hidden',
      outline: 'none',
      transition: t.transitions.create(['border-color', 'opacity'], { duration: t.transitions.duration.shorter }),
      '&.is-custom': { padding: 0 },
      '&.is-draggable': { cursor: 'grab' },
      '&.is-draggable:active': { cursor: 'grabbing' },
      '&:hover': { borderColor: alpha(primary, 0.5) },
      '&:focus-visible': { boxShadow: `0 0 0 2px ${alpha(primary, 0.4)}` },
      '&.is-selected': { borderColor: primary, boxShadow: `0 0 0 1px ${primary}, var(--kb-card-shadow)` },
      '&.is-dragging': { opacity: 0.4 },
      '&.is-picked': { boxShadow: `0 0 0 2px ${primary}, ${t.shadows[8]}`, transform: 'rotate(1deg)' },
    },
    '&.is-compact .tj-mui-kb-card': { padding: '10px' },
    '&.is-compact .tj-mui-kb-card.is-custom': { padding: 0 },
    '& .tj-mui-kb-drop': { flexShrink: 0, height: 2, margin: '-4px 0', borderRadius: 2, background: primary },
    '& .tj-mui-kb-del': {
      position: 'absolute',
      top: 4,
      right: 4,
      zIndex: 1,
      fontSize: 16,
      color: text2,
      opacity: 0,
      transition: t.transitions.create('opacity'),
    },
    '& .tj-mui-kb-card:hover .tj-mui-kb-del, & .tj-mui-kb-del:focus-visible': { opacity: 1 },
    '& .tj-mui-kb-clamp': { position: 'relative' },
    '& .tj-mui-kb-clamp.is-clamped': {
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 'auto 0 0 0',
        height: 32,
        background: `linear-gradient(to bottom, transparent, ${cardBg})`,
        pointerEvents: 'none',
      },
    },
    '& .tj-mui-kb-more': {
      position: 'absolute',
      bottom: 6,
      left: '50%',
      transform: 'translateX(-50%)',
      background: cardBg,
      opacity: 0,
      transition: t.transitions.create('opacity'),
    },
    '& .tj-mui-kb-card:hover .tj-mui-kb-more, & .tj-mui-kb-more:focus-visible': { opacity: 1 },
    '& .tj-mui-kb-card-title': {
      paddingRight: '20px',
      color: `var(--kb-card-title, ${t.palette.text.primary})`,
      fontWeight: 500,
      overflowWrap: 'anywhere',
    },
    '& .tj-mui-kb-card-text': {
      display: '-webkit-box',
      margin: '4px 0 0',
      overflow: 'hidden',
      color: `var(--kb-card-text, ${text2})`,
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 2,
    },
    '& .tj-mui-kb-tags': { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' },
    '& .tj-mui-kb-progress': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '10px',
      '& .MuiLinearProgress-root': { flex: 1, height: 6, borderRadius: 3, backgroundColor: alpha(primary, 0.16) },
      '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: `var(--kb-progress, ${primary})` },
    },
    '& .tj-mui-kb-pct': { color: `var(--kb-card-text, ${text2})`, fontVariantNumeric: 'tabular-nums' },
    '& .tj-mui-kb-foot': { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: '12px' },
    '&.is-compact .tj-mui-kb-tags, &.is-compact .tj-mui-kb-progress': { marginTop: '6px' },
    '&.is-compact .tj-mui-kb-foot': { marginTop: '8px' },
    '& .tj-mui-kb-badge': { maxWidth: '100%', fontWeight: 500 },
    '& .tj-mui-kb-badge.is-mapped': { background: 'var(--kb-badge-bg)', color: 'var(--kb-badge-fg)' },
    '& .tj-mui-kb-meta': { minWidth: 0, color: `var(--kb-card-text, ${text2})` },
    '& .tj-mui-kb-avatar': { width: 24, height: 24, marginLeft: 'auto', fontSize: 11, fontWeight: 500 },
    '& .tj-mui-kb-details': {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '8px 12px',
      margin: '12px 0 0',
      paddingTop: '10px',
      borderTop: `1px solid ${t.palette.divider}`,
      '& > div': { minWidth: 0 },
      '& > div.is-long': { gridColumn: 'span 2' },
      '& dt': { display: 'block', color: `var(--kb-card-text, ${text2})` },
      '& dd': { margin: 0, color: `var(--kb-card-title, ${t.palette.text.primary})`, fontWeight: 500, overflowWrap: 'break-word' },
      '& > div.is-long dd': { fontWeight: 400, whiteSpace: 'pre-line' },
    },
    '& .tj-mui-kb-sr': { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' },
    // Reloading keeps the board on screen under a faded layer with MUI's LinearProgress along the top.
    '& .tj-mui-kb-reload': {
      position: 'absolute',
      inset: 0,
      zIndex: 2,
      background: alpha(t.palette.background.paper, 0.5),
      '& .MuiLinearProgress-root': { position: 'sticky', top: 0, left: 0 },
    },
  } as const;
};

const Board = ({ kb, loading }: { kb: KanbanModel; loading: boolean }) => {
  const helpId = useId();
  if (loading && kb.allCards.length === 0) return <BoardSkeleton />;
  return (
    <Box
      ref={kb.boardRef}
      className={cls('tj-mui-kb', kb.compact && 'is-compact', kb.moreRight && 'has-more-right')}
      data-tj-no-drag=""
      sx={boardSx}
      style={kb.vars}
      aria-busy={loading || undefined}
      onDragEnd={kb.endDrag}
    >
      <span id={helpId} className="tj-mui-kb-sr">
        {KEYBOARD_HELP}
      </span>
      <span className="tj-mui-kb-sr" aria-live="polite">
        {kb.announce}
      </span>
      {kb.columnViews.map(({ column, cards, hidden, isCollapsed, over, fill, style, dropLineAt }) => {
        const toggle = () => kb.toggleColumn(column.id);
        const dropLine = (before: string | null) => (dropLineAt(before) ? <div className="tj-mui-kb-drop" aria-hidden="true" /> : null);
        const count = kb.showCount ? <Chip size="small" className="tj-mui-kb-count" label={column.cards.length} /> : null;
        return (
          <section
            key={column.id}
            className={cls('tj-mui-kb-col', isCollapsed && 'is-collapsed', fill && 'is-fill', over && 'is-over')}
            style={style}
            {...(isCollapsed
              ? {
                  role: 'button',
                  tabIndex: 0,
                  title: `Expand ${column.title}`,
                  'aria-label': `Expand ${column.title}`,
                  onClick: toggle,
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      toggle();
                    }
                  },
                }
              : {})}
            onDragOver={(e) => kb.onDragOverColumn(e, column.id)}
            onDrop={kb.onDrop}
          >
            <div className="tj-mui-kb-head">
              <Typography variant="subtitle2" component="span" className="tj-mui-kb-title">
                {column.color ? <span className="tj-mui-kb-dot" style={{ background: column.color }} /> : null}
                <span>{column.title}</span>
              </Typography>
              <div className="tj-mui-kb-head-end">
                {count}
                {!isCollapsed && kb.collapsibleColumns ? (
                  <IconButton size="small" className="tj-mui-kb-fold" title={`Collapse ${column.title}`} aria-label={`Collapse ${column.title}`} onClick={toggle}>
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                ) : null}
              </div>
            </div>
            <CardList collapsed={isCollapsed} depsKey={`${column.cards.length}:${cards.length}`}>
              {cards.length ? (
                cards.map((card) => (
                  <React.Fragment key={card.__key}>
                    {dropLine(card.__key)}
                    <KanbanCard kb={kb} card={card} columnId={column.id} helpId={helpId} />
                  </React.Fragment>
                ))
              ) : (
                <Typography variant="caption" component="div" className="tj-mui-kb-empty">
                  {kb.emptyText}
                </Typography>
              )}
              {cards.length ? dropLine(null) : null}
              {hidden > 0 ? (
                <Button size="small" color="inherit" className="tj-mui-kb-btn" onClick={() => kb.showMoreCards(column.id)}>
                  Show {Math.min(hidden, 100)} more
                </Button>
              ) : null}
              {kb.allowAdd ? (
                <Button size="small" color="inherit" className="tj-mui-kb-btn" startIcon={<Add />} onClick={() => kb.onAdd(column)}>
                  Add card
                </Button>
              ) : null}
            </CardList>
            {isCollapsed ? (
              <Typography variant="caption" className="tj-mui-kb-show">
                <ChevronRight fontSize="inherit" />
                Show cards
              </Typography>
            ) : null}
          </section>
        );
      })}
      {kb.moreColumns > 0 ? (
        <Button size="small" color="inherit" className="tj-mui-kb-btn" sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }} onClick={kb.showMoreColumns}>
          Show {Math.min(kb.moreColumns, 50)} more
        </Button>
      ) : null}
      {loading ? (
        <div className="tj-mui-kb-reload">
          <LinearProgress />
        </div>
      ) : null}
    </Box>
  );
};

// MUI Kanban: data (the cards) grouped by statusField into columns [{ id, title, color }]; cards show the mapped fields
// (title, description, badge, tags, progress, meta, avatar, details) or a row of ToolJet components (cardLayout custom,
// reading {{cardData}}, as UI 2.0's, or {{listItem}}). Drag or keyboard moves, add and delete buttons and the actions
// change the board at once and publish updatedCardData with the last moved, added, updated or removed card and an event, for a query to save.
export const Kanban = () => {
  const { disabled, loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  const kb = useKanban({
    dataName: 'data',
    sample: SAMPLE.kanban,
    columns: SAMPLE.kanbanColumns,
    defaults: { description: 'description', badge: 'priority', avatar: 'owner' },
    params: { id: 'id', values: 'value' },
    shadow: 'none',
    disabled,
  });
  return (
    <MuiProvider overrides={overrides} fill>
      <Board kb={kb} loading={loading} />
    </MuiProvider>
  );
};
