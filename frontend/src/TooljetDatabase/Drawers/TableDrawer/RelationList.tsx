import React, { useState } from 'react';
import { Link, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { RelationFormCard } from './RelationFormCard';
import { RelationSummaryCard } from './RelationSummaryCard';
import { SectionHeader } from './SectionHeader';
import type { DraftColumn, DraftRelation, RelationPayload } from './types';
import type { useTableDraft } from './useTableDraft';

const DOCS = 'https://docs.tooljet.com/docs/tooljet-db/constraints/foreign-key';

/**
 * How a relation is saved. A new table keeps its relations in the draft until it is created; a stored table saves each
 * one as it changes, so its actions run the change and call `done` once it has gone through.
 */
export type RelationActions = {
  add: (relation: RelationPayload, done: () => void) => void;
  update: (relation: DraftRelation, next: RelationPayload, done: () => void) => void;
  remove: (relation: DraftRelation) => void;
};

type RelationListProps = {
  tableName: string;
  draft: ReturnType<typeof useTableDraft>;
  /** Defaults to changing the draft. */
  actions?: RelationActions;
  /** Columns a relation can start from. Defaults to every column of the draft. */
  sourceColumns?: DraftColumn[];
};

// 'new' = adding; an id = editing that relation; null = nothing open.
type Open = 'new' | string | null;

// The table's foreign key relations. One form is open at a time, and the "Add relation" button hides while it is.
export function RelationList({ tableName, draft, actions, sourceColumns }: RelationListProps) {
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const { add, update, remove }: RelationActions = actions ?? {
    add: (relation, done) => {
      draft.addRelation(relation);
      done();
    },
    update: (relation, next, done) => {
      draft.updateRelation(relation.id, next);
      done();
    },
    remove: (relation) => draft.removeRelation(relation.id),
  };
  const columns = sourceColumns ?? draft.columns;

  return (
    <section className="tw-flex tw-flex-col tw-gap-4" data-cy="relations-section">
      <SectionHeader
        title="Foreign key relations"
        description="Link a column in this table to a column in an existing table."
        docsHref={DOCS}
        action={
          open === null && (
            <Button
              variant="ghostBrand"
              size="medium"
              leadingVisual={<Plus />}
              onClick={() => setOpen('new')}
              data-cy="add-relation-button"
            >
              Add relation
            </Button>
          )
        }
      />
      {draft.relations.map((relation) =>
        open === relation.id ? (
          <RelationFormCard
            key={relation.id}
            tableName={tableName}
            columns={columns}
            relation={relation}
            onCancel={close}
            onSave={(next) => update(relation, next, close)}
          />
        ) : (
          <RelationSummaryCard
            key={relation.id}
            relation={relation}
            sourceTableName={tableName}
            onEdit={() => setOpen(relation.id)}
            onDelete={() => remove(relation)}
          />
        )
      )}
      {open === 'new' && (
        <RelationFormCard
          tableName={tableName}
          columns={columns}
          onCancel={close}
          onSave={(next) => add(next, close)}
        />
      )}
      {draft.relations.length === 0 && open === null && (
        <div className="tw-flex tw-h-[62px] tw-items-center tw-justify-center tw-gap-2 tw-rounded-default tw-border tw-border-dashed tw-border-border-default tw-px-4 tw-py-3 tw-font-body-default tw-text-text-placeholder">
          <Link className="tw-size-4 tw-text-icon-default" aria-hidden />
          No relations added yet
        </div>
      )}
    </section>
  );
}
