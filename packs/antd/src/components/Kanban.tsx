import React, { useId, useRef } from 'react';
import { Badge, Button, Card, Descriptions, Empty, Progress, Skeleton, Tag, Typography } from 'antd';
import { CloseOutlined, DownOutlined, LeftOutlined, PlusOutlined, RightOutlined, UpOutlined } from '@ant-design/icons';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { SpinOver } from '../lib/Loading';
import { RADIUS_LG_HINT } from '../lib/themeStyles';
import { cardClamp, cardDateLabel, cardDetails, type BoardCard } from '../lib/ui2/display/kanban/board';
import { BADGE_BY_WORD, isSet } from '../lib/ui2/display/kanban/look';
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
import { chipLabel, colorFor } from '../lib/ui2/display/lists/model';
import { RowAvatar, toneTag } from './Composite';

// The shadcn pack's Kanban (UI 2.0's) in Ant parts: columns of small Cards with a count Badge, Tags for the badge and
// tags, Progress, an Avatar, Descriptions for the clicked card's details, text Buttons. The board's behaviour (fields
// or custom cards, drag and keyboard moves, collapsible columns, details, actions and events) is the shared useKanban.

const cls = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ');
// A card's text: a stored ISO date or timestamp as a short date, anything else as written.
const shown = (value: unknown): string => cardDateLabel(value) ?? String(value);
// A priority or severity word as Ant's status colours; other words go by their tone (done, overdue...).
const WORD_TAG: Record<string, string> = { destructive: 'error', warning: 'warning', success: 'success' };
const badgeTag = (value: unknown, colors: unknown) =>
  colorFor(value, colors) ?? WORD_TAG[BADGE_BY_WORD[String(value).toLowerCase()] ?? ''] ?? toneTag(value);

