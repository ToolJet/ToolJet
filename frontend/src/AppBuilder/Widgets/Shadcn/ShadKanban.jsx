import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { initials, list, useAutoHeight, useExposed } from '../packHooks';
import { Avatar, AvatarFallback, Badge, cn, getPortalRoot } from './ui';
import { Shell } from './Shadcn';
import { boardColumns, moveCard } from './kanbanBoard';

// shadcn/ui pack Kanban (experiment): a data-driven board. Columns are values of a status field and cards are rows
// of data shown by their title, description, badge, avatar and meta fields, so an agent builds it from a query alone.
// Dragging a card moves it on the board at once and publishes the move (movedCard, lastMove, onCardMoved) for a query
// to save; the board follows the data again when the data changes. Own lazy chunk (dnd-kit).

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

const CardBody = ({ card, fields }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  return (
    <>
      <p className="text-sm font-medium leading-snug">{String(card[fields.title] ?? '')}</p>
      {fields.description && card[fields.description] ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{String(card[fields.description])}</p>
      ) : null}
      {badge || avatar || meta ? (
        <div className="mt-3 flex items-center gap-2">
          {badge ? (
            <Badge variant={BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'}>{String(badge)}</Badge>
          ) : null}
          {meta ? <span className="text-xs text-muted-foreground">{String(meta)}</span> : null}
          {avatar ? (
            <Avatar className="ml-auto h-6 w-6">
              <AvatarFallback className="text-[10px]">{initials(avatar)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

const KanbanCard = ({ card, columnId, fields, selected, draggable, onSelect }) => {
  const data = { type: 'card', key: card.__key, columnId };
  const drag = useDraggable({ id: card.__key, data, disabled: !draggable });
  const drop = useDroppable({ id: `drop-${card.__key}`, data });
  return (
    <div
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      {...drag.attributes}
      {...drag.listeners}
      onClick={() => onSelect(card)}
      className={cn(
        'rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:border-primary/40',
        draggable && 'cursor-grab active:cursor-grabbing',
        selected && 'border-primary ring-1 ring-primary',
        drop.isOver && 'border-t-2 border-t-primary',
        drag.isDragging && 'opacity-40'
      )}
    >
      <CardBody card={card} fields={fields} />
    </div>
  );
};

const KanbanColumn = ({ column, fields, selectedKey, draggable, emptyText, onSelect }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[240px] flex-1 flex-col gap-2 rounded-xl bg-muted/60 p-3 transition-colors',
        isOver && 'bg-muted'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className="truncate text-sm font-semibold">{column.title}</span>
        <Badge variant="secondary" className="tabular-nums">
          {column.cards.length}
        </Badge>
      </div>
      {column.cards.length ? (
        column.cards.map((card) => (
          <KanbanCard
            key={card.__key}
            card={card}
            columnId={column.id}
            fields={fields}
            selected={card.__key === selectedKey}
            draggable={draggable}
            onSelect={onSelect}
          />
        ))
      ) : (
        <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </div>
      )}
    </div>
  );
};

export const ShadKanban = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const statusField = properties.statusField || 'status';
  const idField = properties.idField || 'id';
  const fields = {
    title: properties.titleField || 'title',
    description: properties.descriptionField || '',
    badge: properties.badgeField || '',
    avatar: properties.avatarField || '',
    meta: properties.metaField || '',
  };
  const fromData = useMemo(
    () => boardColumns(list(properties.data), list(properties.columns), statusField, idField),
    [properties.data, properties.columns, statusField, idField]
  );
  const [columns, setColumns] = useState(fromData);
  useEffect(() => setColumns(fromData), [fromData]);
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const strip = (card) => {
    if (!card) return {};
    const { __key, ...plain } = card;
    return plain;
  };
  useExposed(setExposedVariables, properties, {
    selectedCard: strip(selected),
    movedCard: lastMove?.card ?? {},
    lastMove: lastMove ?? {},
  });
  const draggable = properties.allowDrag !== false && !properties.disabledState;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const activeCard = activeKey ? columns.flatMap((c) => c.cards).find((c) => c.__key === activeKey) : null;
  const select = (card) => {
    setSelected(card);
    setExposedVariable('selectedCard', strip(card));
    fireEvent('onCardClicked');
  };
  const onDragEnd = ({ active, over }) => {
    setActiveKey(null);
    const target = over?.data?.current;
    if (!target) return;
    const before = target.type === 'card' ? target.key : null;
    const { columns: next, move } = moveCard(columns, active.id, target.columnId, before, statusField);
    if (!move) return;
    setColumns(next);
    setLastMove(move);
    setExposedVariable('movedCard', move.card);
    setExposedVariable('lastMove', move);
    fireEvent('onCardMoved');
  };
  return (
    <Shell {...props} innerRef={ref}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveKey(active.id)}
        onDragCancel={() => setActiveKey(null)}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-1">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              fields={fields}
              selectedKey={selected?.__key}
              draggable={draggable}
              emptyText={String(properties.emptyText || 'No cards')}
              onSelect={select}
            />
          ))}
        </div>
        {/* The preview renders at the body: ToolJet places widgets with CSS transforms, and position: fixed inside a
            transformed ancestor is offset by it, so the card trailed far from the pointer. The portal root carries
            .tj-shadcn, so the preview keeps the pack's styles; DragOverlay sizes it to the dragged card. */}
        {createPortal(
          <DragOverlay>
            {activeCard ? (
              <div className="h-full w-full rotate-1 rounded-lg border bg-card p-3 text-card-foreground shadow-lg">
                <CardBody card={activeCard} fields={fields} />
              </div>
            ) : null}
          </DragOverlay>,
          getPortalRoot()
        )}
      </DndContext>
    </Shell>
  );
};
