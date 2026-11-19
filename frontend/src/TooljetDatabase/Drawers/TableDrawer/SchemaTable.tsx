import React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SCHEMA_GRID, SchemaColumnRow } from './SchemaColumnRow';
import type { useTableDraft } from './useTableDraft';

type SchemaTableProps = {
  draft: ReturnType<typeof useTableDraft>;
  /** Rows can be dragged to reorder. Off for a stored table. */
  reorderable?: boolean;
};

// Rows move up and down only.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const HEADINGS = ['', 'Column name', 'Type', 'Default value', 'Primary', 'Not null', 'Unique', ''];

// The table's columns: one row each, reorderable by the grip for a new table.
export function SchemaTable({ draft, reorderable = true }: SchemaTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) draft.moveColumn(String(active.id), String(over.id));
  };

  return (
    <div role="table" aria-label="Columns" data-cy="schema-table">
      <div
        role="row"
        className={`${SCHEMA_GRID} tw-h-8 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-font-body-small tw-text-text-placeholder`}
      >
        {HEADINGS.map((heading, index) => (
          <div
            key={index}
            role="columnheader"
            className={index >= 4 && index <= 6 ? 'tw-text-center' : index > 0 ? 'tw-pl-2.5 tw-pr-2' : undefined}
          >
            {heading}
          </div>
        ))}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={draft.columns.map((column) => column.id)} strategy={verticalListSortingStrategy}>
          {draft.columns.map((column) => (
            <SchemaColumnRow
              key={column.id}
              column={column}
              columns={draft.columns}
              draft={draft}
              reorderable={reorderable}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
