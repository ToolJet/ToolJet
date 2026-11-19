import React from 'react';
import { ArrowRight, SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Tag } from '@/components/ui/Rocket/Tag/Tag';
import type { DraftRelation } from './types';

type RelationSummaryCardProps = {
  relation: DraftRelation;
  sourceTableName: string;
  /** wide (880 drawer): tags share the row; narrow (560 column drawer): they wrap below it. */
  layout?: 'wide' | 'narrow';
  onEdit: () => void;
  onDelete: () => void;
};

const Endpoint = ({ column, table }: { column: string; table: string }) => (
  <div className="tw-min-w-0 tw-flex-1">
    <div className="tw-truncate tw-font-title-default tw-text-text-default">{column}</div>
    <div className="tw-truncate tw-font-body-small tw-text-text-placeholder">{table}</div>
  </div>
);

// A saved relation, collapsed (Figma: Relation summary row): source, arrow, target, the two actions as tags, edit and
// delete. Long names truncate. In the narrow layout the tags wrap to a second row.
export function RelationSummaryCard({
  relation,
  sourceTableName,
  layout = 'wide',
  onEdit,
  onDelete,
}: RelationSummaryCardProps) {
  const [sourceColumn] = relation.column_names;
  const [targetColumn] = relation.referenced_column_names;
  const tags = (
    <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-gap-1.5">
      <Tag variant="outline" prefix="On update">
        {relation.on_update}
      </Tag>
      <Tag variant="outline" prefix="On remove">
        {relation.on_delete}
      </Tag>
    </div>
  );
  return (
    <div
      className="tw-flex tw-flex-col tw-items-start tw-gap-2.5 tw-rounded-default tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-py-3 tw-pl-4 tw-pr-2"
      data-cy={`relation-card-${sourceColumn}`}
    >
      <div className="tw-flex tw-w-full tw-items-center tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-4">
          <Endpoint column={sourceColumn} table={sourceTableName} />
          <ArrowRight className="tw-size-4 tw-shrink-0 tw-text-icon-strong" aria-hidden />
          <Endpoint column={targetColumn} table={relation.referenced_table_name} />
        </div>
        {layout === 'wide' && tags}
        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-0.5">
          <Button
            variant="ghost"
            iconOnly
            size="medium"
            aria-label={`Edit relation on ${sourceColumn}`}
            onClick={onEdit}
          >
            <SquarePen />
          </Button>
          <Button
            variant="ghost"
            iconOnly
            size="medium"
            danger
            aria-label={`Delete relation on ${sourceColumn}`}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {layout === 'narrow' && tags}
    </div>
  );
}