const CardBody = ({ card, fields, badgeColors, expanded }: { card: BoardCard; fields: CardFields; badgeColors: unknown; expanded: boolean }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress && isSet(card[fields.progress]) ? Number(card[fields.progress]) : NaN;
  const details = expanded && fields.details ? cardDetails(card[fields.details]) : [];
  return (
    <>
      <Typography.Text strong className="tj-ant-kb-card-title">
        {String(card[fields.title] ?? '')}
      </Typography.Text>
      {fields.description && isSet(card[fields.description]) ? (
        <Typography.Paragraph type="secondary" className="tj-ant-kb-card-text">
          {shown(card[fields.description])}
        </Typography.Paragraph>
      ) : null}
      {tags.length ? (
        <div className="tj-ant-kb-tags">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}
      {Number.isFinite(progress) ? (
        <Progress
          className="tj-ant-kb-progress"
          percent={Math.round(Math.max(0, Math.min(100, progress)))}
          size="small"
          status="normal"
          strokeColor="var(--kb-progress, var(--ant-color-primary))"
        />
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        <div className="tj-ant-kb-foot">
          {isSet(badge) ? <Tag color={badgeTag(badge, badgeColors)}>{chipLabel(badge)}</Tag> : null}
          {isSet(meta) ? (
            <Typography.Text type="secondary" ellipsis className="tj-ant-kb-meta" title={String(meta)}>
              {shown(meta)}
            </Typography.Text>
          ) : null}
          {isSet(avatar) ? (
            <span className="tj-ant-kb-avatar" title={isImage(avatar) ? undefined : String(avatar)}>
              <RowAvatar image={isImage(avatar) ? String(avatar) : ''} name={String(avatar)} size={24} />
            </span>
          ) : null}
        </div>
      ) : null}
      {details.length ? (
        <Descriptions
          className="tj-ant-kb-details"
          size="small"
          layout="vertical"
          colon={false}
          column={2}
          items={details.map((row, i) => ({
            key: `${row.label}-${i}`,
            label: row.label || undefined,
            children: row.value,
            span: row.value.length > SHORT_DETAIL ? 2 : 1,
          }))}
        />
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
      size="small"
      hoverable
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
        'tj-ant-kb-card',
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
        <Button
          type="text"
          size="small"
          className="tj-ant-kb-del"
          icon={<CloseOutlined />}
          aria-label="Delete card"
          title="Delete card"
          onClick={(e) => {
            e.stopPropagation();
            kb.doDelete(card.__key);
          }}
        />
      ) : null}
      <div className={cls('tj-ant-kb-clamp', !!clamp.maxHeight && 'is-clamped')} style={clamp.collapsible ? { maxHeight: clamp.maxHeight } : undefined}>
        <div ref={contentRef}>
          {kb.custom ? (
            <ToolJet.RowSlot name="card" index={kb.order.get(card.__key) ?? 0} item={strip(card)} />
          ) : (
            <CardBody card={card} fields={kb.fields} badgeColors={kb.badgeColors} expanded={card.__key === kb.openKey} />
          )}
        </div>
      </div>
      {clamp.collapsible ? (
        <Button
          size="small"
          shape="round"
          className="tj-ant-kb-more"
          aria-expanded={expanded}
          icon={expanded ? <UpOutlined /> : <DownOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            kb.toggleExpanded(card.__key);
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      ) : null}
    </Card>
  );
};

/** A column's card list: scrolls inside the board, fading out at the bottom while more cards are below. */
const CardList = ({ collapsed, depsKey, children }: { collapsed: boolean; depsKey: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const moreBelow = useMoreAhead(ref, 'y', [depsKey, collapsed]);
  return (
    <div ref={ref} className={cls('tj-ant-kb-list', moreBelow && 'has-more-below')} style={collapsed ? { display: 'none' } : undefined}>
      {children}
    </div>
  );
};

/** Three columns of loading Cards, the board's first load. */
const BoardSkeleton = () => (
  <div className="tj-ant-kb" aria-busy>
    {[3, 2, 1].map((n, c) => (
      <section key={c} className="tj-ant-kb-col is-fill">
        <Skeleton title={{ width: '40%' }} paragraph={false} active />
        {Array.from({ length: n }, (_, i) => (
          <Card key={i} size="small" loading />
        ))}
      </section>
    ))}
  </div>
);

const Board = ({ kb, loading }: { kb: KanbanModel; loading: boolean }) => {
  const helpId = useId();
  if (loading && kb.allCards.length === 0) return <BoardSkeleton />;
  if (!loading && kb.board.length === 0) return <Empty className="tj-ant-kb-none" description={kb.emptyText} />;
  return (
    <div
      ref={kb.boardRef}
      className={cls('tj-ant-kb', kb.compact && 'is-compact', kb.moreRight && 'has-more-right')}
      style={kb.vars}
      onDragEnd={kb.endDrag}
    >
      <span id={helpId} className="tj-ant-kb-sr">
        {KEYBOARD_HELP}
      </span>
      <span className="tj-ant-kb-sr" aria-live="polite">
        {kb.announce}
      </span>
      {kb.columnViews.map(({ column, cards, hidden, isCollapsed, over, fill, style, dropLineAt }) => {
        const toggle = () => kb.toggleColumn(column.id);
        const dropLine = (before: string | null) => (dropLineAt(before) ? <div className="tj-ant-kb-drop" aria-hidden="true" /> : null);
        const count = kb.showCount ? <Badge className="tj-ant-kb-count" count={column.cards.length} showZero overflowCount={9999} /> : null;
        return (
          <section
            key={column.id}
            data-kb-col={column.id}
            className={cls('tj-ant-kb-col', isCollapsed && 'is-collapsed', fill && 'is-fill', over && 'is-over')}
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
            <div className="tj-ant-kb-head">
              <span className="tj-ant-kb-title">
                {column.color ? <Badge color={column.color} /> : null}
                <Typography.Text strong ellipsis>
                  {column.title}
                </Typography.Text>
              </span>
              <span className="tj-ant-kb-head-end">
                {count}
                {!isCollapsed && kb.collapsibleColumns ? (
                  <Button
                    type="text"
                    size="small"
                    className="tj-ant-kb-fold"
                    icon={<LeftOutlined />}
                    title={`Collapse ${column.title}`}
                    aria-label={`Collapse ${column.title}`}
                    onClick={toggle}
                  />
                ) : null}
              </span>
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
                <div className="tj-ant-kb-empty">{kb.emptyText}</div>
              )}
              {cards.length ? dropLine(null) : null}
              {hidden > 0 ? (
                <Button type="text" block className="tj-ant-kb-btn" onClick={() => kb.showMoreCards(column.id)}>
                  Show {Math.min(hidden, 100)} more
                </Button>
              ) : null}
              {kb.allowAdd ? (
                <Button type="text" block className="tj-ant-kb-btn" icon={<PlusOutlined />} onClick={() => kb.onAdd(column)}>
                  Add card
                </Button>
              ) : null}
            </CardList>
            {isCollapsed ? (
              <Typography.Text type="secondary" className="tj-ant-kb-show">
                <RightOutlined />
                Show cards
              </Typography.Text>
            ) : null}
          </section>
        );
      })}
      {kb.moreColumns > 0 ? (
        <Button type="text" className="tj-ant-kb-btn" style={{ alignSelf: 'flex-start', width: 'auto' }} onClick={kb.showMoreColumns}>
          Show {Math.min(kb.moreColumns, 50)} more
        </Button>
      ) : null}
    </div>
  );
};

// Ant Kanban: dataSource (the cards) grouped by statusField into columns [{ id, title, color }]; cards show the mapped
// fields (title, description, badge, tags, progress, meta, avatar, details) or a row of ToolJet components (cardLayout
// custom, {{listItem}}). Drag or keyboard moves, add and delete buttons and the actions change the board at once and
// publish updatedCardData with the last moved, added, updated or removed card and an event, for a query to save.
export const Kanban = () => {
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  const kb = useKanban({
    dataName: 'dataSource',
    radiusHints: { column: RADIUS_LG_HINT, card: RADIUS_LG_HINT },
    sample: [
      { id: 1, title: 'Draft the brief', description: 'Goals, audience and timeline', status: 'todo', priority: 'High', owner: 'Ada Lovelace' },
      { id: 2, title: 'Collect references', description: 'Three competitor sites', status: 'todo', priority: 'Low', owner: 'Alan Turing' },
      { id: 3, title: 'Review designs', description: 'Home and pricing pages', status: 'doing', priority: 'Medium', owner: 'Grace Hopper' },
      { id: 4, title: 'Ship v1', description: 'Release notes and announcement', status: 'done', priority: 'Normal', owner: 'Katherine Johnson' },
    ],
    columns: [
      { id: 'todo', title: 'To do' },
      { id: 'doing', title: 'In progress' },
      { id: 'done', title: 'Done' },
    ],
    defaults: { description: 'description', badge: 'priority', avatar: 'owner' },
    // The Ant Kanban's own action parameter names, which saved event handlers use.
    params: { id: 'cardId', values: 'values' },
    shadow: 'none',
    disabled,
    loading,
  });
  // Reloading keeps the board on screen under Ant's Spin.
  const reloading = loading && kb.allCards.length > 0;
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-kanban">
      <SpinOver loading={reloading} as="fill">
        <Board kb={kb} loading={loading} />
      </SpinOver>
    </AntProvider>
  );
};
