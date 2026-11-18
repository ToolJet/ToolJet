import React, { useState } from 'react';
import { Link, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { RelationFormCard } from './RelationFormCard';
import { RelationSummaryCard } from './RelationSummaryCard';
import { SectionHeader } from './SectionHeader';
import type { useTableDraft } from './useTableDraft';

const DOCS = 'https://docs.tooljet.com/docs/tooljet-db/constraints/foreign-key';

type RelationListProps = {
  tableName: string;
  draft: ReturnType<typeof useTableDraft>;
};

// 'new' = adding; an id = editing that relation; null = nothing open.
type Open = 'new' | string | null;

// The table's foreign key relations. One form is open at a time, and the "Add relation" button hides while it is.
export function RelationList({ tableName, draft }: RelationListProps) {
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);

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
            columns={draft.columns}
            relation={relation}
            onCancel={close}
            onSave={(next) => {
              draft.updateRelation(relation.id, next);
              close();
            }}
          />
        ) : (
          <RelationSummaryCard
            key={relation.id}
            relation={relation}
            sourceTableName={tableName}
            onEdit={() => setOpen(relation.id)}
            onDelete={() => draft.removeRelation(relation.id)}
          />
        )
      )}
      {open === 'new' && (
        <RelationFormCard
          tableName={tableName}
          columns={draft.columns}
          onCancel={close}
          onSave={(next) => {
            draft.addRelation(next);
            close();
          }}
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
